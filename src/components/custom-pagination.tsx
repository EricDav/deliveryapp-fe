import React from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageCount?: boolean;
  totalItems?: number;
  currentItems?: number;
  className?: string;
  variant?: 'default' | 'compact';
  align?: 'center' | 'left' | 'right';
}

/**
 * A reusable pagination component for tables and lists
 */
const CustomPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageCount = true,
  totalItems,
  currentItems,
  className = '',
  variant = 'default',
  align = 'center',
}) => {
  // Generate the array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = variant === 'compact' ? 3 : 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      if (currentPage > 3 && variant !== 'compact') {
        pageNumbers.push(null); // ellipsis
      }
      
      // Calculate range around current page
      let startPage, endPage;
      
      if (variant === 'compact') {
        // For compact, just show current page if not near ends
        if (currentPage > 2 && currentPage < totalPages - 1) {
          pageNumbers.push(null);
          pageNumbers.push(currentPage);
          pageNumbers.push(null);
          pageNumbers.push(totalPages);
          return pageNumbers;
        } else {
          startPage = currentPage === totalPages ? totalPages - 2 : 2;
          endPage = currentPage === 1 ? 3 : totalPages - 1;
        }
      } else {
        startPage = Math.max(2, currentPage - 1);
        endPage = Math.min(totalPages - 1, currentPage + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        if (i > 1 && i < totalPages) {
          pageNumbers.push(i);
        }
      }
      
      if (currentPage < totalPages - 2 && variant !== 'compact') {
        pageNumbers.push(null); // ellipsis
      }
      
      // Always show last page
      if (totalPages > 1 && !pageNumbers.includes(totalPages)) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };
  
  if (totalPages <= 1 && !totalItems) {
    return null; // Don't render pagination if there's only one page and no items to show
  }
  
  // Determine container alignment class
  const alignClass = align === 'left' 
    ? 'items-start justify-start'
    : align === 'right' 
      ? 'items-end justify-end' 
      : 'items-center justify-center';
  
  // Determine if using compact style
  const isCompact = variant === 'compact';
  
  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      <div className="flex items-center space-x-1">
        {totalItems !== undefined && (
          <span className={`text-xs text-muted-foreground mr-2 ${!isCompact ? 'hidden sm:inline' : ''}`}>
            {totalItems} items
          </span>
        )}
      
        <Button 
          variant="outline" 
          size={isCompact ? "icon" : "sm"}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
          disabled={currentPage === 1}
          className={isCompact ? "h-8 w-8 p-0" : "p-2"}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {getPageNumbers().map((page, index) => 
          page === null ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm">...</span>
          ) : (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              size={isCompact ? "icon" : "sm"}
              onClick={() => onPageChange(page as number)}
              className={isCompact ? "h-8 w-8 p-0 min-w-0" : "min-w-[40px]"}
            >
              {page}
            </Button>
          )
        )}
        
        <Button 
          variant="outline" 
          size={isCompact ? "icon" : "sm"}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
          disabled={currentPage === totalPages}
          className={isCompact ? "h-8 w-8 p-0" : "p-2"}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {showPageCount && totalItems !== undefined && currentItems !== undefined && (
        <div className="text-center text-xs text-muted-foreground mt-1">
          {currentItems} of {totalItems}
        </div>
      )}
    </div>
  );
};

export default CustomPagination; 