'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/customer-layout';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import type { Order } from '@/services/api';
import { isAuthenticated } from '@/utils/auth';
import { PostPaymentModal } from '@/components/post-payment-modal';

export default function Orders() {
  const router = useRouter();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPostPaymentModal, setShowPostPaymentModal] = useState(false);
  const [orderAfterPayment, setOrderAfterPayment] = useState<{ id: string, email: string } | null>(null);
  const [processedReference, setProcessedReference] = useState<string | null>(null);
  const ORDERS_PER_PAGE = 5;
  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
  const paginatedOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

  useEffect(() => {
    const verifyPaystackPayment = async (reference: string) => {
      setIsVerifyingPayment(true);
      try {
        // Call the API to verify the payment
        const response = await apiService.verifyPayment(reference);
        
        // Clear reference from URL immediately after verification to prevent infinite calls
        if (router.query.reference) {
          // Replace current URL with one without the reference parameter
          const currentPath = router.pathname;
          const queryParams = { ...router.query };
          delete queryParams.reference;
          
          // Use shallow routing to update URL without triggering a full page refresh
          router.replace(
            {
              pathname: currentPath,
              query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
            },
            undefined,
            { shallow: true }
          );
        }
        
        // Show success message
        toast({
          variant: "success",
          title: "Payment Verified",
          description: "Your payment has been confirmed successfully.",
        });

        // Clear the cart after successful payment
        clearCart();

        // Try multiple storage options for maximum reliability
        // First check localStorage (preferred for cross-domain redirects)
        let orderExternalId = localStorage.getItem('orderExternalId');
        if (!orderExternalId) {
          // Fall back to sessionStorage if not in localStorage
          orderExternalId = sessionStorage.getItem('orderExternalId');
        }
        
        // Similarly for email
        let userEmail = localStorage.getItem('guestUserEmail');
        if (!userEmail) {
          userEmail = sessionStorage.getItem('guestUserEmail');
        }
        
        console.log("Payment verification successful with:", { 
          orderExternalId, 
          userEmail, 
          isAuthenticated: isAuthenticated(),
          responseOrderId: response?.orderId
        });
        
        // If we have the external order ID from storage, use it
        if (orderExternalId) {
          // Clear from both storage types to avoid future conflicts
          localStorage.removeItem('orderExternalId');
          sessionStorage.removeItem('orderExternalId');
          
          // For guest users with email, show post-payment modal
          if (!isAuthenticated() && userEmail) {
            console.log("Showing post-payment modal for", userEmail, "with order", orderExternalId);
            setOrderAfterPayment({
              id: orderExternalId,
              email: userEmail
            });
            setShowPostPaymentModal(true);
            setIsVerifyingPayment(false);
            return;
          } else if (!isAuthenticated()) {
            console.log("User not authenticated and no email available");
            toast({
              variant: "destructive",
              title: "Authentication Required",
              description: "Please log in to view your order details",
            });
          } else {
            console.log("User is authenticated, redirecting to order detail");
          }
          
          // For authenticated users, redirect to the order detail page
          if (isAuthenticated()) {
            router.replace(`/customer/orders/${orderExternalId}`);
          }
          return;
        }
        
        // FALLBACK: If storage failed but we have the order ID from the API response
        if (response?.orderId) {
          // For unauthenticated users with email, don't try to fetch order details
          // Just show the post-payment modal with the orderId directly
          if (!isAuthenticated() && userEmail) {
            console.log("Guest user detected - showing post-payment modal with orderId directly");
            setOrderAfterPayment({
              id: response.orderId.toString(),
              email: userEmail
            });
            setShowPostPaymentModal(true);
            console.log("Set showPostPaymentModal to true:", { showPostPaymentModal: true, orderAfterPayment: { id: response.orderId.toString(), email: userEmail } });
            setIsVerifyingPayment(false);
            return;
          } 
          
          // Only try to fetch order details for authenticated users
          else if (isAuthenticated()) {
            try {
              console.log("Authenticated user - fetching details for order ID:", response.orderId);
              // Get the order details to retrieve the external ID directly
              const orderDetails = await apiService.getOrder(response.orderId.toString());
              
              if (orderDetails?.externalId) {
                console.log("Retrieved external ID from API:", orderDetails.externalId);
                // For authenticated users, redirect to the order detail page
                router.replace(`/customer/orders/${orderDetails.externalId}`);
                return;
              }
            } catch (error) {
              console.error("Error fetching order details from API:", error);
            }
          }
        }

        // Last resort: If all else fails, show the orders list
        console.log("Fallback: Loading all orders");
        // Only try to fetch orders if the user is authenticated
        if (isAuthenticated()) {
          const ordersResponse = await apiService.getOrders();
          setOrders(ordersResponse?.orders || []);
        } else {
          console.log("User not authenticated, not fetching orders");
          setOrders([]);
        }

        // Clean up the URL
        if (isAuthenticated()) {
          router.replace('/customer/orders', undefined, { shallow: true });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to verify payment. Please contact support if your payment was deducted.",
        });
        // Load all orders if payment verification fails
        if (isAuthenticated()) {
          const response = await apiService.getOrders();
          setOrders(response?.orders || []);
        } else {
          console.log("User not authenticated, not fetching orders after verification error");
          setOrders([]);
        }
      } finally {
        setIsVerifyingPayment(false);
        setLoading(false);
      }
    };

    const fetchOrders = async () => {
      try {
        // If the user is not authenticated and there's no payment reference,
        // don't try to fetch orders (unless there's an orderId from a successful payment)
        if (!isAuthenticated() && !router.query.reference && !router.query.orderId) {
          console.log("User not authenticated and no payment reference found - not loading orders");
          setLoading(false);
          setOrders([]);
          return;
        }

        // Check if this is a Paystack redirect with reference parameter
        if (router.query.reference) {
          const reference = router.query.reference as string;
          
          // Check if we've already processed this reference
          if (processedReference === reference) {
            console.log(`Already processed reference ${reference}, skipping`);
            return;
          }
          
          console.log("Payment reference detected in URL, processing payment verification");
          
          // Mark this reference as processed to avoid duplicates
          setProcessedReference(reference);
          
          // Process the payment verification and return early
          await verifyPaystackPayment(reference);
          
          // Important: Return early to avoid fetching orders during verification
          return;
        }

        console.log("No payment reference detected, proceeding to fetch orders");
        
        // If orderId is provided in the URL and success flag is true, redirect to order detail page
        if (router.query.orderId && router.query.success === 'true') {
          try {
            if (isAuthenticated()) {
              // Only try to fetch the order details if the user is authenticated
              const order = await apiService.getOrder(router.query.orderId as string);
              // Redirect to the specific order detail page
              if (order?.externalId) {
              router.replace(`/customer/orders/${order.externalId}`);
              }
            } else {
              // For unauthenticated users, show an error
              setError("Authentication required to view order details");
              setLoading(false);
            }
            return;
          } catch (error) {
            console.error('Error fetching specific order:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch order details');
          }
        }
        
        // If orderId is provided in the URL (without success flag)
        else if (router.query.orderId) {
          try {
            if (isAuthenticated()) {
              // Only try to fetch the order details if the user is authenticated
              const order = await apiService.getOrder(router.query.orderId as string);
              if (order) {
              setOrders([order]);
              }
            } else {
              // For unauthenticated users, show an error message
              setError("Authentication required to view order details");
              setOrders([]);
            }
          } catch (error) {
            console.error('Error fetching specific order:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch order details');
            setOrders([]);
          }
        } else {
          // Otherwise fetch all orders
          if (isAuthenticated()) {
            const response = await apiService.getOrders();
            setOrders(response?.orders || []);
          } else {
            console.log("User not authenticated, not fetching orders");
            setOrders([]);
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch orders');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load orders. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchOrders();
    }
  }, [router.isReady, router.query, clearCart, toast, processedReference]);

  // Add a double-check effect to ensure modal shows up if we have the data
  useEffect(() => {
    if (orderAfterPayment && !showPostPaymentModal) {
      console.log("Found orderAfterPayment data but modal not showing - force showing:", orderAfterPayment);
      setShowPostPaymentModal(true);
    }
  }, [orderAfterPayment, showPostPaymentModal]);

  // Debug what's happening immediately after state updates
  useEffect(() => {
    console.log("Current state:", { 
      showPostPaymentModal, 
      orderAfterPayment, 
      isVerifyingPayment,
      hasReference: Boolean(router.query.reference)
    });
  }, [showPostPaymentModal, orderAfterPayment, isVerifyingPayment, router.query.reference]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'on-the-way':
        return 'bg-orange-100 text-orange-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  if (loading || isVerifyingPayment) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto py-8 px-5">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B2151B]" />
            <h2 className="text-xl font-semibold">
              {isVerifyingPayment ? "Verifying Payment..." : "Loading Orders..."}
            </h2>
            <p className="text-gray-600">
              {isVerifyingPayment 
                ? "Please wait while we confirm your payment..."
                : "Please wait while we load your orders..."}
            </p>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto py-8 px-5">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Error Loading Orders</h2>
            <p className="text-gray-600 mt-2">{error}</p>
            <button
              onClick={() => router.reload()}
              className="mt-4 text-[#B2151B] hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto py-8 px-5">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Orders</h1>

        {!isAuthenticated() && orders.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
            <p className="text-gray-600 mt-2">Please sign in to view your order history.</p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={() => router.push('/customer/menu')}
                className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Browse Menu
              </button>
              {/* You can add a sign-in button here if you have a sign-in page */}
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">No Orders Yet</h2>
            <p className="text-gray-600 mt-2">When you place an order, it will appear here.</p>
            <button
              onClick={() => router.push('/customer/menu')}
              className="mt-4 text-[#B2151B] hover:underline"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {paginatedOrders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-2xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => router.push(`/customer/orders/${order.externalId}`)}
              >
                {/* Order Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Order #{order.externalId}</h2>
                    <p className="text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-b border-gray-100 py-4 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 mb-4 last:mb-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-medium">{item.product.name}</h3>
                        <p className="text-gray-500">Quantity: {item.portions}</p>
                      </div>
                      <div className="text-gray-900 font-medium">
                        {formatPrice(parseFloat(item.price))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery</span>
                    <span className="text-right">{order.delivery.address}{order.delivery.city ? `, ${order.delivery.city}` : ''}{order.delivery.state ? `, ${order.delivery.state}` : ''}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold">
                    <span>Total Amount</span>
                    <span>{formatPrice(parseFloat(order.price))}</span>
                  </div>
                  {order.receiptUrl && (
                    <a
                      href={order.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#B2151B] hover:underline text-center mt-2"
                      onClick={(e) => e.stopPropagation()} // Prevent the parent div click from triggering
                    >
                      View Receipt
                    </a>
                  )}
                </div>
              </div>
            ))}
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-4 mt-8">
                <button
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="px-2 py-2 text-gray-700 font-medium">Page {currentPage} of {totalPages}</span>
                <button
                  className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-medium disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Post Payment Modal */}
      {!!(orderAfterPayment && (showPostPaymentModal || true)) && (
        <PostPaymentModal
          isOpen={true}
          onClose={() => {
            console.log("Modal close triggered");
            setShowPostPaymentModal(false);
            setOrderAfterPayment(null);
          }}
          orderExternalId={orderAfterPayment.id}
          email={orderAfterPayment.email}
          onSuccess={() => {
            console.log("Post-payment modal success callback triggered");
            // Clear the email from both storage types
            localStorage.removeItem('guestUserEmail');
            sessionStorage.removeItem('guestUserEmail');
            
            // Check if the ID is an externalId (contains letters) or a numeric orderId
            const isExternalId = /[a-zA-Z]/.test(orderAfterPayment.id);
            
            if (isExternalId) {
              // If it's an external ID, directly go to the order details page
              router.replace(`/customer/orders/${orderAfterPayment.id}`);
            } else {
              // If it's a numeric order ID, we need to use the query parameter approach
              router.replace(`/customer/orders?orderId=${orderAfterPayment.id}`);
            }
          }}
        />
      )}
      
      {/* Debug information for development */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="fixed bottom-0 left-0 bg-gray-800 text-white p-2 text-xs max-w-xs z-50 opacity-75">
          <div>Modal Visible: {showPostPaymentModal ? 'Yes' : 'No'}</div>
          <div>Order Data: {orderAfterPayment ? JSON.stringify(orderAfterPayment) : 'None'}</div>
          <button 
            onClick={() => {
              // For testing - simulate a successful payment and post-payment modal
              const testOrderId = "TEST123456";
              const testEmail = "test@example.com";
              
              console.log("Debug: Testing post-payment modal");
              setOrderAfterPayment({
                id: testOrderId,
                email: testEmail
              });
              setShowPostPaymentModal(true);
            }}
            className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Test Modal
          </button>
        </div>
      )}
    </CustomerLayout>
  );
} 