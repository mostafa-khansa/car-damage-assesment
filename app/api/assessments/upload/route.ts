import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

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

  const blob = await put(filename, body, {
    access: 'public',
    // Add metadata to help identify the image type
    addRandomSuffix: true,
  });

  return NextResponse.json(blob);
}

