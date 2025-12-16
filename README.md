# IHatePDF

A comprehensive web-based PDF manipulation application that makes working with PDFs easy and free.

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
