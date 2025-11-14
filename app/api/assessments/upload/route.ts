import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://mostafa-khansa.app.n8n.cloud/webhook/c1ddc39d-4fd7-457b-9dd8-636287e8c758';
const N8N_JWT_TOKEN = 'juhtbugibijtrgbijihjyhiyyyyyyyyyyyyyr0w9it9er98e87f6';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') ?? '';
  const type = searchParams.get('type') ?? '';

  const body = request.body;
  if (!body) {
    return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
  }

  // Validate the type parameter for better organization
  if (type && !['before', 'after'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type parameter. Must be "before" or "after"' }, { status: 400 });
  }

  try {
    // Upload to Vercel Blob
    const blob = await put(filename, body, {
      access: 'public',
      // Add metadata to help identify the image type
      addRandomSuffix: true,
    });

    // Call n8n webhook after successful upload
    try {
      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${N8N_JWT_TOKEN}`,
        },
        body: JSON.stringify({
          imageUrl: blob.url,
          filename: filename,
          type: type,
          uploadedAt: new Date().toISOString(),
          blobData: blob,
        }),
      });

      if (!webhookResponse.ok) {
        console.warn('n8n webhook call failed:', webhookResponse.status, webhookResponse.statusText);
        // Don't fail the main upload if webhook fails
      } else {
        console.log('n8n webhook called successfully');
      }
    } catch (webhookError) {
      console.error('Error calling n8n webhook:', webhookError);
      // Don't fail the main upload if webhook fails
    }

    return NextResponse.json(blob);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
