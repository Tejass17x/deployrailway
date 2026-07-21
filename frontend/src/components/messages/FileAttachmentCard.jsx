import { Download, FileText, TableProperties, FileArchive, File } from 'lucide-react';
import { formatFileSize } from '../../data/mockData';

const FILE_CONFIG = {
  'application/pdf': {
    bg: '#FEE2E2',
    Icon: FileText,
    iconColor: '#EF4444',
    label: 'PDF Document',
  },
  default_sheet: {
    bg: '#DBEAFE',
    Icon: TableProperties,
    iconColor: '#2563EB',
    label: 'Dataset',
  },
  'application/zip': {
    bg: '#EDE9FE',
    Icon: FileArchive,
    iconColor: '#4F46E5',
    label: 'Archive',
  },
};

function getConfig(fileType) {
  if (fileType === 'application/pdf') return FILE_CONFIG['application/pdf'];
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel') || fileType?.includes('csv'))
    return FILE_CONFIG['default_sheet'];
  if (fileType === 'application/zip') return FILE_CONFIG['application/zip'];
  return { bg: '#F1F5F9', Icon: File, iconColor: '#475569', label: 'File' };
}

export default function FileAttachmentCard({ attachment }) {
  const { fileName, fileSizeBytes, fileType, cdnUrl } = attachment;
  const { bg, Icon, iconColor, label } = getConfig(fileType);

  const handleDownload = (e) => {
    e.stopPropagation();
    if (cdnUrl && cdnUrl !== '#') {
      const a = document.createElement('a');
      a.href = cdnUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div
      onClick={handleDownload}
      className="attach-card hover-3d-lift flex items-center gap-3 p-3 bg-white border border-[#E2E8F0]
        rounded-xl cursor-pointer group"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <Icon size={20} color={iconColor} />
      </div>

      <div className="attach-content flex-1 overflow-hidden">
        <p className="text-sm font-semibold text-[#0F172A] truncate">{fileName}</p>
        <p className="text-xs text-[#475569]">
          {formatFileSize(fileSizeBytes)} • {label}
        </p>
      </div>

      <Download
        size={18}
        className="dl-icon text-[#94A3B8] group-hover:text-[#2563EB] transition-colors flex-shrink-0"
      />
    </div>

  );
}
