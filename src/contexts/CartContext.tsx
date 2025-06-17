'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FoodItem } from '@/hooks/useProducts';
import { apiService, PackPriceItem, PackPriceApiResponse } from '@/services/api';

export interface CartItem extends FoodItem {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  orderComment: string;
  addItem: (item: FoodItem) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateOrderComment: (comment: string) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  packPrice: number;
  packCount: number;
  deliveryFee: number;
  total: number;
  isCartInitialized: boolean;
  packPriceLoading: boolean;
  packPriceError: string | null;
  deliveryFeeLoading: boolean;
  deliveryFeeError: string | null;
  userLocation: { latitude: number; longitude: number; address?: string } | null;
  locationError: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Safe check for browser environment
const isBrowser = () => typeof window !== 'undefined';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderComment, setOrderComment] = useState('');
  const [isCartInitialized, setIsCartInitialized] = useState(false);
  const [packPrice, setPackPrice] = useState(0);
  const [packCount, setPackCount] = useState(0);
  const [packPriceLoading, setPackPriceLoading] = useState(false);
  const [packPriceError, setPackPriceError] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryFeeLoading, setDeliveryFeeLoading] = useState(false);
  const [deliveryFeeError, setDeliveryFeeError] = useState<string | null>(null);
  
  // Location state for delivery fee calculation
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Track pack data for individual items
  const [itemPackData, setItemPackData] = useState<Record<number, { price: number; name: string }>>({});

  // Function to get user's current location
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = 'Unable to get location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    });
  };

  // Load cart items from localStorage on mount
  useEffect(() => {
    if (!isBrowser()) return;
    
    const savedCart = localStorage.getItem('cartItems');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart items:', error);
        localStorage.removeItem('cartItems');
      }
    }
    setIsCartInitialized(true);
  }, []);

  useEffect(() => {
    if (!isBrowser() || !items.length) return;
    
    localStorage.setItem('cartItems', JSON.stringify(items));
  }, [items]);

  // Calculate pack price when items change
  useEffect(() => {
    if (items.length === 0) {
      setPackPrice(0);
      setPackCount(0);
      setPackPriceError(null);
      setItemPackData({});
      return;
    }

    const calculatePackPrice = async () => {
      setPackPriceLoading(true);
      setPackPriceError(null);
      
      try {
        // Check each item individually for pack requirements
        const packPromises = items.map(async (item) => {
          try {
            const result = await apiService.calculatePackPrice([{
              productId: item.id,
              portions: item.quantity
            }]);
            
            const responseItems = Array.isArray(result) ? result : (result as any).data || [];
            
            if (responseItems.length > 0) {
              // This item needs a pack
              const packItem = responseItems[0];
              return {
                itemId: item.id,
                packData: {
                  price: packItem.price,
                  name: packItem.name
                }
              };
            }
            
            return null; // No pack needed for this item
          } catch (error) {
            console.error(`Error calculating pack for item ${item.id}:`, error);
            return null;
          }
        });
        
        // Wait for all pack calculations to complete
        const packResults = await Promise.all(packPromises);
        
        // Build the new pack data record
        const newPackData: Record<number, { price: number; name: string }> = {};
        packResults.forEach(result => {
          if (result) {
            newPackData[result.itemId] = result.packData;
          }
        });
        
        setItemPackData(newPackData);
        
        // Calculate totals from stored pack data
        const totalPackPrice = Object.values(newPackData).reduce((sum, pack) => sum + pack.price, 0);
        const totalPackCount = Object.keys(newPackData).length;
      
        
        setPackPrice(totalPackPrice);
        setPackCount(totalPackCount);
        
      } catch (error) {
        console.error('Error in pack price calculation:', error);
        setPackPriceError(`Failed to calculate pack price: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fallback
        setPackPrice(30000);
        setPackCount(1);
      } finally {
        setPackPriceLoading(false);
      }
    };

    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(calculatePackPrice, 500);
    return () => clearTimeout(timeoutId);
  }, [items]);

  // Fetch delivery fee on mount
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      setDeliveryFeeLoading(true);
      setDeliveryFeeError(null);
      setLocationError(null);
      
      try {
        // First try to get user's location
        let locationParams: { lat?: number; long?: number; address?: string } | undefined;
        
        try {
          const location = await getCurrentLocation();
          setUserLocation(location);
          locationParams = {
            lat: location.latitude,
            long: location.longitude,
          };
          console.log('Got user location:', location);
        } catch (locationErr) {
          console.warn('Could not get user location:', locationErr);
          setLocationError(locationErr instanceof Error ? locationErr.message : 'Location unavailable');
          // Continue without location - API should handle this gracefully
        }
        
        // Fetch delivery fee with or without location
        const fee = await apiService.getDeliveryFee(locationParams);
        setDeliveryFee(fee);
        console.log('Delivery fee calculated:', fee, 'with params:', locationParams);
        
      } catch (error) {
        console.error('Error fetching delivery fee:', error);
        setDeliveryFeeError(`Failed to fetch delivery fee: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fallback to a reasonable default (e.g., 50000 kobo = ₦500)
        setDeliveryFee(50000);
      } finally {
        setDeliveryFeeLoading(false);
      }
    };

    fetchDeliveryFee();
  }, []);

  const addItem = (item: FoodItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    setItems((prevItems) => {
      if (quantity === 0) {
        // Remove pack data for this item when removing from cart
        setItemPackData(prevPackData => {
          const newPackData = { ...prevPackData };
          delete newPackData[id];
          return newPackData;
        });
        return prevItems.filter((item) => item.id !== id);
      }
      return prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
    });
  };

  const updateOrderComment = (comment: string) => {
    setOrderComment(comment);
  };

  const clearCart = () => {
    setItems([]);
    setItemPackData({});
    if (isBrowser()) {
      localStorage.removeItem('cartItems');
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + packPrice + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        orderComment,
        addItem,
        updateQuantity,
        updateOrderComment,
        clearCart,
        subtotal,
        tax,
        total,
        isCartInitialized,
        packPrice,
        packPriceLoading,
        packPriceError,
        packCount,
        deliveryFee,
        deliveryFeeLoading,
        deliveryFeeError,
        userLocation,
        locationError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 