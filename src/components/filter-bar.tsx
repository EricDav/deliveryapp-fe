// components/FilterBar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Search, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';

export type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

type CustomerType = 'all' | 'new' | 'returning' | 'vip';
type StatusType = 'all' | 'active' | 'inactive' | 'pending';

type FilterOptions = {
  searchQuery: string;
  dateRange: DateRange;
  customerType: any;
  status: any;
};

interface FilterBarProps {
  initialFilters?: Partial<FilterOptions>;
  onFilterChange: (filters: FilterOptions) => void;
  customerTypeOptions?: Array<{ value: string; label: string }>;
  statusOptions?: Array<{ value: string; label: string }>;
  showSearch?: boolean;
  showDateRange?: boolean;
  showCustomerType?: boolean;
  showStatus?: boolean;
  showFilterButton?: boolean;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  initialFilters = {},
  onFilterChange,
  customerTypeOptions = [
    { value: 'all', label: 'All Customers' },
    { value: 'new', label: 'New Customers' },
    { value: 'returning', label: 'Returning Customers' },
    { value: 'vip', label: 'VIP Customers' },
  ],
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
  ],
  showSearch = true,
  showDateRange = true,
  showCustomerType = true,
  showStatus = true,
  showFilterButton = true,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || '');
  const [date, setDate] = useState<DateRange>({
    from: initialFilters.dateRange?.from,
    to: initialFilters.dateRange?.to,
  });
  const [customerType, setCustomerType] = useState<CustomerType>((initialFilters.customerType as CustomerType) || 'all');
  const [status, setStatus] = useState<StatusType>((initialFilters.status as StatusType) || 'all');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onFilterChange({
      searchQuery: newValue,
      dateRange: date,
      customerType,
      status,
    });
  };

  const handleDateChange = (range: any) => {
    const newDate = {
      from: range?.from,
      to: range?.to,
    };
    setDate(newDate);
    onFilterChange({
      searchQuery,
      dateRange: newDate,
      customerType,
      status,
    });
  };

  const handleCustomerTypeChange = (value: string) => {
    const newType = value as CustomerType;
    setCustomerType(newType);
    onFilterChange({
      searchQuery,
      dateRange: date,
      customerType: newType,
      status,
    });
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value as StatusType;
    setStatus(newStatus);
    onFilterChange({
      searchQuery,
      dateRange: date,
      customerType,
      status: newStatus,
    });
  };

  const handleReset = () => {
    const resetValues = {
      searchQuery: '',
      dateRange: { from: undefined, to: undefined },
      customerType: 'all' as CustomerType,
      status: 'all' as StatusType,
    };
    
    setSearchQuery(resetValues.searchQuery);
    setDate(resetValues.dateRange);
    setCustomerType(resetValues.customerType);
    setStatus(resetValues.status);
    
    onFilterChange(resetValues);
  };

  return (
    <div className={`flex flex-wrap gap-3 mb-6 ${className}`}>
      {showSearch && (
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search"
            className="pl-10 pr-4 py-2 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {showDateRange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[240px]">
              <Calendar className="h-4 w-4" />
              {date.from && date.to
                ? `${format(date.from, "d MMM")} - ${format(date.to, "d MMM yyyy")}`
                : "Select date range"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-auto h-4 w-4 opacity-50"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              selected={{
                from: date.from || undefined,
                to: date.to || undefined,
              }}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}

      {showCustomerType && (
        <Select value={customerType} onValueChange={handleCustomerTypeChange}>
          <SelectTrigger className="min-w-[180px]">
            <SelectValue placeholder="All Items" />
          </SelectTrigger>
          <SelectContent>
            {customerTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showStatus && (
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="min-w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showFilterButton && (
        <Button variant="outline" className="gap-2" onClick={handleReset}>
          <Filter className="h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
};

export default FilterBar;