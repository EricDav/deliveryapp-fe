import { useState, useEffect } from 'react';
import { useRouter } from "next/router";
import { DataTable } from "@/components/data-table";
import { DetailViewConfig, type ColumnDefinition } from "@/types/data-table";
import AdminLayout from "@/components/auth-layout";
import FilterBar, { DateRange } from '@/components/filter-bar'
import { toast } from "sonner"
import { apiService, OrderFilters } from '@/services/api';
import { Order } from '@/services/api';
import { formatPrice } from '@/lib/utils';

const OrderStatusPage = () => {
  const router = useRouter();
  const { status } = router.query; 
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    orderBy: 'asc',
    sortBy: 'createdAt',
    search: '',
    pageSize: 10,
    pageNumber: 1
  });

  const statusString = Array.isArray(status) ? status[0] : status;

  useEffect(() => {
    if (statusString) {
      // Map UI status names to API status values if needed
      const statusMap: Record<string, string> = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'cooking': 'preparing',
        'ready-for-delivery': 'ready',
        'on-the-way': 'on-the-way',
        'delivered': 'delivered',
        'refunded': 'refunded',
        'scheduled': 'scheduled',
        'all': ''
      };
      
      const apiStatus = statusMap[statusString] || statusString;
      setFilters(prev => ({...prev, status: apiStatus}));
    }
  }, [statusString]);
  
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
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const capitalizeFirstLetter = (word: any) => {
    if (!word) return '';
    return word.split('-').map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
  };

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

  const handleFilterChange = (newFilters:any) => {
    const updatedFilters: OrderFilters = {
      ...filters
    };
    
    // Map from UI filters to API filters
    if (newFilters.searchQuery) {
      updatedFilters.search = newFilters.searchQuery;
    }
    
    // Handle date range (need to convert to backend expected format)
    if (newFilters.dateRange?.from) {
      updatedFilters.dateFrom = newFilters.dateRange.from.toISOString();
    }
    
    if (newFilters.dateRange?.to) {
      updatedFilters.dateTo = newFilters.dateRange.to.toISOString();
    }
    
    // Handle customer type (map to userId if needed)
    if (newFilters.customerType && newFilters.customerType !== 'all') {
      // This is just an example - you'd need to map customer types to user IDs in a real app
      // updatedFilters.userId = mapCustomerTypeToUserId(newFilters.customerType);
    }
    
    // Process status if it's in the filters
    if (newFilters.status && newFilters.status !== 'all') {
      updatedFilters.status = newFilters.status;
    }
    
    setFilters(updatedFilters);
  };

  // Transform API orders to table format
  const transformedOrders = orders.map(order => ({
    id: order.id,
    orderId: `ORD-${order.id.toString().padStart(3, '0')}`,
    orderDate: formatDate(order.createdAt),
    customerInformation: order.delivery ? 
      `${order.delivery.name}, ${order.delivery.phone}, ${order.delivery.address}` : 
      'Guest Order',
    totalAmount: formatPrice(parseFloat(order.price)),
    orderStatus: capitalizeFirstLetter(order.status),
    items: order.items.map(item => ({
      name: item.product.name,
      quantity: parseInt(item.portions),
      price: formatPrice(item.product.price),
      subtotal: formatPrice(item.product.price * parseInt(item.portions))
    }))
  }));

  const orderColumns: ColumnDefinition[] = [
    {
      id: "id",
      header: "#",
      accessorKey: "id",
    },
    {
      id: "orderId",
      header: "Order Id",
      accessorKey: "orderId",
    },
    {
      id: "orderDate",
      header: "Order Date",
      accessorKey: "orderDate",
    },
    {
      id: "customerInformation",
      header: "Customer Information",
      accessorKey: "customerInformation",
    },
    {
      id: "totalAmount",
      header: "Total Amount",
      accessorKey: "totalAmount",
    },
    {
      id: "orderStatus",
      header: "Order Status",
      accessorKey: "orderStatus",
    },
  ];

  const ordersDetailConfig: DetailViewConfig = {
    enabled: true,
    title: (item: any) => `Order: ${item.orderId}`,
  };

  const handleEdit = async (item: any) => {
    try {
      const orderId = item.id.toString();
      await router.push(`/admin/orders/edit/${orderId}`);
    } catch (error) {
      toast.error('Failed to navigate to edit page');
    }
  };
  
  const handleDelete = (item: any) => {
    toast(`Cannot delete orders. Please update status instead.`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700"></div>
          <p className="ml-4">Loading orders...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <span className="text-2xl font-semibold mb-5">{capitalizeFirstLetter(statusString)} Orders</span>

      <div className="flex justify-between items-center my-8">
        <FilterBar
          initialFilters={filters}
          onFilterChange={handleFilterChange}
          showSearch={true}
          showDateRange={true}
          showCustomerType={true}
          showStatus={true}
          customerTypeOptions={[
            { value: 'all', label: 'All Types' },
            { value: 'premium', label: 'Premium Users' },
          ]}
        />
        <div className="flex items-center space-x-4">
          <select 
            className="px-3 py-2 border rounded-md"
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
          >
            <option value="createdAt">Sort by Date</option>
            <option value="status">Sort by Status</option>
            <option value="price">Sort by Price</option>
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
          <button 
            onClick={fetchOrders}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      ) : transformedOrders.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">No {statusString} orders found</p>
        </div>
      ) : (
        <div className="mt-10">
          <DataTable
            data={transformedOrders}
            columns={orderColumns}
            tableType="orders"
            detailView={ordersDetailConfig}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      )}
    </AdminLayout>
  );
};

export default OrderStatusPage;
