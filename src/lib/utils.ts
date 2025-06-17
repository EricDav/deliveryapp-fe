import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return (price / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN'
  });
}
