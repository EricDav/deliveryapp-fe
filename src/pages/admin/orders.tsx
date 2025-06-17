import { useEffect, useState } from "react";
import AdminLayout from "@/components/auth-layout";
import { apiService, OrderFilters } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { Order } from "@/services/api";
import { formatPrice } from "@/lib/utils";
import { OrderStatusEnum, getStatusDetails, getAllOrderStatuses } from "@/types/orders";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    orderBy: 'asc',
    sortBy: 'createdAt',
    search: '',
    pageSize: 10,
    pageNumber: 1
  });
  
  // Get all valid order statuses from the enum
  const orderStatuses = getAllOrderStatuses();

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getOrders(filters);
      setOrders(response?.orders || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch orders';
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

  const updateOrderStatus = async (orderId: number, externalId: string, newStatus: string) => {
    try {
      // Use the externalId instead of orderId for the update
      await apiService.updateOrder(externalId, { status: newStatus });
      
      // Refresh orders list
      fetchOrders();
      
      const statusDetails = getStatusDetails(newStatus);
      toast({
        title: "Status Updated", 
        description: `Order #${orderId} status changed to ${statusDetails.label}`
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update order status',
      });
    }
  };

  // Get status badge styling
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

  // Get count of orders by status
  const getOrderCountByStatus = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Customer Orders</h1>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search orders..."
                className="px-3 py-2 border rounded-md"
                value={filters.search || ''}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
              <select 
                className="px-3 py-2 border rounded-md"
                value={filters.status || ''}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                {orderStatuses.map(status => (
                  <option key={status} value={status}>
                    {getStatusDetails(status).label}
                  </option>
                ))}
              </select>
              <select 
                className="px-3 py-2 border rounded-md"
                value={filters.sortBy || 'createdAt'}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              >
                <option value="createdAt">Date</option>
                <option value="status">Status</option>
                <option value="price">Price</option>
              </select>
              <select 
                className="px-3 py-2 border rounded-md"
                value={filters.orderBy || 'asc'}
                onChange={(e) => setFilters({...filters, orderBy: e.target.value})}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <select 
                className="px-3 py-2 border rounded-md"
                value={filters.pageSize || 10}
                onChange={(e) => setFilters({...filters, pageSize: parseInt(e.target.value)})}
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
            <button 
              onClick={() => fetchOrders()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div 
            className={`flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow ${filters.status === '' ? 'ring-2 ring-indigo-500' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
          >
            <Badge className="bg-gray-100 text-gray-800">All Orders</Badge>
            <span className="mt-2 text-sm text-gray-500">
              {orders.length} orders
            </span>
          </div>
          {orderStatuses.map(status => (
            <div 
              key={status} 
              className={`flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow ${filters.status === status ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, status }))}
            >
              <Badge className={getStatusBadgeStyle(status)}>
                {getStatusDetails(status).label}
              </Badge>
              <span className="mt-2 text-sm text-gray-500">
                {getOrderCountByStatus(status)} orders
              </span>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => {
                  const statusDetails = getStatusDetails(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link href={`/admin/orders/detail/${order.id}`} className="text-blue-600 hover:underline">
                          #{order.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.delivery?.name || 'Guest'}<br />
                        <span className="text-xs text-gray-400">{order.delivery?.phone || 'No phone'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(parseFloat(order.price))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(order.status)}`}>
                          {statusDetails.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select 
                          className="border rounded px-2 py-1 text-sm"
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, order.externalId, e.target.value)}
                        >
                          {orderStatuses.map(status => (
                            <option key={status} value={status}>
                              {getStatusDetails(status).label}
                            </option>
                          ))}
                        </select>
                        <Link href={`/admin/orders/detail/${order.externalId}`} className="ml-2 text-indigo-600 hover:text-indigo-900 text-xs">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
