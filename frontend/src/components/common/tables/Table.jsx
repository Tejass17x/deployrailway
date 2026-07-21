import React from 'react';

const Table = ({
  headers = [],
  data = [],
  renderRow,
  loading = false,
  emptyMessage = 'No data available',
  className = ''
}) => {
  return (
    <div className={`w-full overflow-x-auto bg-bg-card border border-border rounded-2xl shadow-sm ${className}`}>
      <table className="min-w-full divide-y divide-border text-left text-sm text-text-secondary">
        <thead className="bg-bg-page text-text-primary text-xs font-bold uppercase tracking-wider">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-6 py-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-6 py-12 text-center text-sm font-medium text-text-secondary">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => renderRow(item, idx))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
