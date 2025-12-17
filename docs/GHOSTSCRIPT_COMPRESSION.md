# Ghostscript PDF Compression

## Overview

IHatePDF now uses **Ghostscript** for high-quality PDF compression with automatic fallback to pdf-lib if Ghostscript is unavailable.

## How It Works

### Compression Levels

The compression endpoint accepts three levels:

1. **Low** (`printer`)

   - 300 DPI resolution
   - Best quality, moderate compression
   - Suitable for documents that will be printed

2. **Medium** (`ebook`)

   - 150 DPI resolution
   - Balanced quality and file size
   - Good for digital reading and sharing

3. **High** (`screen`)
   - 72 DPI resolution
   - Maximum compression, lower quality
   - Best for web viewing and email

### Compression Strategy

```typescript
// 1. Check if Ghostscript is available
const hasGhostscript = await isGhostscriptAvailable();

// 2. Use Ghostscript if available (better compression)
if (hasGhostscript) {
  return await compressWithGhostscript(pdfDoc, level);
}

// 3. Fallback to pdf-lib (basic compression)
return await compressWithPdfLib(pdfDoc, level);
```

## Railway Deployment

### Installation via Nixpacks

Ghostscript is automatically installed on Railway using the `nixpacks.toml` configuration:

```toml
[phases.setup]
nixPkgs = ["nodejs", "ghostscript"]
```

This ensures Ghostscript is available in the production environment.

### Automatic Fallback

If Ghostscript installation fails or is unavailable:

- The app automatically detects this
- Falls back to pdf-lib compression
- No manual intervention required
- App continues to function

## Local Development

### Check Ghostscript Installation

```bash
gs --version
```

### Install Ghostscript

**macOS:**

```bash
brew install ghostscript
```

**Ubuntu/Debian:**

```bash
sudo apt-get install ghostscript
```

**Windows:**
Download from [ghostscript.com](https://www.ghostscript.com/download/gsdnld.html)

## API Usage

### Compress Endpoint

```bash
POST /api/compress
Content-Type: application/json

{
  "fileId": "abc123",
  "level": "medium"
}
```

### Response

```json
{
  "outputFileId": "xyz789",
  "downloadUrl": "/api/download/xyz789",
  "originalSize": 5242880,
  "compressedSize": 1048576,
  "reductionPercentage": 80.0
}
```

## Compression Quality Comparison

| Level  | DPI | Use Case              | Typical Reduction |
| ------ | --- | --------------------- | ----------------- |
| Low    | 300 | Print-ready documents | 30-50%            |
| Medium | 150 | Digital documents     | 50-70%            |
| High   | 72  | Web viewing           | 70-90%            |

## Technical Details

### Ghostscript Command

```bash
gs -sDEVICE=pdfwrite \
   -dCompatibilityLevel=1.4 \
   -dPDFSETTINGS=/ebook \
   -dNOPAUSE \
   -dQUIET \
   -dBATCH \
   -sOutputFile=output.pdf \
   input.pdf
```

### Temporary File Handling

- Input and output files are created in the uploads directory
- Files are automatically cleaned up after compression
- Cleanup happens even if compression fails (try/finally block)

### Error Handling

```typescript
try {
  // Attempt Ghostscript compression
  return await compressWithGhostscript(pdfDoc, level);
} catch (error) {
  // Log error and fall back to pdf-lib
  console.error("Ghostscript compression failed:", error);
  return await compressWithPdfLib(pdfDoc, level);
}
```

## Benefits

### With Ghostscript

- ✅ Superior compression ratios (70-90% reduction)
- ✅ Industry-standard PDF optimization
- ✅ Maintains PDF/A compliance
- ✅ Better image compression
- ✅ Removes unnecessary metadata

### Fallback (pdf-lib)

- ✅ Works without system dependencies
- ✅ Pure JavaScript implementation
- ✅ Reliable but basic compression (20-40% reduction)
- ✅ Removes metadata and optimizes structure

## Monitoring

### Check Which Method Is Used

Look for these log messages:

```
Using Ghostscript for compression
```

or

```
Ghostscript not available, using pdf-lib fallback
```

### Verify Ghostscript on Railway

After deployment, check the build logs for:

```
Installing ghostscript...
✓ ghostscript installed successfully
```

## Troubleshooting

### Ghostscript Not Found

**Symptom:** Logs show "Ghostscript not available"

**Solution:**

1. Check `nixpacks.toml` includes ghostscript
2. Verify Railway build logs show ghostscript installation
3. Redeploy if necessary

### Compression Not Working

**Symptom:** File size doesn't reduce

**Solution:**

1. Check if PDF is already compressed
2. Try different compression level
3. Some PDFs (scanned images) compress better than others
4. Check logs for error messages

### Permission Errors

**Symptom:** "Cannot write to temp file"

**Solution:**

1. Ensure uploads directory exists and is writable
2. Check Railway has write permissions
3. Verify temp file cleanup is working

## Performance

### Compression Speed

- **Ghostscript:** 2-5 seconds for typical PDF
- **pdf-lib:** 1-2 seconds for typical PDF

### Memory Usage

- Ghostscript: ~50-100MB per compression
- pdf-lib: ~30-50MB per compression

### Concurrent Requests

Both methods handle concurrent requests well:

- Unique temp filenames prevent conflicts
- Automatic cleanup prevents disk space issues

## Future Improvements

Potential enhancements:

- [ ] Add progress tracking for large files
- [ ] Implement compression preview
- [ ] Add custom DPI settings
- [ ] Support batch compression
- [ ] Add compression quality metrics

---

**Status:** ✅ Implemented and deployed
**Last Updated:** December 2024
