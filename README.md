This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## API: Assessments

- Endpoint: `POST /api/assessments`
- Description: Create a new assessment document with embedded damages.
- Environment: Set `MONGODB_URI` in `.env` (e.g., `mongodb+srv://...`).

Example request (PowerShell):

```powershell
$body = @{
	_id = "123"
	title = "Assessment 12/1/2023"
	beforeImageUrl = "https://example.com/before.jpg"
	afterImageUrl = "https://example.com/after.jpg"
	totalCost = 450
	damages = @(
		@{ type = "scratch"; repairCost = 150 },
		@{ type = "dent"; repairCost = 300 }
	)
	createdAt = "2023-12-01T10:30:00Z"
} | ConvertTo-Json -Depth 5

curl -X POST "http://localhost:3000/api/assessments" `
	-H "Content-Type: application/json" `
	-d $body
```

List all assessments:

```powershell
curl "http://localhost:3000/api/assessments"
```

## Blob Upload (Client)

- Endpoint: `POST /api/blob/upload` (used internally by the client SDK to mint upload tokens)
- Local development requires a Blob read-write token.

Setup for local dev:

```powershell
# 1) Create a token (requires Vercel CLI)
vercel storage tokens create "local-dev"

# 2) Put the token value into .env
# BLOB_READ_WRITE_TOKEN=... (from the command output)

# 3) Restart dev server
pnpm dev
```

Note: If you want `onUploadCompleted` to fire when not hosted on Vercel, you may also need to set `VERCEL_BLOB_CALLBACK_URL` to a public tunnel URL and keep it running while developing.
