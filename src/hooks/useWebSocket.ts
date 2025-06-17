// src/hooks/useWebSocket.ts
import { useEffect, useCallback, useRef } from 'react';
import { websocketService } from '@/services/websocket';
import { Product } from '@/services/api';
import { useProducts } from './useProducts';
import { useToast } from '@/components/ui/use-toast';

export const useWebSocket = () => {
  const { mutate } = useProducts();
  const { toast } = useToast();
  const subscriptionsRef = useRef<(() => void)[]>([]);

  // Connect to WebSocket when component mounts
  useEffect(() => {
    websocketService.connect();
    return () => {
      // Cleanup all subscriptions and disconnect
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      websocketService.disconnect();
    };
  }, []);

  const subscribeToProductUpdates = useCallback(() => {
    const unsubscribe = websocketService.subscribeToProductUpdates((updatedProduct) => {
      // Show toast notification
      toast({
        title: "Product Updated",
        description: `${updatedProduct.name} has been updated`,
        variant: "success",
      });
      
      // Update products in the UI
      mutate(undefined, true);
    });

    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, [mutate, toast]);

  const subscribeToOrderUpdates = useCallback(async (orderId: string, onUpdate: (orderData: any) => void) => {
    const unsubscribe = await websocketService.subscribeToOrderUpdates(orderId, (orderData) => {
      // Extract the status from the first item in the data array
      const updateData = Array.isArray(orderData) ? orderData[0] : orderData;
      
      // Show toast notification
      toast({
        title: "Order Updated",
        description: `Order #${orderId} status: ${updateData.status}`,
        variant: "success",
      });
      
      // Call the callback with the extracted data
      onUpdate(updateData);
    });

    subscriptionsRef.current.push(unsubscribe);
    return unsubscribe;
  }, [toast]);

  return {
    subscribeToProductUpdates,
    subscribeToOrderUpdates,
  };
};