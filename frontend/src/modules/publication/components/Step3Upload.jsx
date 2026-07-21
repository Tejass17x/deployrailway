import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, RefreshCw, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import publicationService from '../../../services/publication.service';

const LOADING_STEPS = [
  'Uploading PDF to Secure Server...',
  'Reading PDF Content...',
  'Extracting Document Metadata...',
  'Finding Authors and Affiliations...',
  'Detecting Abstract...',
  'Finding DOI & Scientific References...',
  'Extracting Keywords using TF-IDF...',
  'Analyzing Research Area & Taxonomy...',
  'Auto Filling Form...'
];

const Step3Upload = ({ fileDetails, onUploadSuccess, onRemove, onSkip }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    let interval;
    if (isUploading) {
      setCurrentStepIndex(0);
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Trigger both operations in parallel to optimize extraction speed
      const uploadPromise = publicationService.uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      const extractPromise = publicationService.extractMetadata(formData);

      const [uploadResponse, extractResponse] = await Promise.all([
        uploadPromise.catch(err => {
          console.error('File upload failed', err);
          return { success: false, message: err.message || 'File upload failed.' };
        }),
        extractPromise.catch(err => {
          console.error('Metadata extraction failed', err);
          return { success: false, data: null };
        })
      ]);

      if (uploadResponse.success) {
        toast.success('File uploaded and metadata extracted successfully!');
        onUploadSuccess({
          r2Data: uploadResponse.data,
          extractedMetadata: extractResponse.success && extractResponse.data ? extractResponse.data.extractedMetadata : null,
          cacheId: extractResponse.success && extractResponse.data ? extractResponse.data.cacheId : null,
          originalName: file.name
        });
      } else {
        toast.error(uploadResponse.message || 'File upload failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error occurred during file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (acceptedFiles, fileRejections) => {
    if (fileRejections && fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        toast.error('File size exceeds the 100 MB limit.');
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        toast.error('Unsupported file format. Only PDF files are supported.');
      } else {
        toast.error(rejection.errors[0]?.message || 'File validation failed.');
      }
      return;
    }

    if (acceptedFiles && acceptedFiles[0]) {
      uploadFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 100 * 1024 * 1024,
    multiple: false
  });

  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-extrabold text-slate-900">Do you want to add a file?</h2>
        <p className="text-xs text-slate-500 mt-1">You can add publication details in the next step.</p>
      </div>

      {!fileDetails?.secure_url && !isUploading ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center min-h-[220px] transition-all cursor-pointer ${
            isDragActive 
              ? 'border-blue-600 bg-blue-50/20' 
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <input {...getInputProps()} />
          <span className="p-3.5 rounded-full bg-blue-50 text-blue-600 mb-4">
            <Upload className="w-6 h-6" />
          </span>
          <p className="text-sm font-bold text-slate-900">Drag & Drop PDF here, or Browse Files</p>
          <p className="text-[10px] text-slate-400 mt-2">
            Supported: PDF (Max 100 MB)
          </p>
        </div>
      ) : isUploading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[220px]">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-900">{LOADING_STEPS[currentStepIndex]}</p>
          <div className="w-full max-w-md bg-slate-100 rounded-full h-2.5 mt-4 overflow-hidden relative">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-blue-600 mt-2">{uploadProgress}%</span>
        </div>
      ) : (
        <div className="bg-white border border-blue-100 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
            <span className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <FileText className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {fileDetails.originalName || 'uploaded_document'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {formatBytes(fileDetails.bytes)} • {fileDetails.format?.toUpperCase() || 'FILE'}
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
                <CheckCircle className="w-3.5 h-3.5" /> Verified Secure Cloud Link
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <button
                type="button"
                className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2.5 rounded-xl active:scale-[0.98]"
              >
                Replace File
              </button>
            </div>
            <button
              onClick={onRemove}
              className="flex-grow sm:flex-grow-0 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors px-4 py-2.5 rounded-xl active:scale-[0.98]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {!fileDetails?.secure_url && (
        <div className="text-center pt-2">
          <button
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span>Skip Upload (Proceed without file)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Step3Upload;
