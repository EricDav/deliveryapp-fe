export interface InventoryItem {
  id: number;
  name: string;
  image: string;
  category: string;
  price: string;
  recommended: boolean;
  status: 'available' | 'low in stock' | 'unavailable';
  portions: number;
  threshold: number;
}

export interface InventoryFilters {
  searchQuery: string;
  category: string;
  status: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
} 