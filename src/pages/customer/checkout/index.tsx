import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCart } from '../../../contexts/CartContext';
import CustomerLayout from '@/components/customer-layout';
import { SignupModal } from '@/components/auth/SignupModal';
import { isAuthenticated, getUserId } from '@/utils/auth';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import Stepper from '@/components/Stepper';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '@/services/api';

interface DeliveryAddress {
  name: string;
  phone: string;
  locationId: string;
  address: string;
  email: string;
}

interface PaymentMethod {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
}

interface OrderResponse {
  paymentUrl: string;
  order: {
    id: number;
    externalId: string;
    userId?: string;
    delivery?: {
      name: string;
      phone: string;
      locationId: string;
      address: string;
    };
    createdAt?: string;
    status?: string;
    type?: string;
    price?: string;
    shipingFee?: number;
    paystackReference?: string | null;
    receiptUrl?: string | null;
    riderId?: string | null;
    updatedAt?: string;
  };
}

interface UserDetails {
  name?: string;
  phone?: string;
  email?: string;
  state?: string;
  city?: string;
  address?: string;
}

interface UserLocation {
  id: string;
  isDefault: boolean;
  address?: string;
  state?: string;
  city?: string;
}

// Add interface for user data from backend
interface UserResponse {
  user: {
    id: string;
    name: string | null;
    role: string;
    email: string | null;
    phone: string | null;
    imageUrl: string | null;
    isActive: boolean;
    isUserVerified: boolean;
    isEmailVerified: boolean;
    country: string | null;
    state: string | null;
    address: string | null;
    token: string | null;
    tokenCreatedAt: string | null;
    latitude: number | null;
    longitude: number | null;
    riderData: any | null;
    createdAt: string;
    updatedAt: string;
    wallet: {
      id: number;
      balance: string;
      userId: string;
      uuid: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export default function Checkout() {
  const { toast } = useToast();
  const router = useRouter();
  const { items, total, subtotal, clearCart, isCartInitialized } = useCart();
  const [step, setStep] = useState<'delivery' | 'payment' | 'confirmation'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    name: '',
    phone: '',
    locationId: '',
    address: '',
    email: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
  });
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [externalOrderId, setExternalOrderId] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [orderComment, setOrderComment] = useState('');
  const [packFee, setPackFee] = useState(0);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(true);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);

  useEffect(() => {
    if (isCartInitialized && items.length === 0) {
      router.push('/customer/menu');
    }
    
    // Debug check for session storage - remove in production
    const debugSessionStorage = () => {
      const orderExternalId = sessionStorage.getItem('orderExternalId');
      const userEmail = sessionStorage.getItem('guestUserEmail');
    
    };
    
    // Call debug function
    debugSessionStorage();
    
    // If user is authenticated, fetch their information and locations
    const fetchUserData = async () => {
      if (isAuthenticated()) {
        try {
          // Get user ID
          const userId = await getUserId();
          if (userId) {
            // Fetch user details to get email and phone
            const userResponse = await apiService.getUserDetails(userId);
            const userData = userResponse.data.user;

            // Only update fields that are not null
            setDeliveryAddress(prev => ({
              ...prev,
              name: userData.name || prev.name,
              phone: userData.phone || prev.phone,
              email: userData.email || prev.email,
              address: userData.address || prev.address,
            }));
            
            // Fetch user's saved locations
            const locationsResponse = await apiService.getUserLocations();
            // Handle both response formats
            const locationsArray = Array.isArray(locationsResponse) ? locationsResponse : 
                                 locationsResponse?.locations || [];
            
            // Store all locations for selection
            setUserLocations(locationsArray);
            
            // Find default location or first location
            const defaultLoc = locationsArray.find(loc => loc.isDefault) || locationsArray[0];
            
            if (defaultLoc) {
              setDeliveryAddress(prev => ({
                ...prev,
                locationId: defaultLoc.id,
                // Only update these fields if they're not already set from user data
                address: prev.address || defaultLoc.address || '',
              }));
            } else {
              // If no saved locations, show the add new address form
              setShowAddNewAddress(true);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            variant: "default",
            title: "Note",
            description: "We'll use your previous delivery information. You can update it if needed.",
          });
        }
      }
    };

    fetchUserData();
    
    // Pack fee calculation
    let pack = 0;
    items.forEach(item => {
      if (item.categoryName && item.categoryName.toLowerCase().includes('protein')) {
        pack += 500 * item.quantity;
      } else if (item.quantity > 2) {
        pack += 500 * (item.quantity - 2);
      }
    });
    setPackFee(pack);

    // Add check for authentication on mount
    if (!isAuthenticated() && !router.query.guest) {
      router.replace('/customer/menu');
      toast({
        variant: "default",
        title: "Authentication Required",
        description: "Please log in or continue as guest to checkout.",
      });
    }
  }, [items, router, isCartInitialized]);

