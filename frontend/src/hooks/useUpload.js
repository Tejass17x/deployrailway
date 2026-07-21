import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';

// Allowed extensions
const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'pdf', 'docx', 'doc', 'ppt', 'pptx', 'xlsx', 'csv', 'zip'
];

/**
 * Custom React Query hook for universal file uploads.
 *
 * @param {object} options
 * @param {function} [options.onSuccess] - Callback on success.
 * @param {function} [options.onError] - Callback on error.
 * @param {function} [options.onProgress] - Callback to report percentage progress.
 * @param {string} [options.purpose] - Universal purpose (e.g. profile-avatar).
 * @param {string} [options.resourceId] - Optional parent resource ID.
 */
export const useUpload = (options = {}) => {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    onProgress,
    purpose,
    resourceId
  } = options;

  return useMutation({
    mutationFn: async ({ file, customPurpose, customResourceId }) => {
      const activePurpose = customPurpose || purpose;
      const activeResourceId = customResourceId || resourceId;

      if (!file) {
        throw new Error('Please select a file to upload.');
      }

      // Extension Validation
      const fileName = file.name || '';
      const extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        throw new Error(`Unsupported file format. Supported formats: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`);
      }

      // Size Validation
      const isImage = [
        'profile-avatar', 'profile-banner', 'publication-cover',
        'project-image', 'community-banner', 'institution-logo', 'book-cover'
      ].includes(activePurpose) || file.type.startsWith('image/');

      const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024; // 10MB for images, 100MB for docs

      if (file.size > maxSize) {
        throw new Error(isImage ? 'Image size cannot exceed 10MB.' : 'File size cannot exceed 100MB.');
      }

      const formData = new FormData();
      formData.append('file', file);
      if (activePurpose) formData.append('purpose', activePurpose);
      if (activeResourceId) formData.append('resourceId', activeResourceId);

      // Perform upload request
      const response = await axiosInstance.post('/v1/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });

      return response;
    },
    onSuccess: (response, variables) => {
      const activePurpose = variables.customPurpose || purpose;

      // Invalidate relevant React Query cache keys
      if (activePurpose === 'profile-avatar' || activePurpose === 'profile-banner') {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else if (activePurpose === 'publication-pdf' || activePurpose === 'publication-cover') {
        queryClient.invalidateQueries({ queryKey: ['publications'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else if (activePurpose === 'project-image') {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } else if (activePurpose === 'dataset') {
        queryClient.invalidateQueries({ queryKey: ['datasets'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      }

      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      toast.success(response.message || 'File uploaded successfully!');
      if (onSuccess) {
        onSuccess(response);
      }
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || error.message || 'File upload failed.';
      toast.error(errorMsg);
      if (onError) {
        onError(error);
      }
    }
  });
};
