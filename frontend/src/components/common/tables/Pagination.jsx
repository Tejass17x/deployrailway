import React from 'react';
import Button from '../buttons/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between px-4 py-3 sm:px-6 border-t border-border mt-4 ${className}`}>
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="secondary"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-text-secondary">
            Showing Page <span className="font-semibold text-text-primary">{currentPage}</span> of{' '}
            <span className="font-semibold text-text-primary">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="inline-flex space-x-1 shadow-sm rounded-lg" aria-label="Pagination">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              icon={<ChevronLeft className="w-4 h-4" />}
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              icon={<ChevronRight className="w-4 h-4" />}
            />
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
