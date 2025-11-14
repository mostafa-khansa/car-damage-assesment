import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongoose';
import AssessmentModel from '@/models/Assessment';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'assessmentId is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const assessment = await AssessmentModel.findOne({ assessmentId }).lean();

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      assessmentId: assessment.assessmentId,
      status: assessment.status,
      beforeImageUrl: assessment.beforeImageUrl,
      afterImageUrl: assessment.afterImageUrl,
      analysisResult: assessment.analysisResult,
      createdAt: assessment.createdAt,
      completedAt: assessment.completedAt,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check assessment status' },
      { status: 500 }
    );
  }
}
