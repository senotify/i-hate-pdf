# IHatePDF

A comprehensive web-based PDF manipulation application that makes working with PDFs easy and free.

## Features

- 📄 **Merge PDFs** - Combine multiple PDFs with drag-and-drop reordering
- 🗜️ **Compress PDFs** - Reduce file size with Ghostscript (3 quality levels)
- ✂️ **Split PDFs** - Extract specific pages or ranges
- ✏️ **Edit PDFs** - Rotate, delete, and reorder pages with live preview
- 🖼️ **Add Watermarks** - Text or image watermarks with customization
- 📤 **Upload & Download** - Secure file handling with automatic cleanup

## Project Structure

```
ihatepdf/
├── src/                    # Backend source code
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── frontend/              # React frontend application
│   └── src/
│       ├── components/    # React components
│       ├── services/      # API client services
│       ├── utils/         # Frontend utilities
│       └── types/         # Frontend type definitions
├── docs/                  # Documentation
└── uploads/               # Temporary file storage (auto-created)
```

## Setup

### Backend

```bash
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure as needed.

## Development

- Backend runs on port 3000
- Frontend runs on port 5173
- Frontend proxies API requests to backend

## Testing

### Backend

```bash
npm test
```

### Frontend

```bash
cd frontend
npm test
```

## Deployment

### Railway (Recommended)

See [docs/RAILWAY_DEPLOYMENT_GUIDE.md](docs/RAILWAY_DEPLOYMENT_GUIDE.md) for detailed Railway deployment instructions.

Quick deploy:

```bash
# Push to GitHub
git push origin main

# Railway will auto-deploy with:
# - Node.js + Ghostscript
# - Automatic builds
# - Health checks
```

### Docker

See [docs/DOCKER_DEPLOYMENT.md](docs/DOCKER_DEPLOYMENT.md) for complete Docker guide.

Quick start:

```bash
# Using Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

Build and run manually:

```bash
# Build image
docker build -t ihatepdf .

# Run container
docker run -d -p 3000:3000 ihatepdf
```

## Documentation

- [Railway Deployment Guide](docs/RAILWAY_DEPLOYMENT_GUIDE.md) - Complete deployment walkthrough
- [Railway Troubleshooting](docs/RAILWAY_TROUBLESHOOTING.md) - Common issues and solutions
- [Ghostscript Compression](docs/GHOSTSCRIPT_COMPRESSION.md) - PDF compression details
- [Security Assessment](docs/SECURITY_ASSESSMENT.md) - Security features and best practices
- [Storage Architecture](docs/STORAGE_ARCHITECTURE.md) - File storage system design
- [Cloudinary Setup](docs/CLOUDINARY_SETUP.md) - Cloud storage configuration

## Tech Stack

**Backend:**

- Node.js + Express + TypeScript
- pdf-lib - PDF manipulation
- Ghostscript - High-quality compression
- Multer - File uploads
- Helmet + CORS - Security

**Frontend:**

- React + TypeScript + Vite
- TailwindCSS - Styling
- pdf.js - PDF rendering
- Lucide React - Icons

**Deployment:**

- Railway.app - Hosting
- Nixpacks - Build system
- Cloudinary - Optional cloud storage

## License

MIT
