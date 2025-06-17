export interface FoodItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  rating: number;
  reviews: number;
  isFavorite: boolean;
  available: boolean;
}

export interface OrderItem extends FoodItem {
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'picked-up' | 'delivered';
  totalAmount: number;
  createdAt: Date;
  estimatedDeliveryTime?: Date;
  deliveryAddress: string;
  riderId?: string;
}

export type FoodCategory = {
  id: string;
  name: string;
  image: string;
  active: boolean;
}; 