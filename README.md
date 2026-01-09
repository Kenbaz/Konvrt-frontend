This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Konvrt Frontend

A modern, intuitive web interface for the Konvrt media processing platform. Built with Next.js 16, React 19, TypeScript, and Tailwind CSS.

![Konvrt](https://img.shields.io/badge/Konvrt-Media%20Processor-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38B2AC)

## Overview

Konvrt is a comprehensive media processing platform that enables users to:

- **Compress Videos** - Reduce file size while maintaining quality
- **Convert Formats** - Transform between video, image, and audio formats
- **Resize Images** - Scale images with various algorithms and aspect ratio options
- **Extract Audio** - Pull audio tracks from video files
- **Process Audio** - Convert, compress, and normalize audio files

### Key Features

- 🎯 **Intuitive Multi-Step Workflow** - Guided job creation with operation selection, file upload, and parameter configuration
- 📤 **Drag-and-Drop File Upload** - Modern file handling with progress tracking
- ⚡ **Real-Time Progress Monitoring** - Live updates on job status and processing progress
- 📱 **Fully Responsive** - Works seamlessly on desktop, tablet, and mobile devices
- 🔄 **Smart Polling** - Efficient status updates that stop when jobs complete
- 💾 **Download Management** - Easy file downloads with progress indication
- 🎨 **Dark Theme** - Modern, eye-friendly dark interface

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 16.1.0 | React framework with App Router |
| [React](https://react.dev/) | 19.2.3 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type safety |
| [React Query](https://tanstack.com/query) | 5.x | Server state management |
| [Axios](https://axios-http.com/) | 1.x | HTTP client |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first styling |
| [react-dropzone](https://react-dropzone.js.org/) | 14.x | File upload handling |
| [react-hot-toast](https://react-hot-toast.com/) | 2.x | Toast notifications |
| [Lucide React](https://lucide.dev/) | 0.562.x | Icon library |
| [date-fns](https://date-fns.org/) | 4.x | Date formatting |
| [clsx](https://github.com/lukeed/clsx) | 2.x | Conditional class names |

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page (main job creation flow)
│   ├── error.tsx                # Global error boundary
│   └── globals.css              # Global styles
│
├── components/                   # React components
│   ├── UI/                      # Base UI components
│   │   ├── Button.tsx           # Button with variants
│   │   ├── Card.tsx             # Content container
│   │   ├── Input.tsx            # Form input
│   │   ├── Select.tsx           # Dropdown select
│   │   ├── Badge.tsx            # Status badges
│   │   ├── Progress.tsx         # Progress bar
│   │   ├── Spinner.tsx          # Loading spinner
│   │   └── ConfirmDialog.tsx    # Confirmation modal
│   │
│   ├── operationsUI/            # Operation selection
│   │   ├── OperationSelector.tsx
│   │   ├── OperationCard.tsx
│   │   ├── OperationSearch.tsx
│   │   └── OperationParametersPreview.tsx
│   │
│   ├── uploadsUI/               # File upload
│   │   ├── FileUploadZone.tsx
│   │   ├── FilePreview.tsx
│   │   └── UploadProgress.tsx
│   │
│   ├── uploadParametersUI/      # Parameter configuration
│   │   ├── ParameterForm.tsx
│   │   ├── ParameterInput.tsx
│   │   ├── VideoResolutionSelect.tsx
│   │   ├── BitrateSlider.tsx
│   │   ├── FormatSelect.tsx
│   │   ├── QualityPresets.tsx
│   │   └── ImageResizeConfigurator.tsx
│   │
│   ├── jobsUI/                  # Job management
│   │   ├── JobCreationForm.tsx
│   │   ├── JobCard.tsx
│   │   ├── JobList.tsx
│   │   ├── JobStatus.tsx
│   │   ├── JobProgress.tsx
│   │   ├── JobProgressTracker.tsx
│   │   ├── DownloadButton.tsx
│   │   └── DeleteConfirmDialog.tsx
│   │
│   └── providers/               # Context providers
│       ├── QueryProvider.tsx    # React Query provider
│       └── ToastProvider.tsx    # Toast notifications
│
├── lib/                         # Core utilities and services
│   ├── api/                     # API client and services
│   │   ├── axios-client.ts      # Axios instance with interceptors
│   │   ├── queryClient.ts       # React Query configuration
│   │   ├── health.ts            # Health check API
│   │   ├── jobs.ts              # Job CRUD operations
│   │   ├── operations.ts        # Operations API
│   │   ├── upload.ts            # File upload with progress
│   │   └── download.ts          # File download handling
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useOperations.ts     # Fetch operations
│   │   ├── useJobs.ts           # Fetch jobs list
│   │   ├── useJob.ts            # Fetch single job
│   │   ├── useCreateJob.ts      # Create job mutation
│   │   ├── useJobPolling.ts     # Poll job status
│   │   ├── useUpload.ts         # Upload management
│   │   └── useDownload.ts       # Download management
│   │
│   └── utils/                   # Utility functions
│       ├── fileHelpers.ts       # File handling utilities
│       └── fileValidations.ts   # Validation rules
│
└── types/                       # TypeScript type definitions
    ├── common-types.ts          # Shared types and enums
    ├── job-types.ts             # Job-related types
    ├── operation-types.ts       # Operation schemas
    └── api-types.ts             # API request/response types
```

## Getting Started

### Prerequisites

- **Node.js** 20.x or later
- **pnpm** 8.x or later (recommended) or npm/yarn
- **Backend Server** running (see [Backend Repository](https://github.com/your-org/konvrt-backend))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/konvrt-frontend.git
   cd konvrt-frontend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and set:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

4. **Start the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm type-check` | Run TypeScript compiler check |

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API base URL | `https://api.konvrt.app/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | No | Application name | `Konvrt` |
| `NEXT_PUBLIC_DEBUG` | No | Enable debug logging | `false` |

## Deployment

### Deploy to Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

1. **Push your code to GitHub**

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**
   In Vercel's project settings, add:
   ```
   NEXT_PUBLIC_API_URL=https://konvrt-backend-production.up.railway.app/api/v1
   ```

4. **Deploy**
   - Vercel automatically builds and deploys
   - Get your production URL

5. **Update Backend CORS**
   Add your Vercel URL to the backend's `CORS_ALLOWED_ORIGINS`:
   ```
   CORS_ALLOWED_ORIGINS=https://app.vercel.app
   CSRF_TRUSTED_ORIGINS=https://app.vercel.app
   ```

### Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### Build for Self-Hosting

```bash
# Build the application
pnpm build

# The .next folder contains the build output
# Use standalone mode for smaller deployments

# Start production server
pnpm start
```

For containerized deployment, the build creates a standalone folder at `.next/standalone`.

## Architecture

### State Management

- **Server State**: Managed by React Query with automatic caching, background refetching, and optimistic updates
- **UI State**: Local component state with React's `useState`
- **Form State**: Managed within form components with validation

### API Communication

The frontend communicates with the Django REST Framework backend:

```
Frontend (Next.js) <---> Backend (Django)
     |                        |
     |------ REST API ------->|
     |<----- JSON Data -------|
     |                        |
     |--- File Upload ------->|
     |    (multipart/form)    |
     |                        |
     |<-- Download File ------|
     |    (binary/stream)     |
```

### Job Processing Flow

```
1. SELECT OPERATION
   └─> Choose from video/image/audio operations
   
2. UPLOAD FILE
   └─> Drag-drop or browse
   └─> Client-side validation
   └─> Progress tracking
   
3. CONFIGURE PARAMETERS
   └─> Dynamic form based on operation
   └─> Specialized inputs (resolution, bitrate, etc.)
   └─> Validation before submission
   
4. SUBMIT & MONITOR
   └─> Create job via API
   └─> Poll for status updates
   └─> Real-time progress bar
   
5. DOWNLOAD RESULT
   └─> Get processed file
   └─> Browser download trigger
```

### Polling Strategy

- **Active Jobs**: Poll every 2 seconds while processing
- **Job List**: Refresh every 60 seconds in background
- **Automatic Stop**: Polling stops when job reaches final state (completed/failed)

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health/` | GET | Backend health check |
| `/operations/` | POST | Create new processing job |
| `/operations/` | GET | List user's jobs |
| `/operations/{id}/` | GET | Get job details |
| `/operations/{id}/status/` | GET | Get job status (for polling) |
| `/operations/{id}/download/` | GET | Download processed file |
| `/operations/{id}/` | DELETE | Delete a job |
| `/operations/{id}/retry/` | POST | Retry a failed job |
| `/operation-definitions/` | GET | List available operations |
| `/operation-definitions/{name}/` | GET | Get operation details |

## Development

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Prettier**: Consistent formatting (recommended)

### Component Guidelines

1. **Naming**: PascalCase for components, camelCase for hooks
2. **Types**: Define props interfaces explicitly
3. **Exports**: Named exports preferred (except Next.js pages)
4. **Styling**: Tailwind utility classes, minimize custom CSS

### Adding New Operations

Operations are defined in the backend and fetched dynamically. The frontend automatically renders appropriate parameter inputs based on the operation schema.

## Troubleshooting

### Common Issues

**CORS Errors**
```
Access to fetch has been blocked by CORS policy
```
→ Add your frontend URL to backend's `CORS_ALLOWED_ORIGINS`

**API Connection Failed**
```
Unable to connect to the server
```
→ Verify `NEXT_PUBLIC_API_URL` is correct
→ Check backend is running

**File Upload Fails**
```
413 Entity Too Large
```
→ Check file size limits (500MB for video, 50MB for images, 100MB for audio)

**Build Errors**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
pnpm install
pnpm build
```

### Debug Mode

Enable debug logging:
```env
NEXT_PUBLIC_DEBUG=true
```

Check browser console for API request/response logs.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Checklist

- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] New components have proper types
- [ ] Responsive design tested
- [ ] Error states handled
- [ ] Loading states implemented

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Lucide](https://lucide.dev/) - Icons
- [Vercel](https://vercel.com/) - Deployment platform

---

**Backend Repository**: [konvrt-backend](https://github.com/Kenbaz/konvrt-backend)

**Live Demo**: [https://konvrt.vercel.app](https://konvrt.vercel.app)