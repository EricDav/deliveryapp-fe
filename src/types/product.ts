interface Category {
  id: number;
  name: string;
  imageUrl: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  isAvailable: boolean;
  category: Category;
} 