# 🚗 Car Damage Assessment System

An AI-powered vehicle damage assessment application built with Next.js 14, MongoDB, and n8n workflow automation. Upload before/after images of your vehicle to receive detailed damage analysis, repair cost estimates, and comprehensive reports.

## ✨ Features

- **Dual Image Upload**: Upload before and after damage photos with drag-and-drop support
- **AI Analysis**: Integrates with n8n workflow for intelligent damage assessment
- **Detailed Reports**: Comprehensive damage reports with cost breakdowns, repair options, and recommendations
- **Assessment History**: View and manage all past assessments
- **Validation**: Automatic detection of incorrect image uploads
- **Responsive Design**: Beautiful, modern UI with Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or pnpm
- MongoDB database (local or MongoDB Atlas)
- Vercel Blob Storage token (for image storage)
- n8n instance with damage assessment workflow (optional)

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mostafa-khansa/car-damage-assesment.git
   cd car-damage-assesment
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # MongoDB Connection
   MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database?appName=appName"
   
   # Vercel Blob Storage
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
   ```

   **Getting MongoDB URI:**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a cluster and get your connection string
   - Replace `<username>`, `<password>`, and database name

   **Getting Blob Token:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Create a blob storage token
   vercel storage tokens create "local-dev"
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📡 API Documentation

### 1. Complete Assessment (Upload & Analyze)

**Endpoint:** `POST /api/assessments/complete`

**Description:** Upload before/after images, store them, trigger n8n analysis, and save results to MongoDB.

**Request:** `multipart/form-data`
- `beforeImage`: File (required) - Image of vehicle before damage
- `afterImage`: File (required) - Image of vehicle after damage

**Response:**
```json
{
  "success": true,
  "assessmentId": "assessment_1763126515618",
  "message": "Assessment completed successfully"
}
```

**Example (PowerShell):**
```powershell
$form = @{
    beforeImage = Get-Item -Path "C:\path\to\before.jpg"
    afterImage = Get-Item -Path "C:\path\to\after.jpg"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/complete" `
    -Method Post `
    -Form $form
```

**Example (cURL):**
```bash
curl -X POST http://localhost:3000/api/assessments/complete \
  -F "beforeImage=@/path/to/before.jpg" \
  -F "afterImage=@/path/to/after.jpg"
```

**Example (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('beforeImage', beforeImageFile);
formData.append('afterImage', afterImageFile);

const response = await fetch('/api/assessments/complete', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.assessmentId);
```

---

### 2. Get Assessment Status

**Endpoint:** `GET /api/assessments/status?assessmentId={id}`

**Description:** Retrieve a specific assessment by ID.

**Parameters:**
- `assessmentId` (query string, required) - The assessment ID

**Response:**
```json
{
  "_id": "assessment_1763126515618",
  "assessmentId": "assessment_1763126515618",
  "beforeImageUrl": "https://blob.vercel-storage.com/...",
  "afterImageUrl": "https://blob.vercel-storage.com/...",
  "status": "completed",
  "analysisResult": [...],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "completedAt": "2024-01-15T10:30:30.000Z"
}
```

**Example (PowerShell):**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/status?assessmentId=assessment_1763126515618"
```

**Example (cURL):**
```bash
curl "http://localhost:3000/api/assessments/status?assessmentId=assessment_1763126515618"
```

---

### 3. List All Assessments

**Endpoint:** `GET /api/assessments/list?page={page}&limit={limit}`

**Description:** Get paginated list of all assessments.

**Parameters:**
- `page` (query string, optional) - Page number (default: 1)
- `limit` (query string, optional) - Items per page (default: 20)

**Response:**
```json
{
  "assessments": [
    {
      "_id": "assessment_1763126515618",
      "assessmentId": "assessment_1763126515618",
      "beforeImageUrl": "https://...",
      "afterImageUrl": "https://...",
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Example (PowerShell):**
```powershell
# Get first page (20 items)
Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/list"

# Get specific page with custom limit
Invoke-RestMethod -Uri "http://localhost:3000/api/assessments/list?page=2&limit=10"
```

**Example (cURL):**
```bash
curl "http://localhost:3000/api/assessments/list?page=1&limit=20"
```

---

### 4. Upload Image (Legacy)

**Endpoint:** `POST /api/assessments/upload`

**Description:** Upload a single image to Vercel Blob storage.

**Request:** `multipart/form-data`
- `file`: File (required)

**Response:**
```json
{
  "url": "https://blob.vercel-storage.com/...",
  "pathname": "before_image.jpg",
  "contentType": "image/jpeg",
  "size": 1234567
}
```

**Note:** This endpoint is mostly for internal use. Use `/api/assessments/complete` for full assessments.

## 🗂️ Project Structure

```
car-damage-assessment/
├── app/
│   ├── api/
│   │   └── assessments/
│   │       ├── complete/route.ts    # Main upload & analysis endpoint
│   │       ├── list/route.ts        # List all assessments
│   │       ├── status/route.ts      # Get single assessment
│   │       └── upload/route.ts      # Single image upload
│   ├── assessment/[id]/page.tsx     # Individual assessment view
│   ├── assessments/page.tsx         # All assessments list view
│   ├── page.tsx                     # Home/upload page
│   └── layout.tsx                   # Root layout
├── models/
│   └── Assessment.ts                # MongoDB schema
├── lib/
│   └── mongoose.ts                  # Database connection
└── .env                             # Environment variables
```

## 🔧 Configuration

### n8n Webhook Integration

The system integrates with n8n for AI-powered damage analysis. Configure in `app/api/assessments/complete/route.ts`:

```typescript
const n8nWebhookUrl = 'https://your-n8n-instance.app.n8n.cloud/webhook/...';
const jwtToken = 'your-jwt-token';
```

The webhook expects:
- `beforeImageUrl`: URL of before damage image
- `afterImageUrl`: URL of after damage image

And returns:
- Damage analysis with cost estimates
- Or validation error if images are incorrect

### Database Schema

```typescript
{
  _id: string,              // Assessment ID
  assessmentId: string,     // Same as _id
  beforeImageUrl: string,   // Vercel Blob URL
  afterImageUrl: string,    // Vercel Blob URL
  status: 'processing' | 'completed' | 'failed',
  analysisResult: any,      // n8n response
  createdAt: Date,
  completedAt: Date         // Optional
}
```

## 🎨 UI Pages

### 1. Home/Upload Page (`/`)
- Dual drag-and-drop zones for before/after images
- Image preview before upload
- File validation (type, size)
- Redirects to results after successful upload

### 2. Assessment Results (`/assessment/[id]`)
- Vehicle images comparison
- Damage summary with severity
- Cost breakdown (labor, parts, paint)
- Damaged components list
- Repair options
- Recommendations and warnings
- Handles validation errors gracefully

### 3. All Assessments (`/assessments`)
- Grid view of all assessments
- Status badges (completed, processing, failed, validation failed)
- Cost previews
- Pagination
- Click to view detailed report

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `MONGODB_URI`
   - `BLOB_READ_WRITE_TOKEN` (auto-configured by Vercel)
4. Deploy!

```bash
# Or use Vercel CLI
vercel
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: MongoDB with Mongoose
- **Storage**: Vercel Blob
- **Automation**: n8n webhooks
- **Deployment**: Vercel

## 📝 License

Private project

## 👨‍💻 Author

Mostafa Khansa

---

For issues or questions, please open an issue on GitHub.
