import { useEffect, useState } from "react";
import ControlLayout from "@/components/control-layout";
import { apiService, OrderFilters } from "@/services/api";
import { toast } from "sonner";
import { Order } from "@/services/api";
import { formatPrice } from "@/lib/utils";
import { 
  OrderStatusEnum, 
  getStatusDetails, 
  getStatusesByRole, 
  getNextStatuses 
} from "@/types/orders";
import { withRoleGuard } from "@/components/auth/with-role-guard";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { RiderAssignmentModal } from "@/components/rider/RiderAssignmentModal";
import { getUserRole } from "@/utils/auth";

interface Rider {
  id: string;
  name: string;
  isActive: boolean;
}

const ControlOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeRiders, setActiveRiders] = useState<Rider[]>([]);
  const [isAssigningRider, setIsAssigningRider] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    orderBy: 'asc',
    sortBy: 'createdAt',
    search: '',
    pageSize: 10,
    pageNumber: 1
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  
  // Get all valid order statuses for CSR role
  const userRole = getUserRole() || 'csr';
  const orderStatuses = getStatusesByRole(userRole);

  useEffect(() => {
    fetchOrders();
    fetchStatusCounts();
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
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    setIsLoadingCounts(true);
    try {
      const counts = await apiService.getOrderStatusCounts();
      setStatusCounts(counts || {});
    } catch (err) {
      console.error('Error fetching status counts:', err);
      // Don't show error toast for status counts as it's not critical
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const fetchActiveRiders = async () => {
    try {
      const riders = await apiService.getActiveRiders();
      console.log('Raw riders from API:', riders);
      
      // Ensure we have an array and filter to only include active riders
      const ridersArray = Array.isArray(riders) ? riders : [];
      const activeRiders = ridersArray.filter((rider: any) => rider.isActive === true);
      
      setActiveRiders(activeRiders);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Failed to fetch active riders');
    }
  };

  const handleRiderAssign = async (riderId: string) => {
    if (!selectedOrderId) return;
    
    setIsAssigningRider(true);
    try {
      await apiService.assignRiderToOrder(selectedOrderId, riderId);
      toast.success('Rider assigned successfully');
      setShowRiderModal(false);
      fetchOrders(); // Refresh orders list
    } catch (error) {
      toast.error('Failed to assign rider');
    } finally {
      setIsAssigningRider(false);
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
      if (newStatus === OrderStatusEnum.ASSIGNED_TO_RIDER) {
        // Fetch active riders before showing the modal
        await fetchActiveRiders();
        setSelectedOrderId(externalId);
        setShowRiderModal(true);
        return;
      }

      // Use the externalId instead of orderId for the update
      await apiService.updateOrder(externalId, { status: newStatus });
      
      // Refresh orders list
      fetchOrders();
      fetchStatusCounts();
      
      const statusDetails = getStatusDetails(newStatus);
      toast.success(`Order #${orderId} status changed to ${statusDetails.label}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order status');
    }
  };

  const getStatusBadgeStyle = (status: string): string => {
    const statusStyles: Record<string, string> = {
      [OrderStatusEnum.RECEIVED]: "bg-yellow-100 text-yellow-800",
      [OrderStatusEnum.CONFIRMED]: "bg-green-100 text-green-800",
      [OrderStatusEnum.PREPARING]: "bg-blue-100 text-blue-800", 
      [OrderStatusEnum.READY]: "bg-purple-100 text-purple-800",
      [OrderStatusEnum.ASSIGNED_TO_RIDER]: "bg-indigo-100 text-indigo-800",
      [OrderStatusEnum.IN_TRANSIT]: "bg-cyan-100 text-cyan-800",
      [OrderStatusEnum.ARRIVED]: "bg-green-100 text-green-800",
      [OrderStatusEnum.FAILED]: "bg-red-100 text-red-800",
    };
    
    return statusStyles[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <ControlLayout>
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
              onClick={() => {
                fetchOrders();
                fetchStatusCounts();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div 
            className={`flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow ${filters.status === '' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
          >
            <Badge className="bg-gray-100 text-gray-800">All Orders</Badge>
            <span className="mt-2 text-sm text-gray-500">
              {isLoadingCounts ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              ) : (
                `${Object.values(statusCounts).reduce((sum, count) => sum + count, 0)} orders`
              )}
            </span>
          </div>
          {orderStatuses.map(status => (
            <div 
              key={status} 
              className={`flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow ${filters.status === status ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => setFilters(prev => ({ ...prev, status }))}
            >
              <Badge className={getStatusBadgeStyle(status)}>
                {getStatusDetails(status).label}
              </Badge>
              <span className="mt-2 text-sm text-gray-500">
                {isLoadingCounts ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                ) : (
                  `${statusCounts[status] || 0} orders`
                )}
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
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/control/orders/detail/${order.externalId}`} className="text-blue-600 hover:underline">
                        #{order.externalId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.delivery ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.delivery.name}</div>
                          <div className="text-sm text-gray-500">{order.delivery.phone}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Guest Order</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrice(parseFloat(order.price))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(order.status)}`}>
                        {getStatusDetails(order.status).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <select
                          className="px-2 py-1 text-xs border rounded"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              updateOrderStatus(order.id, order.externalId, e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="" disabled>Change Status</option>
                          {getNextStatuses(order.status, userRole)
                            .map((status: string) => (
                              <option key={status} value={status}>
                                {getStatusDetails(status).label}
                              </option>
                            ))
                          }
                        </select>
                        <Link href={`/control/orders/detail/${order.externalId}`}>
                          <button className="text-indigo-600 hover:text-indigo-900 text-xs">
                            View
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <RiderAssignmentModal
          show={showRiderModal}
          onHide={() => setShowRiderModal(false)}
          riders={activeRiders}
          onAssign={handleRiderAssign}
          isLoading={isAssigningRider}
        />
      </div>
    </ControlLayout>
  );
};

// Protect this route to allow only users with the 'csr' role
export default withRoleGuard(ControlOrders, 'csr', '/'); 