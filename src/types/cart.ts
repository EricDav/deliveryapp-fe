export interface FoodItem {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  imageUrl: string;
  description: string;
  category: {
    name: string;
  };
  isAvailable: boolean;
}

export interface CartItem extends FoodItem {
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  orderComment: string;
  addItem: (item: FoodItem) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateOrderComment: (comment: string) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
} 