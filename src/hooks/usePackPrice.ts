import { useState, useCallback } from 'react';
import { apiService, PackPriceItem, PackPriceApiResponse } from '@/services/api';

interface UsePackPriceReturn {
  calculatePrice: (items: PackPriceItem[]) => Promise<PackPriceApiResponse>;
  loading: boolean;
  error: string | null;
  result: PackPriceApiResponse | null;
  reset: () => void;
}

export const usePackPrice = (): UsePackPriceReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PackPriceApiResponse | null>(null);

  const calculatePrice = useCallback(async (items: PackPriceItem[]): Promise<PackPriceApiResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.calculatePackPrice(items);
      setResult(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate pack price';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    calculatePrice,
    loading,
    error,
    result,
    reset
  };
}; 