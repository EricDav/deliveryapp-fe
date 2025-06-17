import { FoodItem } from "@/types/cart";
import { formatPrice } from "@/lib/utils";

interface FoodMenuProps {
  items: FoodItem[];
  onAddToCart: (item: FoodItem) => void;
}

export default function FoodMenu({ items, onAddToCart }: FoodMenuProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((item) => (
        <div key={item.id} className="bg-white rounded-lg shadow-md p-3 sm:p-4">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-32 sm:h-48 object-cover rounded-lg mb-3 sm:mb-4"
          />
          <div className="flex flex-col items-center gap-1 mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-center line-clamp-2">{item.name}</h3>
            <span className="text-base sm:text-lg font-bold text-[#B2151B]">{formatPrice(item.price)}</span>
          </div>
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <span className="text-gray-500 text-xs sm:text-sm">{item.category.name}</span>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2 text-center">{item.description}</p>
          <button
            onClick={() => onAddToCart(item)}
            disabled={!item.isAvailable}
            className={`w-full py-1.5 sm:py-2 rounded-lg text-sm sm:text-base ${
              item.isAvailable
                ? 'bg-[#B2151B] text-white hover:bg-[#8B0000]'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {item.isAvailable ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      ))}
    </div>
  );
} 