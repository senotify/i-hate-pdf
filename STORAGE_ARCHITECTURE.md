# Storage Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         FileUpload Component                         │  │
│  │  • Drag & drop interface                            │  │
│  │  • Client-side validation                           │  │
│  │  • Progress tracking                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ POST /api/upload
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Upload Route (Multer)                        │  │
│  │  1. Receive file                                     │  │
│  │  2. Save to temp directory                           │  │
│  │  3. Validate PDF (magic numbers)                     │  │
│  │  4. Check Cloudinary config                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│              ┌─────────────────────────┐                    │
│              │  Cloudinary Configured? │                    │
│              └─────────────────────────┘                    │
│                     │              │                         │
│                 YES │              │ NO                      │
│                     ▼              ▼                         │
│         ┌──────────────┐    ┌──────────────┐               │
│         │  Cloudinary  │    │    Local     │               │
│         │   Storage    │    │   Storage    │               │
│         └──────────────┘    └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
                     │              │
                     ▼              ▼
         ┌──────────────────────────────────┐
         │      Metadata Storage            │
         │  • fileId                        │
         │  • storageType: "cloudinary"     │
         │    or "local"                    │
         │  • cloudinaryPublicId (if cloud) │
         │  • storedPath                    │
         │  • expiresAt                     │
         └──────────────────────────────────┘
```

## Upload Flow

### With Cloudinary Configured

```
User Upload
    │
    ▼
Multer (temp save)
    │
    ▼
PDF Validation
    │
    ▼
Upload to Cloudinary
    │
    ▼
Delete local temp file
    │
    ▼
Store metadata
    │
    ▼
Return fileId to user
```

### Without Cloudinary (Local Storage)

```
User Upload
    │
    ▼
Multer (save to uploads/)
    │
    ▼
PDF Validation
    │
    ▼
Store metadata
    │
    ▼
Return fileId to user
```

## Download Flow

```
User requests /api/download/:fileId
    │
    ▼
Lookup metadata by fileId
    │
    ▼
Check storageType
    │
    ├─── "cloudinary" ──▶ Download from Cloudinary ──┐
    │                                                  │
    └─── "local" ──────▶ Stream from local disk ─────┤
                                                       │
                                                       ▼
                                            Stream to user
```

## Cleanup Flow

```
Cron Job (every 5 minutes)
    │
    ▼
Get expired files from metadata
    │
    ▼
For each expired file:
    │
    ├─── storageType: "cloudinary" ──▶ Delete from Cloudinary
    │
    └─── storageType: "local" ────────▶ Delete from disk
    │
    ▼
Remove metadata entry
```

## Storage Type Decision Matrix

| Environment Variables      | Storage Used | Behavior                           |
| -------------------------- | ------------ | ---------------------------------- |
| All 3 Cloudinary vars set  | Cloudinary   | Upload to cloud, delete local temp |
| Missing any Cloudinary var | Local        | Keep files in uploads/ directory   |
| No Cloudinary vars         | Local        | Default behavior                   |

## File Lifecycle

### Cloudinary Storage

```
1. Upload
   ├─ Save to temp: /uploads/temp-uuid.pdf
   ├─ Validate: Check PDF magic numbers
   ├─ Upload: Send to Cloudinary
   ├─ Store: publicId = "pdf-toolkit/uuid"
   └─ Cleanup: Delete temp file

2. Active Period (60 minutes)
   ├─ Download: Fetch from Cloudinary URL
   └─ Access: Via secure HTTPS URL

3. Expiration
   ├─ Detect: expiresAt < now
   ├─ Delete: cloudinary.uploader.destroy(publicId)
   └─ Remove: Delete metadata entry
```

### Local Storage

```
1. Upload
   ├─ Save: /uploads/uuid.pdf
   ├─ Validate: Check PDF magic numbers
   └─ Store: storedPath = "/uploads/uuid.pdf"

2. Active Period (60 minutes)
   ├─ Download: Stream from disk
   └─ Access: Via file system

3. Expiration
   ├─ Detect: expiresAt < now
   ├─ Delete: fs.unlinkSync(storedPath)
   └─ Remove: Delete metadata entry
```

## Metadata Structure

### Cloudinary File

```typescript
{
  fileId: "550e8400-e29b-41d4-a716-446655440000",
  originalName: "document.pdf",
  storedPath: "pdf-toolkit/550e8400-e29b-41d4-a716-446655440000",
  cloudinaryPublicId: "pdf-toolkit/550e8400-e29b-41d4-a716-446655440000",
  cloudinaryUrl: "https://res.cloudinary.com/...",
  mimeType: "application/pdf",
  size: 1048576,
  uploadedAt: "2024-01-15T10:30:00Z",
  expiresAt: "2024-01-15T11:30:00Z",
  isProcessed: false,
  storageType: "cloudinary"
}
```

### Local File

```typescript
{
  fileId: "550e8400-e29b-41d4-a716-446655440000",
  originalName: "document.pdf",
  storedPath: "/uploads/550e8400-e29b-41d4-a716-446655440000.pdf",
  mimeType: "application/pdf",
  size: 1048576,
  uploadedAt: "2024-01-15T10:30:00Z",
  expiresAt: "2024-01-15T11:30:00Z",
  isProcessed: false,
  storageType: "local"
}
```

## Error Handling

### Upload Errors

```
Invalid PDF
    │
    ▼
Delete temp file
    │
    ▼
Return 400 error

Cloudinary Upload Fails
    │
    ▼
Delete temp file
    │
    ▼
Return 500 error
```

### Download Errors

```
File Not Found in Metadata
    │
    ▼
Return 404 error

Cloudinary Download Fails
    │
    ▼
Return 500 error

Local File Missing
    │
    ▼
Return 404 error
```

## Benefits by Storage Type

### Cloudinary

✅ Unlimited scalability
✅ CDN delivery
✅ No disk management
✅ Automatic backups
✅ Global distribution
❌ Requires account
❌ API rate limits
❌ Network dependency

### Local

✅ No external dependencies
✅ Fast for development
✅ No API limits
✅ Complete control
❌ Limited by disk space
❌ No CDN
❌ Manual backups needed
❌ Single point of failure
