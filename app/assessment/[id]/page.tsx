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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Damage Assessment Report</h1>
          <p className="text-gray-600">Assessment ID: {assessment.assessmentId}</p>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← New Assessment
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => router.push('/assessments')}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View All Assessments
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Vehicle Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Before Damage</h3>
              <img
                src={assessment.beforeImageUrl}
                alt="Before damage"
                className="w-full h-64 object-cover rounded-lg border border-gray-200"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">After Damage</h3>
              <img
                src={assessment.afterImageUrl}
                alt="After damage"
                className="w-full h-64 object-cover rounded-lg border border-gray-200"
              />
            </div>
          </div>

          {/* Damage Summary */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">🚗 Damage Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Vehicle</p>
                <p className="text-lg font-semibold text-gray-900">{assessmentData.vehicle_info.visible_make_model}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Color</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{assessmentData.vehicle_info.color}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Severity</p>
                <p className="text-lg font-semibold text-gray-900">{assessmentData.damage_summary.overall_severity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Impact Type</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{assessmentData.damage_summary.impact_type}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-sm text-gray-800">{assessmentData.damage_summary.impact_description}</p>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">💰 Estimated Cost</h4>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-700">
                ${assessmentData.cost_summary.grand_total_min.toLocaleString()} - ${assessmentData.cost_summary.grand_total_max.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-2">{assessmentData.cost_summary.currency}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-green-200">
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

          {/* Damaged Components */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-4">🔧 Damaged Components</h4>
            <div className="space-y-4">
              {assessmentData.damaged_components && assessmentData.damaged_components.map((component: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h5 className="font-semibold text-gray-900">{component.component_name}</h5>
                  <p className="text-sm text-gray-600 mt-1">{component.location}</p>
                  <p className="text-sm text-gray-700 mt-2">{component.damage_type}</p>
                  <div className="flex items-center space-x-4 mt-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      component.severity === 'Minor' ? 'bg-yellow-100 text-yellow-800' : 
                      component.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {component.severity}
                    </span>
                    <span className="text-sm text-gray-600">
                      {component.labor_hours}h labor · ${component.labor_cost_min}-${component.labor_cost_max}
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
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">🛠️ Repair Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assessmentData.repair_options.map((option: any, index: number) => (
                  <div key={index} className="border border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                    <h5 className="font-semibold text-gray-900 mb-2">{option.option_name}</h5>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">⚠️ Recommendations</h4>
              <ul className="space-y-2">
                {assessmentData.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Potential Hidden Damage */}
          {assessmentData.potential_hidden_damage && assessmentData.potential_hidden_damage.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4">🔍 Potential Hidden Damage</h4>
              <ul className="space-y-2">
                {assessmentData.potential_hidden_damage.map((damage: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span className="text-sm text-gray-700">{damage}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => window.print()}
              className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              Print Report
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              New Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
