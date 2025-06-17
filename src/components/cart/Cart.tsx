import { IconAdd, IconTrash } from '../icons/Icons';
import { useCart } from '../../contexts/CartContext';
import { Input } from '../ui/input';
import { formatPrice } from '@/lib/utils';

interface CartProps {
  onClose: () => void;
  onCheckout: () => void;
  isNavigating?: boolean;
}

export default function Cart({ onClose, onCheckout, isNavigating }: CartProps) {
  const { 
    items, 
    updateQuantity, 
    orderComment, 
    updateOrderComment, 
    subtotal, 
    tax, 
    total, 
    packPrice, 
    packCount,
    packPriceLoading, 
    packPriceError,
    deliveryFee,
    deliveryFeeLoading,
    deliveryFeeError,
    userLocation,
    locationError
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="fixed top-0 right-0 w-screen sm:w-[400px] h-full bg-white z-50 shadow-xl border-l border-[#e0e4e7] lg:translate-x-0">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#e0e4e7]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#2c3137]">My cart</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#f5f7f8] transition-colors"
          >
            <svg className="w-5 h-5 text-[#757d87]" fill="currentColor" viewBox="0 0 16 16">
              <path d="M2.97 2.97a.75.75 0 0 1 1.06 0L8 6.939l3.97-3.97a.75.75 0 1 1 1.06 1.061L9.061 8l3.97 3.97a.75.75 0 0 1 .072.976l-.073.084a.75.75 0 0 1-1.06 0L8 9.061l-3.97 3.97a.75.75 0 0 1-1.06-1.061L6.939 8l-3.97-3.97a.75.75 0 0 1-.072-.976l.073-.084Z" />
            </svg>
          </button>
        </div>
        
        <div className="cart-empty-state h-[60vh]">
          {/* Daash-style empty cart illustration */}
          <svg width="104" height="104" viewBox="0 0 104 104" fill="none" className="mb-6">
            <g clipPath="url(#clip0_3403_46514)">
              <path d="M93.0003 42.9078C91.029 43.5826 88.9577 43.9189 86.8742 43.9022C67.9747 43.9022 64.4159 35.9584 54.828 42.2582C45.24 48.558 31.2727 50.0368 29.6315 46.421C28.4576 43.8367 18.465 46.6319 12.8633 48.4384C12.9769 44.5759 13.63 40.7483 14.8037 37.0667C18.1189 29.7593 23.4675 23.5606 30.2106 19.2109C36.9537 14.8612 44.8063 12.5443 52.8306 12.537C71.8982 12.537 88.0368 25.3988 93.0003 42.9078Z" fill="#F99573"/>
              <path d="M49.816 104C77.2759 104 99.5366 81.7394 99.5366 54.2795C99.5366 26.8196 77.2759 4.55896 49.816 4.55896C22.3561 4.55896 0.095459 26.8196 0.095459 54.2795C0.095459 81.7394 22.3561 104 49.816 104Z" fill="#AEB7BF"/>
              <path d="M54.1842 99.4411C81.6441 99.4411 103.905 77.1805 103.905 49.7205C103.905 22.2606 81.6441 0 54.1842 0C26.7243 0 4.46362 22.2606 4.46362 49.7205C4.46362 77.1805 26.7243 99.4411 54.1842 99.4411Z" fill="white"/>
              <path d="M54.184 97.1616C80.385 97.1616 101.625 75.9215 101.625 49.7205C101.625 23.5195 80.385 2.27942 54.184 2.27942C27.983 2.27942 6.74292 23.5195 6.74292 49.7205C6.74292 75.9215 27.983 97.1616 54.184 97.1616Z" fill="#ECEFF1"/>
            </g>
            <defs>
              <clipPath id="clip0_3403_46514">
                <rect width="103.809" height="104" fill="white" transform="translate(0.095459)"/>
              </clipPath>
            </defs>
          </svg>
          
          <div className="text-center max-w-44 mx-auto">
            <h3 className="text-[#2c3137] text-base font-medium mb-1">Add items to your cart</h3>
            <p className="text-[#757d87] text-sm font-normal">Once you add item, your cart would appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 right-0 w-screen sm:w-[400px] h-full bg-white z-50 shadow-xl border-l border-[#e0e4e7] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#e0e4e7] flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-semibold text-[#2c3137]">My cart</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[#f5f7f8] transition-colors"
        >
          <svg className="w-5 h-5 text-[#757d87]" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.97 2.97a.75.75 0 0 1 1.06 0L8 6.939l3.97-3.97a.75.75 0 1 1 1.06 1.061L9.061 8l3.97 3.97a.75.75 0 0 1 .072.976l-.073.084a.75.75 0 0 1-1.06 0L8 9.061l-3.97 3.97a.75.75 0 0 1-1.06-1.061L6.939 8l-3.97-3.97a.75.75 0 0 1-.072-.976l.073-.084Z" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {/* Cart Items */}
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {items.map((item) => (
            <div key={item.id} className="daash-card p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                {/* Item Image */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#f5f7f8]">
                  <img
                    src={item.image || '/placeholder-food.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-food.jpg';
                    }}
                  />
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[#2c3137] font-medium text-xs sm:text-sm mb-1 line-clamp-2">{item.name}</h3>
                  <p className="text-[#121212] font-semibold text-xs sm:text-sm mb-2 sm:mb-3">{formatPrice(item.price)}</p>

                  {/* Availability check */}
                  {!item.isAvailable && (
                    <span className="text-red-500 text-xs">Currently unavailable</span>
                  )}

                  {/* Quantity controls */}
                  {item.isAvailable && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-[#e0e4e7] flex items-center justify-center text-[#757d87] hover:border-[#121212] hover:text-[#121212] transition-colors"
                      >
                        {item.quantity === 1 ? (
                          <IconTrash size={12} className="text-red-500" />
                        ) : (
                          <span className="text-xs sm:text-sm font-medium">−</span>
                        )}
                      </button>
                      <span className="w-6 sm:w-8 text-center font-medium text-[#2c3137] text-xs sm:text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-[#e0e4e7] flex items-center justify-center text-[#757d87] hover:border-[#121212] hover:text-[#121212] transition-colors"
                      >
                        <span className="text-xs sm:text-sm font-medium">+</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Comment */}
        <div className="mb-4 sm:mb-6">
          <label htmlFor="orderComment" className="block text-xs sm:text-sm font-medium text-[#2c3137] mb-2">
            Special Requests
          </label>
          <textarea
            id="orderComment"
            placeholder="Any special requests for your order?"
            value={orderComment}
            onChange={(e) => updateOrderComment(e.target.value)}
            className="daash-input min-h-[70px] sm:min-h-[80px] resize-none text-xs sm:text-sm"
            maxLength={250}
          />
          <div className="text-xs text-[#757d87] mt-1">
            {orderComment.length}/250 characters
          </div>
        </div>
      </div>

      {/* Fixed footer with summary and checkout */}
      <div className="border-t border-[#e0e4e7] p-3 sm:p-4 bg-white flex-shrink-0">
        {/* Price Summary */}
        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
          <div className="flex justify-between text-xs sm:text-sm text-[#757d87]">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
         
          <div className="flex justify-between text-xs sm:text-sm text-[#757d87]">
            <span>Packaging</span>
            <span className="flex items-center gap-1">
              {packPriceLoading ? (
                <>
                  <div className="w-3 h-3 border border-[#757d87] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Calculating...</span>
                </>
              ) : packPriceError ? (
                <span className="text-red-500 text-xs" title={packPriceError}>
                  +{formatPrice(packPrice)}*
                </span>
              ) : (
                <span>+{formatPrice(packPrice)}</span>
              )}
            </span>
          </div>
          
          <div className="flex justify-between text-xs sm:text-sm text-[#757d87]">
            <span>
              Delivery Fee
              {userLocation && (
                <div className="text-xs text-green-600">📍 Location-based</div>
              )}
            </span>
            <span className="flex items-center gap-1">
              {deliveryFeeLoading ? (
                <>
                  <div className="w-3 h-3 border border-[#757d87] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs">Loading...</span>
                </>
              ) : deliveryFeeError ? (
                <span className="text-red-500 text-xs" title={deliveryFeeError}>
                  +{formatPrice(deliveryFee)}*
                </span>
              ) : (
                <span>+{formatPrice(deliveryFee)}</span>
              )}
            </span>
          </div>
          
          <div className="border-t border-[#e0e4e7] pt-2 sm:pt-3">
            <div className="flex justify-between text-[#2c3137] font-semibold text-sm sm:text-base">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
        
        {/* Error messages */}
        {(packPriceError || deliveryFeeError || locationError) && (
          <div className="text-xs text-orange-600 mb-3 sm:mb-4 space-y-1">
            {packPriceError && <div>* Packaging price calculation failed</div>}
            {deliveryFeeError && <div>* Delivery fee calculation failed</div>}
            {locationError && <div>⚠️ Using default delivery pricing</div>}
          </div>
        )}
        
        {/* Checkout Button */}
        <button
          onClick={onCheckout}
          disabled={isNavigating || items.some(item => !item.isAvailable)}
          className="daash-button-primary w-full py-3 text-sm sm:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isNavigating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Processing...
            </span>
          ) : (
            `Proceed to Checkout • ${formatPrice(total)}`
          )}
        </button>
        
        {items.some(item => !item.isAvailable) && (
          <p className="text-xs text-red-500 text-center mt-2">
            Please remove unavailable items to continue
          </p>
        )}
      </div>
    </div>
  );
} 