export interface CustomerFilters {
  status?: string;
  orderBy?: string;
  sortBy?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
  pageNumber?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
}

export interface CustomersResponse {
  customers: Customer[];
  pagination: {
    total: number;
    pageSize: number;
    currentPage: number;
  };
} 