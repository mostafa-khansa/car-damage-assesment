'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface AssessmentData {
  assessmentId: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  status: string;
  analysisResult: any;
  createdAt: string;
}

export default function AssessmentResultPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(`/api/assessments/status?assessmentId=${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setAssessment(data);
        } else {
          setError('Assessment not found');
        }
      } catch (err) {
        setError('Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAssessment();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Assessment not found'}</p>
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

  if (assessment.status !== 'completed' || !assessment.analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Assessment is still processing...</p>
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

  // Parse the assessment result
  const result = assessment.analysisResult[0]?.content[0];
  if (!result) {
    // Debug: log the actual structure
    console.log('Full analysisResult:', JSON.stringify(assessment.analysisResult, null, 2));
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid assessment data format</p>
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

  let assessmentData;
  let validationError = null;
  
  try {
    console.log('Raw text from n8n:', result.text.substring(0, 500));
    
    // Try to extract JSON from markdown code block
    let jsonString = '';
    const jsonMatch = result.text.match(/```json\s*\n([\s\S]*?)```/);
    
    if (jsonMatch && jsonMatch[1]) {
      console.log('Found JSON in code block');
      jsonString = jsonMatch[1];
    } else {
      // Try to find any JSON object in the text
      const jsonStart = result.text.indexOf('{');
      const jsonEnd = result.text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = result.text.substring(jsonStart, jsonEnd + 1);
        console.log('Attempting to parse JSON from position', jsonStart, 'to', jsonEnd);
      } else {
        console.error('No valid JSON boundaries found. jsonStart:', jsonStart, 'jsonEnd:', jsonEnd);
        throw new Error('No valid JSON found');
      }
    }

    console.log('JSON string length:', jsonString.length);
    
    // Try parsing the JSON - if it fails, try to fix common issues
    try {
      assessmentData = JSON.parse(jsonString);
    } catch (firstError) {
      console.warn('First parse attempt failed, trying to fix incomplete JSON...');
      
      // If JSON is incomplete, try to close it properly
      // Find the last complete property before the truncation
      let fixedJson = jsonString;
      
      // Count opening and closing braces
      const openBraces = (fixedJson.match(/\{/g) || []).length;
      const closeBraces = (fixedJson.match(/\}/g) || []).length;
      const openBrackets = (fixedJson.match(/\[/g) || []).length;
      const closeBrackets = (fixedJson.match(/\]/g) || []).length;
      
      // Remove incomplete trailing content (after last complete property)
      const lastComma = fixedJson.lastIndexOf(',');
      const lastCloseBrace = fixedJson.lastIndexOf('}');
      const lastCloseBracket = fixedJson.lastIndexOf(']');
      
      // If there's content after the last complete structure, remove it
      if (lastComma > Math.max(lastCloseBrace, lastCloseBracket)) {
        fixedJson = fixedJson.substring(0, lastComma);
      }
      
      // Add missing closing braces/brackets
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixedJson += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixedJson += '}';
      }
      
      console.log('Attempting to parse fixed JSON...');
      assessmentData = JSON.parse(fixedJson);
      console.log('Successfully parsed fixed JSON');
    }
    
    // Check if this is a validation error response
    if (assessmentData.validation_status === 'failed') {
      validationError = assessmentData;
    }
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Text content:', result.text);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <p className="text-red-600 mb-4 text-lg font-semibold">Could not parse assessment data</p>
          <p className="text-sm text-gray-600 mb-4">The analysis result format is invalid or incomplete</p>
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Show raw data</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
              {result.text}
            </pre>
          </details>
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

  // If validation failed, show error page
  if (validationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Assessment Failed</h1>
            <p className="text-gray-600">Assessment ID: {assessment.assessmentId}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Vehicle Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Before Image</h3>
                <img
                  src={assessment.beforeImageUrl}
                  alt="Before"
                  className="w-full h-64 object-cover rounded-lg border border-gray-200"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">After Image</h3>
                <img
                  src={assessment.afterImageUrl}
                  alt="After"
                  className="w-full h-64 object-cover rounded-lg border border-gray-200"
                />
              </div>
            </div>

            {/* Error Message */}
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-red-900 mb-2">
                    {validationError.error_code ? validationError.error_code.replace(/_/g, ' ') : 'Validation Error'}
                  </h4>
                  <p className="text-red-800 mb-4">{validationError.error_message}</p>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {validationError.error_details && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">🔍 What We Found</h4>
                <div className="space-y-3">
                  {validationError.error_details.before_image_analysis && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Before Image Analysis:</p>
                      <p className="text-sm text-gray-600 mt-1">{validationError.error_details.before_image_analysis}</p>
                    </div>
                  )}
                  {validationError.error_details.after_image_analysis && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">After Image Analysis:</p>
                      <p className="text-sm text-gray-600 mt-1">{validationError.error_details.after_image_analysis}</p>
                    </div>
                  )}
                  {validationError.error_details.issue_detected && (
                    <div className="pt-3 border-t border-orange-200">
                      <p className="text-sm font-semibold text-orange-800">Issue:</p>
                      <p className="text-sm text-gray-700 mt-1">{validationError.error_details.issue_detected}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer Summary */}
            {validationError.customer_summary && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">💡 What This Means</h4>
                <div className="space-y-4">
                  {validationError.customer_summary.bottom_line && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Bottom Line:</p>
                      <p className="text-sm text-gray-600 mt-1">{validationError.customer_summary.bottom_line}</p>
                    </div>
                  )}
                  {validationError.customer_summary.what_this_means && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Explanation:</p>
                      <p className="text-sm text-gray-600 mt-1">{validationError.customer_summary.what_this_means}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {(validationError.suggested_action || validationError.customer_summary?.next_steps) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">✅ Next Steps</h4>
                {validationError.suggested_action && (
                  <p className="text-sm text-gray-700 mb-4">{validationError.suggested_action}</p>
                )}
                {validationError.customer_summary?.next_steps && (
                  <ol className="space-y-2">
                    {validationError.customer_summary.next_steps.map((step: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-gray-700 mt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => router.push('/assessments')}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-700 transition-colors"
              >
                View All Assessments
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again with Correct Images
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-6 sm:py-12 px-3 sm:px-4 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 px-2">Damage Assessment Report</h1>
          <p className="text-sm sm:text-base text-gray-600">Assessment ID: {assessment.assessmentId}</p>
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-sm sm:text-base text-blue-600 hover:text-blue-800 underline"
            >
              ← New Assessment
            </button>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <button
              onClick={() => router.push('/assessments')}
              className="text-sm sm:text-base text-blue-600 hover:text-blue-800 underline"
            >
              View All Assessments
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Vehicle Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Before Damage</h3>
              <img
                src={assessment.beforeImageUrl}
                alt="Before damage"
                className="w-full h-48 sm:h-64 object-cover rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">After Damage</h3>
              <img
                src={assessment.afterImageUrl}
                alt="After damage"
                className="w-full h-48 sm:h-64 object-cover rounded-lg border border-gray-200"
              />
            </div>
          </div>

          {/* Damage Summary */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">🚗 Damage Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Vehicle</p>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{assessmentData.vehicle_info.visible_make_model}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Color</p>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 capitalize">{assessmentData.vehicle_info.color}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Severity</p>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">{assessmentData.damage_summary.overall_severity}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Impact Type</p>
                <p className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 capitalize">{assessmentData.damage_summary.impact_type}</p>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Description</p>
                <p className="text-xs sm:text-sm text-gray-800">{assessmentData.damage_summary.impact_description}</p>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          {assessmentData.cost_summary && assessmentData.cost_summary.grand_total_min !== undefined && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">💰 Estimated Cost</h4>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-700">
                  ${assessmentData.cost_summary.grand_total_min.toLocaleString()} - ${assessmentData.cost_summary.grand_total_max.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">{assessmentData.cost_summary.currency}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-green-200">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Labor</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${assessmentData.cost_summary.labor_total_min} - ${assessmentData.cost_summary.labor_total_max}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Paint</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${assessmentData.cost_summary.paint_materials_min} - ${assessmentData.cost_summary.paint_materials_max}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Parts</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ${assessmentData.cost_summary.parts_total_min} - ${assessmentData.cost_summary.parts_total_max}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Incomplete Data Warning */}
          {(!assessmentData.cost_summary || assessmentData.cost_summary.grand_total_min === undefined) && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">⚠️ Incomplete Assessment Data</h4>
              <p className="text-sm text-gray-700 mb-2">
                The analysis response was truncated and some information may be missing. 
                Available information is shown below.
              </p>
              <p className="text-xs text-gray-600">
                This can happen when the damage is severe and generates a very large report. 
                The damaged components information below should still be accurate.
              </p>
            </div>
          )}

          {/* Damaged Components */}
          <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">🔧 Damaged Components</h4>
            <div className="space-y-3 sm:space-y-4">
              {assessmentData.damaged_components && assessmentData.damaged_components.map((component: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-3 sm:pl-4 py-2">
                  <h5 className="text-sm sm:text-base font-semibold text-gray-900">{component.component_name}</h5>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{component.location}</p>
                  <p className="text-xs sm:text-sm text-gray-700 mt-2">{component.damage_type}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                      component.severity === 'Minor' ? 'bg-yellow-100 text-yellow-800' : 
                      component.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {component.severity}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-600">
                      {component.labor_hours}h · ${component.labor_cost_min}-${component.labor_cost_max}
                    </span>
                  </div>
                  {component.notes && (
                    <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">{component.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Repair Options */}
          {assessmentData.repair_options && assessmentData.repair_options.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">🛠️ Repair Options</h4>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {assessmentData.repair_options.map((option: any, index: number) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-3 sm:p-4 hover:border-blue-500 transition-colors">
                    <h5 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{option.option_name}</h5>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 mb-2">
                      ${option.total_cost_min.toLocaleString()} - ${option.total_cost_max.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Estimated time:</span> {option.estimated_days} days
                    </p>
                    <p className="text-xs text-gray-700">{option.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {assessmentData.recommendations && assessmentData.recommendations.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">⚠️ Recommendations</h4>
              <ul className="space-y-2">
                {assessmentData.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span className="text-xs sm:text-sm text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Potential Hidden Damage */}
          {assessmentData.potential_hidden_damage && assessmentData.potential_hidden_damage.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">🔍 Potential Hidden Damage</h4>
              <ul className="space-y-2">
                {assessmentData.potential_hidden_damage.map((damage: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span className="text-xs sm:text-sm text-gray-700">{damage}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-gray-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:bg-gray-700 active:scale-[0.98] transition-all"
            >
              Print Report
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-blue-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              New Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
