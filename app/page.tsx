'use client';

import type { PutBlobResult } from '@vercel/blob';
import { useState, useRef, useCallback } from 'react';

interface UploadResult {
  beforeBlob: PutBlobResult | null;
  afterBlob: PutBlobResult | null;
}

export default function CarAssessmentPage() {
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult>({ beforeBlob: null, afterBlob: null });
  const [isUploading, setIsUploading] = useState(false);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [isDragOverBefore, setIsDragOverBefore] = useState(false);
  const [isDragOverAfter, setIsDragOverAfter] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File, type: 'before' | 'after') => {
    setError(null);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'before') {
        setBeforePreview(e.target?.result as string);
      } else {
        setAfterPreview(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, type: 'before' | 'after') => {
    e.preventDefault();
    if (type === 'before') {
      setIsDragOverBefore(true);
    } else {
      setIsDragOverAfter(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, type: 'before' | 'after') => {
    e.preventDefault();
    if (type === 'before') {
      setIsDragOverBefore(false);
    } else {
      setIsDragOverAfter(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'before' | 'after') => {
    e.preventDefault();
    if (type === 'before') {
      setIsDragOverBefore(false);
    } else {
      setIsDragOverAfter(false);
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      handleFileSelect(file, type);
      
      // Update the input field
      const inputRef = type === 'before' ? beforeFileRef : afterFileRef;
      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        inputRef.current.files = dt.files;
      }
    }
  }, [handleFileSelect]);

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!beforeFileRef.current?.files || !afterFileRef.current?.files) {
      setError("Please select both before and after damage images");
      return;
    }

    const beforeFile = beforeFileRef.current.files[0];
    const afterFile = afterFileRef.current.files[0];
    setIsUploading(true);

    try {
      // Create FormData with both images
      const formData = new FormData();
      formData.append('beforeImage', beforeFile);
      formData.append('afterImage', afterFile);

      // Submit complete assessment with both images
      const response = await fetch('/api/assessments/complete', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Assessment upload failed');
      }

      const result = await response.json();
      setUploadResult({ 
        beforeBlob: result.beforeBlob, 
        afterBlob: result.afterBlob 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadResult({ beforeBlob: null, afterBlob: null });
    setBeforePreview(null);
    setAfterPreview(null);
    setError(null);
    if (beforeFileRef.current) {
      beforeFileRef.current.value = '';
    }
    if (afterFileRef.current) {
      afterFileRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Car Damage Assessment</h1>
          <p className="text-lg text-gray-600">Upload an image of your vehicle for damage analysis</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!uploadResult.beforeBlob && !uploadResult.afterBlob ? (
            <form onSubmit={handleFormSubmit} className="space-y-8">
              {/* Two Upload Areas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Before Damage Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">Before Damage</h3>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                      isDragOverBefore
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 'before')}
                    onDragLeave={(e) => handleDragLeave(e, 'before')}
                    onDrop={(e) => handleDrop(e, 'before')}
                  >
                    <input
                      name="beforeFile"
                      ref={beforeFileRef}
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'before');
                      }}
                    />
                    
                    <div className="space-y-3">
                      <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Drop image here or <span className="text-green-600">browse</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Before Preview */}
                  {beforePreview && (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={beforePreview}
                        alt="Before damage preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* After Damage Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">After Damage</h3>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
                      isDragOverAfter
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={(e) => handleDragOver(e, 'after')}
                    onDragLeave={(e) => handleDragLeave(e, 'after')}
                    onDrop={(e) => handleDrop(e, 'after')}
                  >
                    <input
                      name="afterFile"
                      ref={afterFileRef}
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'after');
                      }}
                    />
                    
                    <div className="space-y-3">
                      <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Drop image here or <span className="text-red-600">browse</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Max 10MB</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* After Preview */}
                  {afterPreview && (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={afterPreview}
                        alt="After damage preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading || !beforePreview || !afterPreview}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading Images...</span>
                  </div>
                ) : (
                  'Start Damage Assessment'
                )}
              </button>
            </form>
          ) : (
            /* Success State */
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h3>
                <p className="text-gray-600">Both before and after damage images have been uploaded successfully.</p>
              </div>

              {/* Image Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Before Damage Image</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={uploadResult.beforeBlob?.url || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs"
                    />
                    <button
                      onClick={() => uploadResult.beforeBlob && navigator.clipboard.writeText(uploadResult.beforeBlob.url)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">After Damage Image</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={uploadResult.afterBlob?.url || ''}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs"
                    />
                    <button
                      onClick={() => uploadResult.afterBlob && navigator.clipboard.writeText(uploadResult.afterBlob.url)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-xs font-medium"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <a
                  href={uploadResult.beforeBlob?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-xl font-medium text-center hover:bg-green-700 transition-colors duration-200"
                >
                  View Before Image
                </a>
                <a
                  href={uploadResult.afterBlob?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-medium text-center hover:bg-red-700 transition-colors duration-200"
                >
                  View After Image
                </a>
                <button
                  onClick={resetUpload}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-medium hover:bg-gray-300 transition-colors duration-200"
                >
                  Upload New Set
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fast Processing</h3>
            <p className="text-gray-600 text-sm">Quick analysis of damage using advanced AI technology</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Accurate Results</h3>
            <p className="text-gray-600 text-sm">Precise damage assessment with detailed reporting</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Secure Upload</h3>
            <p className="text-gray-600 text-sm">Your images are processed securely and privately</p>
          </div>
        </div>
      </div>
    </div>
  );
}