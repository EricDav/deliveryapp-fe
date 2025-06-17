'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/customer-layout';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { Order } from '@/services/api';
import { isAuthenticated } from '@/utils/auth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { RiderAssignment } from '@/components/rider-assignment';
import { 
  OrderStatusEnum, 
  getCustomerTimelineLabel, 
  getStatusesByRole,
  canRoleSeeStatus 
} from '@/types/orders';
import { useOrderStatus } from '@/hooks/useOrderStatus';

export default function OrderDetails() {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribeToOrderUpdates } = useWebSocket();
  const { visibleStatuses, getStatusLabel, isStatusCompleted } = useOrderStatus();

  // Debug current order state
  useEffect(() => {
    if (order) {
      console.log('Order state changed:', {
        id: order.id,
        status: order.status,
        time: new Date().toISOString()
      });
    }
  }, [order]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!router.query.id) return;
      
      try {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "Please log in to view order details",
          });
          // Redirect to login or handle as needed
          setError("Authentication required to view order details");
          setLoading(false);
          return;
        }

        // Fetch the order details with the external ID
        const order = await apiService.getOrder(router.query.id as string);
        setOrder(order);
      } catch (error) {
        console.error('Error fetching order:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch order');
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load order details. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady) {
      fetchOrder();
    }
  }, [router.isReady, router.query.id, toast]);

  useEffect(() => {
    if (!router.query.id) {
        console.log('No order ID available yet');
        return;
    }

    if (!order) {
        console.log('Order not loaded yet, waiting for order data');
        return;
    }

    console.log('Setting up WebSocket subscription:', {
        externalId: router.query.id,
        internalId: order.id,
        time: new Date().toISOString()
    });
    
    let unsubscribe: (() => void) | undefined;

    // Setup subscription
    const setupSubscription = async () => {
        try {
            // Use the internal ID for WebSocket subscription
            const internalId = order.id.toString();
            console.log('Initializing subscription for order:', {
                externalId: router.query.id,
                internalId: internalId
            });

            unsubscribe = await subscribeToOrderUpdates(internalId, (data) => {
                console.log('Order update callback received in component:', {
                    orderId: internalId,
                    rawData: data,
                    time: new Date().toISOString()
                });

                // Get the status update from either array or single object
                const statusUpdate = Array.isArray(data) ? data[0] : data;
                console.log('Processing status update in component:', statusUpdate);

                if (statusUpdate && statusUpdate.status) {
                    setOrder(prevOrder => {
                        if (!prevOrder) {
                            console.log('No previous order state found');
                            return prevOrder;
                        }
                        
                        console.log('Current order state before update:', {
                            orderId: internalId,
                            currentStatus: prevOrder.status,
                            newStatus: statusUpdate.status
                        });

                        const updatedOrder = {
                            ...prevOrder,
                            status: statusUpdate.status,
                            updatedAt: new Date().toISOString()
                        };

                        // Show a toast notification for the status update
                        toast({
                            title: "Order Status Updated",
                            description: `Order status changed to ${statusUpdate.status.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
                        });
                        
                        console.log('New order state after update:', updatedOrder);
                        return updatedOrder;
                    });
                } else {
                    console.warn('Invalid status update data:', statusUpdate);
                }
            });
        } catch (error) {
            console.error('Error setting up WebSocket subscription:', error);
        }
    };

    setupSubscription();

    // Cleanup
    return () => {
        if (unsubscribe) {
            console.log('Cleaning up WebSocket subscription for order:', {
                externalId: router.query.id,
                internalId: order.id
            });
            unsubscribe();
        }
    };
  }, [router.query.id, order, subscribeToOrderUpdates, toast]);

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

  // Timeline with icons and status - Define timeline first to calculate current status
  const customerStatuses = visibleStatuses;
  
  // Create timeline based on customer-visible statuses
  const timeline = customerStatuses.map(status => {
    let time = null;
    let icon = '';
    
    // Set time based on order status and progression
    if (status === OrderStatusEnum.RECEIVED) {
      time = order?.createdAt;
      icon = '🛒';
    } else if (status === OrderStatusEnum.CONFIRMED) {
      time = order?.status === status || isStatusCompleted(status, order?.status || '') ? order?.updatedAt : null;
      icon = '✅';
    } else if (status === OrderStatusEnum.READY) {
      time = order?.status === status || isStatusCompleted(status, order?.status || '') ? order?.updatedAt : null;
      icon = '🔥';
    } else if (status === OrderStatusEnum.IN_TRANSIT) {
      time = order?.status === status || isStatusCompleted(status, order?.status || '') ? order?.updatedAt : null;
      icon = '🛵';
    } else if (status === OrderStatusEnum.ARRIVED) {
      time = order?.status === status ? order?.updatedAt : null;
      icon = '📦';
    }
    
    return {
      status,
      label: getStatusLabel(status, true),
      time,
      icon
    };
  });
  
  const currentStatusIndex = timeline.findIndex(t => t.status === order?.status);
  const assignedRider = null; // No rider info available in Order type

  if (loading) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto py-8 px-5">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#B2151B]" />
            <h2 className="text-xl font-semibold">Loading Order Details...</h2>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !order) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto py-8 px-5">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Error Loading Order</h2>
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
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/customer/orders')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-[#B2151B] hover:text-[#B2151B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          {/* Order Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Order #{order.externalId}</h2>
              <p className="text-sm text-gray-500">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div key={order.status} className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(order.status)}`}>
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
          <div className="flex flex-col gap-2 mt-6">
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
              >
                View Receipt
              </a>
            )}
          </div>

          {/* Rider Assignment */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Rider Information</h3>
            {order.rider ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.rider.name}</p>
                    <p className="text-sm text-gray-500">{order.rider.phone}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    order.rider.status === 'available' ? 'bg-green-100 text-green-800' :
                    order.rider.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.rider.status.charAt(0).toUpperCase() + order.rider.status.slice(1)}
                  </div>
                </div>
                {order.rider.currentLocation && (
                  <div className="text-sm text-gray-500">
                    <p>Current Location:</p>
                    <p>Latitude: {order.rider.currentLocation.latitude}</p>
                    <p>Longitude: {order.rider.currentLocation.longitude}</p>
                  </div>
              )}
            </div>
            ) : (
              <div className="text-gray-500">
                <p className="mb-4">No rider assigned yet</p>
                {/* Only show rider assignment in admin/control panel */}
                {/* <RiderAssignment
                  orderId={order.id.toString()}
                  onRiderAssigned={() => {
                    // Refresh order data to get updated rider info
                    router.reload();
                  }}
                /> */}
              </div>
            )}
          </div>

          {/* Order Timeline */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
            <div className="bg-white rounded-xl shadow-md p-6 relative overflow-hidden">
              {/* Vertical progress bar - centered through the dots */}
              <div className="absolute left-[36px] top-8 bottom-8 w-1 bg-gray-200 rounded-full z-0">
                <div
                  className="bg-[#B2151B] rounded-full transition-all duration-500"
                  style={{
                    height: `${(currentStatusIndex + 1) / timeline.length * 100}%`,
                    transition: 'height 0.5s',
                  }}
                />
              </div>
              <ol className="relative z-10 space-y-6">
                {timeline.map((event, idx) => {
                  const isCompleted = idx < currentStatusIndex;
                  const isCurrent = idx === currentStatusIndex;
                  const isPending = idx > currentStatusIndex;
                  let dotColor = 'bg-gray-300';
                  if (isCompleted) dotColor = 'bg-[#B2151B]';
                  if (isCurrent) dotColor = 'bg-[#B2151B] animate-pulse';
                  return (
                    <li key={event.status} className="flex items-center relative">
                      {/* Status Dot & Icon - centered on the line */}
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full ${dotColor} border-2 border-white shadow transition-all duration-300 z-10 relative`}>
                        {event.icon}
                      </span>
                      <div className="ml-6 flex-1">
                        <span className={`block font-semibold text-base ${isCurrent ? 'text-[#B2151B]' : isCompleted ? 'text-[#B2151B]' : 'text-gray-400'} ${isCurrent ? 'font-bold' : ''}`}>{event.label}</span>
                        {event.time && (
                          <span className="block text-sm text-gray-500 mt-1">{formatDate(event.time)}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
} 