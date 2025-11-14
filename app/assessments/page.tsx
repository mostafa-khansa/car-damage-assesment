'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Assessment {
  _id: string;
  assessmentId: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  analysisResult?: any;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AssessmentsListPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });

  useEffect(() => {
    fetchAssessments(1);
  }, []);

  const fetchAssessments = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assessments/list?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setAssessments(data.assessments);
        setPagination(data.pagination);
      } else {
        setError('Failed to load assessments');
      }
    } catch (err) {
      setError('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Completed</span>;
      case 'processing':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Processing</span>;
      case 'failed':
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Failed</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{status}</span>;
    }
  };

  const getCostSummary = (assessment: Assessment) => {
    if (!assessment.analysisResult?.[0]?.content?.[0]?.text) return null;
    
    try {
      const text = assessment.analysisResult[0].content[0].text;
      const jsonMatch = text.match(/```json\s*\n([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      
      const data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (data.cost_summary) {
        return `$${data.cost_summary.grand_total_min.toLocaleString()} - $${data.cost_summary.grand_total_max.toLocaleString()}`;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  if (loading && assessments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">All Assessments</h1>
              <p className="text-gray-600">Total: {pagination.total} assessments</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              + New Assessment
            </button>
          </div>
        </div>

        {/* Assessments Grid */}
        {assessments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-gray-600 mb-6">Create your first damage assessment to get started</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
            >
              Create Assessment
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assessments.map((assessment) => (
                <div
                  key={assessment._id}
                  onClick={() => router.push(`/assessment/${assessment.assessmentId}`)}
                  className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow duration-200"
                >
                  {/* Images */}
                  <div className="grid grid-cols-2 gap-1 bg-gray-100">
                    <div className="relative h-40">
                      <img
                        src={assessment.beforeImageUrl}
                        alt="Before"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Before
                      </div>
                    </div>
                    <div className="relative h-40">
                      <img
                        src={assessment.afterImageUrl}
                        alt="After"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        After
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        {new Date(assessment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {getStatusBadge(assessment.status)}
                    </div>

                    <p className="text-xs text-gray-500 mb-2 font-mono truncate">
                      ID: {assessment.assessmentId}
                    </p>

                    {assessment.status === 'completed' && (() => {
                      const cost = getCostSummary(assessment);
                      return cost ? (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">Estimated Cost</p>
                          <p className="text-lg font-bold text-green-600">{cost}</p>
                        </div>
                      ) : null;
                    })()}

                    {assessment.status === 'processing' && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">Analyzing...</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <button className="w-full bg-blue-50 text-blue-600 py-2 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm">
                        View Report →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => fetchAssessments(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchAssessments(page)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        page === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => fetchAssessments(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
