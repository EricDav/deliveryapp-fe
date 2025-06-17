import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/auth-layout';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { Order } from '@/services/api';
import { RiderAssignment } from '@/components/rider-assignment';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function AdminOrderDetails() {
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { subscribeToOrderUpdates } = useWebSocket();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!router.query.id) return;
      
      try {
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
    if (!router.query.id || !order) return;

    console.log('Setting up WebSocket subscription:', {
      orderId: order.id,
      time: new Date().toISOString()
    });
    
    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        unsubscribe = await subscribeToOrderUpdates(order.id.toString(), (data) => {
          const statusUpdate = Array.isArray(data) ? data[0] : data;
          
          if (statusUpdate && statusUpdate.status) {
            setOrder(prevOrder => {
              if (!prevOrder) return prevOrder;
              
              const updatedOrder = {
                ...prevOrder,
                status: statusUpdate.status,
                updatedAt: new Date().toISOString()
              };

              toast({
                title: "Order Status Updated",
                description: `Order status changed to ${statusUpdate.status.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
              });
              
              return updatedOrder;
            });
          }
        });
      } catch (error) {
        console.error('Error setting up WebSocket subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        console.log('Cleaning up WebSocket subscription for order:', order.id);
        unsubscribe();
      }
    };
  }, [router.query.id, order, subscribeToOrderUpdates, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-blue-100 text-blue-800',
      'on-the-way': 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto py-8 px-5">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold">Loading Order Details...</h2>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto py-8 px-5">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Error Loading Order</h2>
            <p className="text-gray-600 mt-2">{error}</p>
            <button
              onClick={() => router.reload()}
              className="mt-4 text-blue-600 hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto py-8 px-5">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/admin/orders')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
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

          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {order.delivery.name}</p>
              <p><span className="font-medium">Phone:</span> {order.delivery.phone}</p>
              <p><span className="font-medium">Address:</span> {order.delivery.address}</p>
              {order.delivery.city && <p><span className="font-medium">City:</span> {order.delivery.city}</p>}
              {order.delivery.state && <p><span className="font-medium">State:</span> {order.delivery.state}</p>}
            </div>
          </div>

          {/* Rider Assignment */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Rider Assignment</h3>
            {order.rider ? (
              <div className="space-y-4">
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
                <div className="mt-4">
                  <RiderAssignment
                    orderId={order.id.toString()}
                    currentRiderId={order.rider.id}
                    onRiderAssigned={() => router.reload()}
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-4">No rider assigned</p>
                <RiderAssignment
                  orderId={order.id.toString()}
                  onRiderAssigned={() => router.reload()}
                />
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t mt-6 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount</span>
              <span className="text-lg font-bold">{formatPrice(parseFloat(order.price))}</span>
            </div>
            {order.shipingFee && order.shipingFee > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-500 mt-2">
                <span>Shipping Fee</span>
                <span>{formatPrice(order.shipingFee)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 