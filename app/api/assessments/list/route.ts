import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import AssessmentModel from '@/models/Assessment';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    await connectToDatabase();
    
    const [assessments, total] = await Promise.all([
      AssessmentModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      AssessmentModel.countDocuments()
    ]);

    return NextResponse.json({
      assessments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('List assessments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
