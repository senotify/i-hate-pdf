# PDF Conversion Feature

## Overview

IHatePDF supports bidirectional conversion between PDF and image formats using industry-standard tools.

## Supported Conversions

### PDF to Image

- **Input:** PDF files
- **Output:** PNG, JPEG/JPG
- **Technology:** pdf-poppler + sharp
- **Converts:** First page of PDF

### Image to PDF

- **Input:** PNG, JPEG/JPG
- **Output:** PDF
- **Technology:** pdf-lib
- **Result:** Single-page PDF with embedded image

## How It Works

### PDF to Image Conversion

```typescript
// 1. PDF is saved to temporary file
// 2. pdf-poppler converts PDF to PNG using poppler-utils
// 3. sharp processes the image (format conversion, optimization)
// 4. Result is saved and metadata created
```

**Process:**

1. Uses `pdftoppm` from poppler-utils to render PDF page
2. Converts to PNG at high quality
3. If JPEG requested, sharp converts PNG → JPEG (90% quality)
4. Cleans up temporary files automatically

### Image to PDF Conversion

```typescript
// 1. Image is embedded in new PDF document
// 2. Page size matches image dimensions
// 3. Image drawn at full size on page
```

**Process:**

1. Creates new PDF document using pdf-lib
2. Embeds PNG or JPEG image
3. Creates page matching image dimensions
4. Draws image at position (0,0) filling entire page

## API Usage

### Convert PDF to Image

```bash
POST /api/convert
Content-Type: application/json

{
  "fileId": "abc123",
  "outputFormat": "png"  # or "jpeg", "jpg"
}
```

**Response:**

```json
{
  "outputFileId": "xyz789",
  "downloadUrl": "/api/download/xyz789"
}
```

### Convert Image to PDF

```bash
POST /api/convert
Content-Type: application/json

{
  "fileId": "img456",
  "outputFormat": "pdf"
}
```

**Response:**

```json
{
  "outputFileId": "pdf789",
  "downloadUrl": "/api/download/pdf789"
}
```

## System Requirements

### Local Development

**macOS:**

```bash
brew install poppler
npm install
```

**Ubuntu/Debian:**

```bash
sudo apt-get install poppler-utils
npm install
```

**Windows:**
Download poppler from [poppler for Windows](http://blog.alivate.com.au/poppler-windows/)

### Railway Deployment

Automatically installed via `nixpacks.toml`:

```toml
[phases.setup]
nixPkgs = ["nodejs", "ghostscript", "poppler_utils"]
```

Railway installs:

- ✅ poppler-utils (for PDF rendering)
- ✅ Node.js packages (pdf-poppler, sharp)

## Technical Details

### Dependencies

**npm packages:**

- `pdf-poppler` - Node.js wrapper for poppler-utils
- `sharp` - High-performance image processing
- `pdf-lib` - PDF creation and manipulation

**System packages:**

- `poppler-utils` - PDF rendering tools (pdftoppm, pdfinfo, etc.)

### Temporary Files

**Created:**

- `temp_pdf_*.pdf` - Input PDF for conversion
- `temp_convert_*-1.png` - Intermediate PNG from poppler

**Cleanup:**

- All temporary files deleted after conversion
- Cleanup happens even if conversion fails (try/finally)

### Image Quality

**PDF to PNG:**

- Default DPI: 150 (configurable)
- Color depth: 24-bit RGB
- No compression loss

**PDF to JPEG:**

- Quality: 90%
- Optimized for file size vs quality balance
- Suitable for web and sharing

**Image to PDF:**

- Original image dimensions preserved
- No scaling or compression
- Lossless embedding

## Limitations

### Current Implementation

1. **Single Page Only**

   - PDF to image converts only first page
   - Multi-page conversion not yet implemented

2. **No Page Selection**

   - Cannot choose which page to convert
   - Always converts page 1

3. **No Batch Conversion**
   - One file at a time
   - No bulk operations

### Future Enhancements

Potential improvements:

- [ ] Multi-page PDF to multiple images
- [ ] Page selection for conversion
- [ ] Batch conversion support
- [ ] Custom DPI settings
- [ ] Image quality options
- [ ] Multiple images to multi-page PDF

## Error Handling

### Common Errors

**"File not found"**

- File ID doesn't exist in metadata
- File may have been cleaned up

**"Unsupported format"**

- Output format not in supported list
- Check format spelling (png, jpeg, jpg, pdf)

**"Conversion failed"**

- poppler-utils not installed
- Corrupted PDF file
- Insufficient disk space

### Fallback Behavior

If poppler-utils is not available:

- Conversion will fail with clear error message
- No automatic fallback (unlike compression)
- User should install poppler-utils

## Performance

### Conversion Speed

**PDF to Image:**

- Small PDF (1 page): ~1-2 seconds
- Large PDF (1 page): ~2-4 seconds
- Depends on page complexity

**Image to PDF:**

- Small image (<1MB): <1 second
- Large image (5-10MB): 1-2 seconds
- Very fast, pure JavaScript

### Memory Usage

**PDF to Image:**

- ~50-100MB per conversion
- Temporary files on disk
- Memory released after conversion

**Image to PDF:**

- ~20-50MB per conversion
- Depends on image size
- Efficient embedding

## Storage

### Local Storage

Converted files stored in `uploads/` directory:

- Automatic cleanup after 1 hour
- Configurable retention period

### Cloudinary Storage

If configured:

- Converted files uploaded to Cloudinary
- Permanent storage (until manually deleted)
- CDN delivery for fast downloads

## Security

### File Validation

- Input files validated before conversion
- File type detection using magic numbers
- Size limits enforced (10MB default)

### Temporary File Security

- Unique filenames prevent conflicts
- Files created with secure permissions
- Automatic cleanup prevents disk filling

### Output Validation

- Converted files validated before saving
- Metadata sanitized
- Safe download URLs generated

## Testing

### Manual Testing

```bash
# Start backend
npm run dev

# Upload a PDF
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.pdf"

# Convert to PNG
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"fileId":"<file-id>","outputFormat":"png"}'

# Download result
curl http://localhost:3000/api/download/<output-file-id> \
  -o result.png
```

### Verify Installation

```bash
# Check poppler-utils
pdftoppm -v

# Check Node packages
npm list pdf-poppler sharp
```

## Troubleshooting

### "pdftoppm not found"

**Problem:** poppler-utils not installed

**Solution:**

```bash
# macOS
brew install poppler

# Ubuntu/Debian
sudo apt-get install poppler-utils
```

### "Cannot find module 'pdf-poppler'"

**Problem:** npm packages not installed

**Solution:**

```bash
npm install
```

### "Conversion takes too long"

**Problem:** Large or complex PDF

**Solution:**

- Reduce PDF size before conversion
- Use compression first
- Consider timeout settings

### "Out of memory"

**Problem:** Very large PDF or image

**Solution:**

- Increase Node.js memory limit
- Compress PDF before conversion
- Resize image before conversion

---

**Status:** ✅ Implemented and deployed
**Last Updated:** December 2024
