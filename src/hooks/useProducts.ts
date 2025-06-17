import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService, Product as ApiProduct, Category } from '@/services/api';

// Use FoodItem interface expected by the menu component
export interface FoodItem {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  categoryName: string; // Renamed to avoid conflicts
  isAvailable: boolean;
  // Additional fields needed for Cart compatibility
  squareId: string;
  description: string;
  imageUrl: string;
  imageUrl2: string | null;
  imageUrl3: string | null;
  categoryId: number;
  threshHold: number | null;
  portionCount: number | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface PaginationInfo {
  total: number;
  pageSize: number;
  currentPage: number;
  hasMore: boolean;
}

export function useProducts() {
  const [products, setProducts] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pageSize: 10, // Match API default
    currentPage: 1,
    hasMore: false,
  });
  const MAX_RETRIES = 3;
  const currentFiltersRef = useRef<{ query?: string; category?: string | null }>({});
  const currentPageRef = useRef(1);
      
  // Transform API products to FoodItem format
  const transformProducts = (apiProducts: ApiProduct[]): FoodItem[] => {
    return apiProducts.map((apiProduct: ApiProduct) => ({
        id: apiProduct.id,
        name: apiProduct.name,
        price: apiProduct.price,
        rating: 4.5, // Default value
        reviews: 0, // Default value
        image: apiProduct.imageUrl,
        categoryName: apiProduct.category.name,
        isAvailable: apiProduct.isAvailable,
        squareId: apiProduct.squareId,
        description: apiProduct.description,
        imageUrl: apiProduct.imageUrl,
        imageUrl2: apiProduct.imageUrl2,
        imageUrl3: apiProduct.imageUrl3,
        categoryId: apiProduct.categoryId,
        threshHold: apiProduct.threshHold,
        portionCount: apiProduct.portionCount,
        createdAt: apiProduct.createdAt,
        updatedAt: apiProduct.updatedAt,
        category: apiProduct.category
      }));
  };

  // Fetch products with pagination support
  const fetchProducts = useCallback(async (
    params?: { query?: string; category?: string | null }, 
    pageNumber: number = 1,
    append: boolean = false
  ) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      // Store current filters for loadMore function
      currentFiltersRef.current = params || {};
      
      console.log(`Fetching products - PageNumber: ${pageNumber}, Append: ${append}`);
      
      // Use the API service with query parameters and pagination
      const data = await apiService.getProducts({
        ...params,
        pageNumber,
        pageSize: 10, // Use API default page size
      });
      
      const transformedProducts = transformProducts(data.products);
      
      if (append) {
        // Append to existing products
        setProducts(prev => [...prev, ...transformedProducts]);
      } else {
        // Replace products and reset page
      setProducts(transformedProducts);
        currentPageRef.current = 1;
      }
      
      // Update pagination info with the actual page we just fetched
      const newPagination = {
        total: data.pagination.total,
        pageSize: data.pagination.pageSize,
        currentPage: pageNumber, // Use the pageNumber we just fetched
        hasMore: pageNumber * data.pagination.pageSize < data.pagination.total,
      };
      
      setPagination(newPagination);
      
      // Update the current page ref for loadMore
      if (append) {
        currentPageRef.current = pageNumber;
      }
      
      console.log(`Pagination updated:`, newPagination);
      
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching products:', err);
      
      // Handle network errors
      if (err instanceof Error) {
        if (err.message.includes('Unable to connect to the server') && retryCount < MAX_RETRIES) {
          // Increment retry count and try again after a delay
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchProducts(params, pageNumber, append);
          }, 2000); // Wait 2 seconds before retrying
          return;
        }
        
        setError(err);
      } else {
        setError(new Error('An unexpected error occurred while fetching products'));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [retryCount]);

  // Load more products for infinite scrolling
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loadingMore && !loading) {
      const nextPageNumber = currentPageRef.current + 1;
      console.log(`Loading more - Current page ref: ${currentPageRef.current}, Next pageNumber: ${nextPageNumber}`);
      fetchProducts(currentFiltersRef.current, nextPageNumber, true);
    }
  }, [fetchProducts, pagination.hasMore, loadingMore, loading]);

  // Refetch products (resets to page 1)
  const refetch = useCallback((params?: { query?: string; category?: string | null }) => {
    return fetchProducts(params, 1, false);
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts(); // Initial fetch without params
  }, []);

  // Add mutation function to update products data
  const mutate = useCallback((data?: FoodItem[], shouldRevalidate = true) => {
    if (data) {
      setProducts(data);
    }
    
    if (shouldRevalidate) {
      return fetchProducts();
    }
    
    return Promise.resolve();
  }, [fetchProducts]);

  return { 
    products, 
    loading, 
    loadingMore,
    error, 
    refetch, 
    loadMore,
    mutate,
    pagination,
    isRetrying: retryCount > 0,
    retryCount
  };
} 