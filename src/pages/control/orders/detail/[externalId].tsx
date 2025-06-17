import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ControlLayout from '@/components/control-layout';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { formatPrice } from '@/lib/utils';
import { OrderStatusEnum, getStatusDetails, getAllOrderStatuses } from '@/types/orders';
import { withRoleGuard } from '@/components/auth/with-role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const OrderDetailPage = () => {
  const router = useRouter();
  const { externalId } = router.query;
  const { toast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Get all valid order statuses from the enum
  const orderStatuses = getAllOrderStatuses();

  useEffect(() => {
    if (externalId) {
      fetchOrder();
    }
  }, [externalId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const orderData = await apiService.getOrder(externalId as string);
      if (orderData) {
        setOrder(orderData);
        setSelectedStatus(orderData.status);
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order details';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!order || !selectedStatus) return;
    
    try {
      await apiService.updateOrder(order.externalId, { status: selectedStatus });
      
      // Refresh order data
      await fetchOrder();
      
      toast({
        title: "Status Updated",
        description: `Order ${order.externalId} status changed to ${getStatusDetails(selectedStatus).label}`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update order status',
      });
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusBadgeStyle = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      preparing: "bg-blue-100 text-blue-800", 
      ready: "bg-purple-100 text-purple-800",
      "on-the-way": "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
      scheduled: "bg-orange-100 text-orange-800"
    };
    
    return statusStyles[status] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <ControlLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ControlLayout>
    );
  }

  if (error) {
    return (
      <ControlLayout>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </ControlLayout>
    );
  }

  if (!order) {
    return (
      <ControlLayout>
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">Order not found</p>
        </div>
      </ControlLayout>
    );
  }

  return (
    <ControlLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Order #{order.externalId}</h1>
          <Button variant="outline" onClick={() => router.back()}>Back to Orders</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Details Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Order Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">#{order.externalId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Internal ID</p>
                <p className="font-medium">#{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date Placed</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusBadgeStyle(order.status)}>
                  {getStatusDetails(order.status).label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium">{formatPrice(parseFloat(order.price))}</p>
              </div>
              {order.shipingFee > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Shipping Fee</p>
                  <p className="font-medium">{formatPrice(order.shipingFee)}</p>
                </div>
              )}
              {order.paystackReference && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Payment Reference</p>
                  <p className="font-medium">{order.paystackReference}</p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Update Status</h3>
              <div className="flex space-x-4">
                <select 
                  className="flex-1 border rounded-md px-3 py-2"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {orderStatuses.map(status => (
                    <option key={status} value={status}>
                      {getStatusDetails(status).label}
                    </option>
                  ))}
                </select>
                <Button 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={updateOrderStatus}
                  disabled={selectedStatus === order.status}
                >
                  Update
                </Button>
              </div>
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Customer Information</h2>
            {order.delivery ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{order.delivery.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{order.delivery.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{order.delivery.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium">{order.delivery.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">State</p>
                  <p className="font-medium">{order.delivery.state || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Guest order - No delivery information available</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-lg font-semibold p-6 border-b">Order Items</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item: any) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {item.product.imageUrl && (
                        <div className="flex-shrink-0 h-10 w-10 mr-4">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={item.product.imageUrl} 
                            alt={item.product.name} 
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                        {item.product.description && (
                          <div className="text-sm text-gray-500">{item.product.description.substring(0, 50)}...</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {parseInt(item.portions)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(item.product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(item.product.price * parseInt(item.portions))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-medium">Subtotal:</td>
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {formatPrice(order.items.reduce((acc: number, item: any) => 
                    acc + (item.product.price * parseInt(item.portions)), 0
                  ))}
                </td>
              </tr>
              {order.shipingFee > 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium">Shipping Fee:</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{formatPrice(order.shipingFee)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right text-lg font-medium">Total:</td>
                <td className="px-6 py-4 text-gray-900 font-bold">{formatPrice(parseFloat(order.price))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </ControlLayout>
  );
};

// Protect this route to allow only users with the 'csr' role
export default withRoleGuard(OrderDetailPage, 'csr', '/'); 