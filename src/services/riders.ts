import { apiService } from './api';

export interface RiderLocation {
  latitude: number;
  longitude: number;
  riderId: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'available' | 'busy' | 'offline';
  currentLocation?: RiderLocation;
}

class RiderService {
  // Get all available riders
  async getAvailableRiders(): Promise<Rider[]> {
    try {
      const response = await apiService.getAvailableRiders();
      return response || [];
    } catch (error) {
      console.error('Error fetching available riders:', error);
      throw error;
    }
  }


  // Assign rider to order
  async assignRiderToOrder(orderId: string, riderId: string): Promise<void> {
    try {
      // First update the order status to assigned
      await apiService.updateOrder(orderId, { status: 'assigned' });
      
      // Then update the rider details in a separate call
      await apiService.updateUserDetails(riderId, { currentOrderId: orderId });
    } catch (error) {
      console.error('Error assigning rider to order:', error);
      throw error;
    }
  }

  // Update order rider status
  async updateOrderRiderStatus(orderId: string, status: string): Promise<void> {
    try {
      await apiService.updateOrder(orderId, { status });
    } catch (error) {
      console.error('Error updating order rider status:', error);
      throw error;
    }
  }
}

export const riderService = new RiderService(); 