import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = 'https://mostafa-khansa.app.n8n.cloud/webhook/c1ddc39d-4fd7-457b-9dd8-636287e8c758';
const N8N_JWT_TOKEN = 'juhtbugibijtrgbijihjyhiyyyyyyyyyyyyyr0w9it9er98e87f6';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const beforeFile = formData.get('beforeImage') as File;
    const afterFile = formData.get('afterImage') as File;

    if (!beforeFile || !afterFile) {
      return NextResponse.json(
        { error: 'Both before and after images are required' },
        { status: 400 }
      );
    }

    // Validate file types
    if (!beforeFile.type.startsWith('image/') || !afterFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Both files must be images' },
        { status: 400 }
      );
    }

    // Upload both images to Vercel Blob
    const [beforeBlob, afterBlob] = await Promise.all([
      put(`before_${beforeFile.name}`, beforeFile, {
        access: 'public',
        addRandomSuffix: true,
      }),
      put(`after_${afterFile.name}`, afterFile, {
        access: 'public',
        addRandomSuffix: true,
      })
    ]);

    // Call n8n webhook with both images
    try {
      const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${N8N_JWT_TOKEN}`,
        },
        body: JSON.stringify({
          assessmentId: `assessment_${Date.now()}`,
          beforeImage: {
            url: beforeBlob.url,
            filename: beforeFile.name,
            size: beforeFile.size,
            type: beforeFile.type,
            blobData: beforeBlob,
          },
          afterImage: {
            url: afterBlob.url,
            filename: afterFile.name,
            size: afterFile.size,
            type: afterFile.type,
            blobData: afterBlob,
          },
          uploadedAt: new Date().toISOString(),
          status: 'uploaded',
        }),
      });

      if (!webhookResponse.ok) {
        console.warn('n8n webhook call failed:', webhookResponse.status, webhookResponse.statusText);
      } else {
        console.log('n8n webhook called successfully with both images');
      }
    } catch (webhookError) {
      console.error('Error calling n8n webhook:', webhookError);
      // Don't fail the main upload if webhook fails
    }

    return NextResponse.json({
      beforeBlob,
      afterBlob,
      assessmentId: `assessment_${Date.now()}`,
      status: 'success',
    });

  } catch (error) {
    console.error('Complete assessment upload error:', error);
    return NextResponse.json(
      { error: 'Assessment upload failed' },
      { status: 500 }
    );
  }
}