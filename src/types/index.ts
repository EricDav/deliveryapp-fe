export interface User {
  id: number;
  fullName: string;
  phoneNumber: string;
  role: 'admin' | 'customer' | 'rider' | 'bukka_staff' | 'csr';
  isActive: boolean;
  image?: string;
}

export interface Customer extends User {
  hasDiscount: boolean;
  discountAmount: number;
  address: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  totalPortion: number;
  threshHold: number;
  availabilityTime: number;
  isAvailable: boolean;
  price: number;
  stock: number;
  imageUrl: string;
}

export interface OrderItem {
  orderId: number;
  productId: number;
  quantity: number;
}

export interface Order {
  id: number;
  customerId: number;
  riderId: number | null;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: OrderItem[];
} 