  // Handle location selection from saved locations
  const handleLocationSelect = (locationId: string) => {
    if (locationId === 'new') {
      setShowAddNewAddress(true);
      setDeliveryAddress(prev => ({
        ...prev,
        locationId: '',
        address: '',
      }));
    } else {
      const selectedLocation = userLocations.find(loc => loc.id === locationId);
      if (selectedLocation) {
        setShowAddNewAddress(false);
        setDeliveryAddress(prev => ({
          ...prev,
          locationId: selectedLocation.id,
          address: selectedLocation.address || '',
        }));
      }
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent guest checkout for authenticated users
    if (isAuthenticated() && router.query.guest) {
      router.replace('/customer/checkout');
      return;
    }

    // Validate form fields
    if (deliveryType === 'delivery' && (!deliveryAddress.name || !deliveryAddress.phone || !deliveryAddress.address)) {
      toast({ 
        variant: "default", 
        title: "Missing Information", 
        description: "Please fill in all required delivery fields." 
      });
      return;
    }
    if (!deliveryAddress.phone) {
      toast({ 
        variant: "default", 
        title: "Phone Required", 
        description: "Phone number is required for order updates." 
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const orderItems = items.map(item => ({
        productId: item.id,
        portions: item.quantity
      }));
      
      let response: OrderResponse;
      
      if (isAuthenticated()) {
        const orderData = {
          items: orderItems,
          delivery: deliveryType === 'delivery' ? {
            name: deliveryAddress.name,
            phone: deliveryAddress.phone,
            locationId: deliveryAddress.locationId || "",
            address: deliveryAddress.address
          } : null,
          deliveryType,
          orderComment
        };
        
        const apiResponse = await apiService.createOrder(orderData);
        if (!apiResponse.success || !apiResponse.data) {
          throw new Error(apiResponse.error || 'Failed to create order');
        }
        response = apiResponse.data;
      } else {
        // Validate guest checkout is allowed
        if (!router.query.guest) {
          toast({ 
            variant: "default", 
            title: "Authentication Required", 
            description: "Please log in or continue as guest to checkout." 
          });
          router.replace('/customer/menu');
          return;
        }

        // Additional validation for guest checkout
        if (!deliveryAddress.email) {
          toast({ 
            variant: "default", 
            title: "Email Required", 
            description: "Email is required for guest checkout." 
          });
          setIsSubmitting(false);
          return;
        }

        const guestOrderData = {
          items: orderItems,
          delivery: {
            name: deliveryAddress.name,
            phone: deliveryAddress.phone,
            email: deliveryAddress.email,
            locationId: deliveryAddress.locationId || "",
            address: deliveryAddress.address
          }
        };
        
        const apiResponse = await apiService.createGuestOrder(guestOrderData);
        if (!apiResponse.success || !apiResponse.data) {
          throw new Error(apiResponse.error || 'Failed to create guest order');
        }
        response = apiResponse.data;

        // Store email in storage for guest users to set password later
        console.log('Saving guest email to localStorage:', deliveryAddress.email);
        localStorage.setItem('guestUserEmail', deliveryAddress.email);
        sessionStorage.setItem('guestUserEmail', deliveryAddress.email);
      }
      
      // Store order details
      setPaymentUrl(response.paymentUrl);
      setOrderId(response.order.id);
      setExternalOrderId(response.order.externalId);
      
      // Store externalId for redirecting after payment
      if (response.order.externalId) {
        console.log('Storing order external ID in localStorage:', response.order.externalId);
        localStorage.setItem('orderExternalId', response.order.externalId);
        sessionStorage.setItem('orderExternalId', response.order.externalId);
      } else if (response.order.id) {
        console.log('Storing numeric order ID as fallback:', response.order.id);
        localStorage.setItem('orderExternalId', response.order.id.toString());
        sessionStorage.setItem('orderExternalId', response.order.id.toString());
      }
      
      // Show success toast
      toast({ 
        variant: "success", 
        title: "Order Created", 
        description: "Proceed to payment to complete your order." 
      });
      
      // Skip OTP verification and proceed directly to payment
      setStep('payment');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({ 
        variant: "default", 
        title: "Unable to Create Order", 
        description: error instanceof Error ? error.message : "Please check your information and try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      
      const orderId = sessionStorage.getItem('currentOrderId');
      if (!orderId) {
        throw new Error('Order ID not found. Please try again.');
      }

      
      
      await apiService.updateOrder(orderId, {
        status: 'confirmed',
        paymentMethod: {
          cardNumber: paymentMethod.cardNumber.slice(-4),
          name: paymentMethod.name
        }
      });

      
    setStep('confirmation');
      
      
      sessionStorage.removeItem('currentOrderId');

      
      toast({
        variant: "success",
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to process payment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrder = () => {
    processOrder();
  };

  const processOrder = async () => {
    setIsSubmitting(true);
    try {
      if (!orderId) {
        toast({ 
          variant: "default", 
          title: "Order Not Found", 
          description: "Please try placing your order again." 
        });
        return;
      }
      
      // Get the order details to access the externalId
      const orderResponse = await apiService.getOrder(orderId.toString());
      if (!orderResponse) {
        throw new Error('Order not found');
      }
      
      // Update the order status to completed/confirmed
      const updateResponse = await apiService.updateOrder(orderId.toString(), {
        status: 'confirmed'
      });

      if (!updateResponse.success) {
        throw new Error(updateResponse.error || 'Failed to update order status');
      }
      
      clearCart();
      toast({
        variant: "success",
        title: "Order Placed!",
        description: "Your order has been successfully placed.",
      });
      
      // Redirect directly to the order detail page using externalId
      if (orderResponse.externalId) {
        router.push(`/customer/orders/${orderResponse.externalId}`);
      } else {
        router.push(`/customer/orders?success=true&orderId=${orderId}`);
      }
    } catch (error) {
      console.error('Error finalizing order:', error);
      toast({
        variant: "default",
        title: "Order Processing Issue",
        description: error instanceof Error ? error.message : "We couldn't complete your order. Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ['Delivery', 'Payment', 'Confirmation'];

  const PaymentStep = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-semibold">Payment</h2>
          <p className="text-gray-500">
            You will be redirected to our secure payment gateway to complete your purchase.
          </p>

          {paymentUrl ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                <p className="font-medium">Order created successfully!</p>
                <p className="text-sm">Order ID: {externalOrderId}</p>
                <p className="text-sm mt-2">After payment, you'll be taken to your order tracking page.</p>
              </div>
              
              <button
                onClick={() => window.location.href = paymentUrl}
                className="w-full py-3 bg-[#B2151B] text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
              </button>
              
              <p className="text-sm text-gray-500 text-center">
                You'll be redirected to our secure payment provider.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B2151B]" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const ConfirmationStep = () => {
    // Variable to store the external ID if available
    const [externalOrderId, setExternalOrderId] = useState<string | null>(null);
    const [showPostOrderOptions, setShowPostOrderOptions] = useState(false);
    
    // Effect to fetch order details if we only have the numeric ID
    useEffect(() => {
      const fetchOrderDetails = async () => {
        if (!orderId) return;
        
        try {
          const orderData = await apiService.getOrder(orderId.toString());
          if (orderData && orderData.externalId) {
            setExternalOrderId(orderData.externalId);
          }
        } catch (error) {
          console.error('Error fetching order details:', error);
          toast({
            variant: "default",
            title: "Error",
            description: "Could not fetch order details. Using fallback order ID.",
          });
        }
      };
      
      fetchOrderDetails();
    }, [orderId]);

    // Only show post-order options for guest users
    const isGuest = router.query.guest === 'true';
    
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Your order has been successfully placed and payment confirmed.
              You will receive an email confirmation shortly.
            </p>
            <div className="p-4 bg-gray-50 rounded-lg mb-6 text-left">
              <p className="font-medium">Order Summary</p>
              <p className="text-sm">Order ID: {orderId}</p>
              <p className="text-sm">Total Amount: {formatPrice(total + packFee)}</p>
            </div>

            {/* Show tracking options for guest users */}
            {isGuest && (
              <div className="space-y-4 mb-6 p-4 bg-orange-50 rounded-lg text-left">
                <h3 className="font-semibold text-[#B2151B]">Track Your Order</h3>
                <p className="text-sm text-gray-700">Choose how you'd like to track your order:</p>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowSignupModal(true)}
                    className="w-full py-2 px-4 bg-[#B2151B] text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Create an Account to Track Orders
                  </button>
                  <a
                    href="https://wa.me/your-whatsapp-number"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <span>Contact Support on WhatsApp</span>
                  </a>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Creating an account lets you track all your orders and enjoy member benefits.
                </p>
              </div>
            )}

            <Link href={externalOrderId ? `/customer/orders/${externalOrderId}` : `/customer/orders?success=true&orderId=${orderId}`} passHref>
              <button className="w-full py-3 bg-[#B2151B] text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
                View Order Status
              </button>
            </Link>
            <Link href="/customer/menu" passHref>
              <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors mt-4">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto p-4">
        <div className="mb-6">
          <Stepper currentStep={step} steps={steps} />
        </div>

        {/* Collapsible Order Summary at the top */}
        <div className="bg-white p-6 rounded-xl shadow mb-6">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setOrderSummaryOpen(v => !v)}>
            <h2 className="text-xl font-semibold mb-0">Order Summary</h2>
            {orderSummaryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          {orderSummaryOpen && (
            <div className="space-y-4 mt-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.quantity} x {item.name}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t pt-4 flex justify-between">
                <span className="font-medium">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Delivery Fee</span>
                <span>{formatPrice(packFee)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between font-bold">
                <span>Total</span>
                <span>{formatPrice(total + packFee)}</span>
              </div>
            </div>
          )}
        </div>

        {step === 'delivery' && (
          <form onSubmit={handleDeliverySubmit} className="space-y-8">
            {/* Order Type Selection */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-4">Order Type</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg ${deliveryType === 'delivery' ? 'bg-[#B2151B] text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setDeliveryType('delivery')}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 rounded-lg ${deliveryType === 'pickup' ? 'bg-[#B2151B] text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setDeliveryType('pickup')}
                >
                  Pickup
                </button>
              </div>
            </div>
            
            {/* Delivery Information */}
            {deliveryType === 'delivery' && (
              <div className="bg-white p-6 rounded-xl shadow space-y-4">
                <h2 className="text-xl font-semibold">Delivery Information</h2>
                
                {/* Name and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                    <input
                      type="text"
                      value={deliveryAddress.name}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, name: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      placeholder="Full Name"
                      required={deliveryType === 'delivery'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                    <input
                      type="tel"
                      value={deliveryAddress.phone}
                      onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      placeholder="Phone Number"
                      required
                    />
                  </div>
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input
                    type="email"
                    value={deliveryAddress.email}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, email: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                    placeholder="Email Address"
                    required={deliveryType === 'delivery'}
                  />
                </div>
                
                {/* Location Selector for authenticated users */}
                {isAuthenticated() && userLocations.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                    <select
                      value={showAddNewAddress ? 'new' : deliveryAddress.locationId}
                      onChange={(e) => handleLocationSelect(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 mb-4"
                    >
                      {userLocations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.address} {location.isDefault ? '(Default)' : ''}
                        </option>
                      ))}
                      <option value="new">+ Add New Address</option>
                    </select>
                  </div>
                )}
                
                {/* Address Input - Show if adding new address or no saved locations */}
                {(showAddNewAddress || !isAuthenticated() || userLocations.length === 0) && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {userLocations.length > 0 ? 'New Address*' : 'Address*'}
                    </label>
                  <input
                    type="text"
                    value={deliveryAddress.address}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, address: e.target.value})}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                      placeholder="Enter delivery address"
                    required={deliveryType === 'delivery'}
                  />
                </div>
                )}
                
                {/* Show selected address for saved locations */}
                {!showAddNewAddress && userLocations.length > 0 && deliveryAddress.locationId && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Delivering to:</p>
                    <p className="font-medium">{deliveryAddress.address}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Order Comment */}
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold mb-4">Additional Instructions</h2>
              <textarea
                value={orderComment}
                onChange={(e) => setOrderComment(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Special instructions for your order (optional)"
                rows={3}
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#B2151B] text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Continue to Payment'}
            </button>
          </form>
        )}

        {step === 'payment' && <PaymentStep />}

        {step === 'confirmation' && <ConfirmationStep />}
      </div>
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={() => {
          setShowSignupModal(false);
          toast({ variant: "success", title: "Signup Successful", description: "Please complete your delivery details." });
        }}
      />
    </CustomerLayout>
  );
} 