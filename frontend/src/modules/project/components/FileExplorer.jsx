import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderOpen, FileText, Upload, Trash, Download, Plus, HardDrive, Info } from 'lucide-react';
import projectService from '../services/project.service';
import { toast } from 'react-hot-toast';

export default function FileExplorer({ projectId, permissions }) {
  const queryClient = useQueryClient();
  const [folder, setFolder] = useState('/');
  const [fileToUpload, setFileToUpload] = useState(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 1. Fetch files in project
  const { data = {}, isLoading } = useQuery({
    queryKey: ['project:files', projectId, folder],
    queryFn: async () => {
      const res = await projectService.listFiles(projectId, { folder });
      return res.data; // { docs, total, page, limit, totalPages }
    },
    enabled: !!projectId,
  });
  const files = data.docs || [];

  // 2. Fetch list of folders in project
  const { data: folders = [] } = useQuery({
    queryKey: ['project:folders', projectId],
    queryFn: async () => {
      const res = await projectService.listFolders(projectId);
      return res.data;
    },
    enabled: !!projectId,
  });

  // 3. Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: (fileId) => projectService.deleteFile(projectId, fileId),
    onSuccess: () => {
      toast.success('File deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['project:files', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project:folders', projectId] });
    },
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('folder', folder);
    formData.append('description', description);

    try {
      await projectService.uploadFile(projectId, formData);
      toast.success('File uploaded successfully!');
      setFileToUpload(null);
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['project:files', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project:folders', projectId] });
    } catch (err) {
      toast.error(err.message || 'File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const res = await projectService.downloadFile(projectId, file._id);
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      toast.error('Failed to retrieve file download link.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 font-sans">Document Directory</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Access Cloudflare R2 workspace files and datasets</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] items-start">
        {/* Left: Files Listing */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[400px] space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-slate-400">
            <HardDrive size={15} />
            <span>ROOT DIRECTORY /</span>
          </div>

          {isLoading ? (
            <p className="text-xs text-slate-400 font-semibold italic text-center py-6">Loading file directory...</p>
          ) : files.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen size={40} className="mx-auto text-slate-200 mb-3" />
              <p className="text-xs text-slate-400 font-semibold">No files uploaded in this folder.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {files.map((file) => (
                <div key={file._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-650 flex items-center justify-center shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB &nbsp;•&nbsp; Uploaded by {file.uploadedBy?.fullName || 'Researcher'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-1.5 rounded-lg border border-slate-250 text-slate-500 hover:bg-slate-50 transition"
                      title="Download File"
                    >
                      <Download size={13} />
                    </button>
                    {permissions.canManageFiles && (
                      <button
                        onClick={() => { if (window.confirm('Delete this file permanently?')) deleteMutation.mutate(file._id); }}
                        className="p-1.5 rounded-lg border border-slate-250 text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete File"
                      >
                        <Trash size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Upload Panel */}
        {permissions.canManageFiles && (
          <aside className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Upload File</h4>
            
            <form onSubmit={handleUpload} className="space-y-3">
              <div className="border border-dashed border-slate-250 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col items-center justify-center cursor-pointer text-center relative min-h-[120px]">
                <Upload size={20} className="text-slate-400 mb-1" />
                <span className="text-[11px] font-bold text-slate-700">
                  {fileToUpload ? fileToUpload.name : 'Select document / dataset'}
                </span>
                <span className="text-[9px] text-slate-400 mt-1">Up to 100MB</span>
                <input
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              />

              <button
                type="submit"
                disabled={!fileToUpload || isUploading}
                className="w-full bg-blue-650 text-white rounded-xl py-2.5 text-xs font-black shadow-md hover:bg-blue-700 transition disabled:opacity-50 inline-flex justify-center items-center gap-1.5"
              >
                {isUploading ? 'Uploading to R2...' : 'Upload Document'}
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
