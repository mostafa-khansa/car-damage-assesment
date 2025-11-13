import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  console.log(
    "BLOB_READ_WRITE_TOKEN loaded:",
    !!process.env.BLOB_READ_WRITE_TOKEN
  );
  try {
    const body = await request.json();

    const response = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ["image/*"],
          tokenPayload: JSON.stringify({ from: "assessment-form" }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Blob uploaded:", blob.url);
      },
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      {
        error: message,
        hint:
          "If running locally, set BLOB_READ_WRITE_TOKEN in .env. Generate via `vercel storage tokens create`.",
      },
      { status: 400 }
    );
  }
}
