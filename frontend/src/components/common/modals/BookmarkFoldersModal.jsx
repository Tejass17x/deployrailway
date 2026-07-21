import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Folder, FolderPlus, Check } from 'lucide-react';

const BookmarkFoldersModal = ({ isOpen, onClose, folders, onSelectFolder, initialFolder = 'General' }) => {
  const [selected, setSelected] = useState(initialFolder);
  const [newFolder, setNewFolder] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  if (!isOpen) return null;

  const handleCreateAndSelect = () => {
    if (newFolder.trim()) {
      onSelectFolder(newFolder.trim());
      setNewFolder('');
      setShowAddInput(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F172A]/10 backdrop-blur-[2px] animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl shadow-xl overflow-hidden transition-colors"
      >
        
        {/* Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-bold text-[#0F172A]">Save to Collection</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#475569]/60 hover:text-red-600 rounded-lg hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="max-h-48 overflow-y-auto space-y-1">
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => setSelected(folder)}
                className={`w-full flex items-center justify-between p-3 text-sm font-medium rounded-xl border transition-all ${
                  selected === folder
                    ? 'border-[#2563EB]/30 bg-[#DBEAFE]/50 text-[#2563EB]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-[#475569]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Folder className={`w-4 h-4 ${selected === folder ? 'text-[#2563EB]' : 'text-[#475569]/60'}`} />
                  {folder}
                </div>
                {selected === folder && <Check className="w-4 h-4 text-[#2563EB]" />}
              </button>
            ))}
          </div>

          {/* New folder creation */}
          {!showAddInput ? (
            <button
              onClick={() => setShowAddInput(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-xs font-semibold border border-dashed border-slate-300 hover:border-[#2563EB] rounded-xl text-[#475569] hover:text-[#2563EB] transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              Create New Collection Folder
            </button>
          ) : (
            <div className="flex gap-2 p-1 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
              <input
                type="text"
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                placeholder="Collection name..."
                className="flex-1 px-3 py-1.5 text-sm bg-transparent outline-none text-[#0F172A]"
              />
              <button
                onClick={handleCreateAndSelect}
                className="px-3 py-1.5 text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowAddInput(false)}
                className="px-2.5 py-1.5 text-xs font-semibold text-[#475569] hover:text-[#0F172A] rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] flex justify-end gap-2 bg-[#F8FAFC]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelectFolder(selected)}
            className="px-4 py-2 text-xs font-bold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg transition-colors shadow-lg shadow-blue-500/10"
          >
            Save Changes
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default BookmarkFoldersModal;