# Cloudinary Storage Setup

The PDF Toolkit now supports **Cloudinary** as a cloud storage backend for uploaded files. This provides several benefits:

- **Scalability**: No need to manage local disk space
- **Reliability**: Files are stored in Cloudinary's CDN
- **Automatic cleanup**: Files are automatically deleted after expiration
- **Easy deployment**: Works seamlessly in containerized environments

## Configuration

### 1. Create a Cloudinary Account

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com)
2. Go to your [Cloudinary Console](https://cloudinary.com/console)
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Start the Application

The application will automatically detect Cloudinary configuration and use it for file storage:

```bash
npm run dev
```

## How It Works

### Automatic Detection

The application checks for Cloudinary environment variables at startup:

- **If configured**: All files are uploaded to Cloudinary
- **If not configured**: Falls back to local file storage

### Upload Flow

1. User uploads a PDF file
2. File is temporarily saved locally for validation
3. If valid, file is uploaded to Cloudinary
4. Local temporary file is deleted
5. Cloudinary public ID and URL are stored in metadata

### Download Flow

1. User requests a file download
2. Application checks storage type in metadata
3. If Cloudinary: Downloads from Cloudinary and streams to user
4. If local: Streams directly from local storage

### Cleanup Flow

The cleanup scheduler runs every 5 minutes and:

1. Finds all expired files
2. For Cloudinary files: Deletes from Cloudinary using public ID
3. For local files: Deletes from local file system
4. Removes metadata from storage

## Storage Type Comparison

| Feature     | Local Storage               | Cloudinary          |
| ----------- | --------------------------- | ------------------- |
| Setup       | None required               | Requires account    |
| Scalability | Limited by disk             | Unlimited           |
| Cost        | Free                        | Free tier available |
| CDN         | No                          | Yes                 |
| Deployment  | Requires persistent storage | Stateless           |

## Folder Structure in Cloudinary

All files are stored in the `pdf-toolkit` folder in your Cloudinary account:

```
cloudinary://
  └── pdf-toolkit/
      ├── <uuid-1>.pdf
      ├── <uuid-2>.pdf
      └── ...
```

## API Changes

The FileMetadata interface now includes:

```typescript
interface FileMetadata {
  // ... existing fields
  cloudinaryPublicId?: string; // Cloudinary public ID
  cloudinaryUrl?: string; // Cloudinary secure URL
  storageType: "local" | "cloudinary"; // Storage backend
}
```

## Testing

The application includes tests for both storage backends:

```bash
npm test
```

Tests automatically use local storage (no Cloudinary credentials required).

## Troubleshooting

### Files not uploading to Cloudinary

1. Check that all three environment variables are set correctly
2. Verify credentials in Cloudinary console
3. Check application logs for error messages

### Downloads failing

1. Ensure files haven't expired (60-minute default retention)
2. Check that Cloudinary public IDs are stored correctly in metadata
3. Verify Cloudinary account is active

### Cleanup not working

1. Check that cleanup scheduler is running (logs every 5 minutes)
2. Verify expired files are being detected
3. Check Cloudinary API limits haven't been exceeded

## Migration

To migrate from local storage to Cloudinary:

1. Add Cloudinary credentials to `.env`
2. Restart the application
3. New uploads will use Cloudinary
4. Existing local files will continue to work
5. Old files will be cleaned up after expiration

## Security Notes

- Never commit `.env` file with real credentials
- Use environment variables in production
- Cloudinary credentials should be kept secret
- Files are automatically deleted after 60 minutes
- All downloads use secure HTTPS URLs
