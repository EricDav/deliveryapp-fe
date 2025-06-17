import { useState, useEffect } from 'react';
import { withRoleGuard } from '@/components/auth/with-role-guard';
import RiderLayout from '@/components/rider-layout';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Package, Star, TrendingUp } from 'lucide-react';
import { apiService } from '@/services/api';
import { riderService } from '@/services/riders';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatPrice } from '@/lib/utils';
import { getUserId } from '@/utils/auth';

interface DeliveryOrder {
  id: number;
  externalId: string;
  status: string;
  price: string;
  delivery: {
    name: string;
    phone: string;
    address: string;
  };
  items: Array<{
    id: number;
    product: {
      name: string;
    };
    portions: string;
  }>;
}

interface RiderStats {
  totalDeliveries: number;
  rating: number;
  earnings: number;
  completionRate: number;
}

function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [currentOrders, setCurrentOrders] = useState<DeliveryOrder[]>([]);
  const [stats, setStats] = useState<RiderStats>({
    totalDeliveries: 0,
    rating: 0,
    earnings: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { subscribeToOrderUpdates } = useWebSocket();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch current orders and stats
      const orders = await apiService.getOrders();
      setCurrentOrders(orders?.orders || []);

      // TODO: Implement stats endpoint
      // For now using mock data
      setStats({
        totalDeliveries: 150,
        rating: 4.8,
        earnings: 25000,
        completionRate: 98
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    try {
      // TODO: Implement status toggle endpoint
      setIsOnline(!isOnline);
      toast({
        title: isOnline ? "You're now offline" : "You're now online",
        description: isOnline ? "You won't receive new orders" : "You can now receive orders",
      });
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your status",
      });
    }
  };

  if (loading) {
    return (
      <RiderLayout>
        <div className="flex items-center justify-center h-[calc(100vh-2rem)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </RiderLayout>
    );
  }

  return (
    <RiderLayout>
      {/* Header with Status Toggle */}
      <div className="flex items-center justify-between p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold">Rider Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <Switch
            checked={isOnline}
            onCheckedChange={handleStatusToggle}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 p-4 md:p-6">
        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Deliveries</p>
              <p className="text-lg md:text-2xl font-semibold">{stats.totalDeliveries}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Rating</p>
              <p className="text-lg md:text-2xl font-semibold">{stats.rating.toFixed(1)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Total Earnings</p>
              <p className="text-lg md:text-2xl font-semibold">{formatPrice(stats.earnings)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-600">Completion Rate</p>
              <p className="text-lg md:text-2xl font-semibold">{stats.completionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Orders */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Orders</h2>
        <div className="space-y-4">
          {currentOrders.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              No active orders at the moment
            </Card>
          ) : (
            currentOrders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Order #{order.externalId}</h3>
                    <p className="text-sm text-gray-500">{order.items.length} items</p>
                  </div>
                  <Badge variant={order.status === 'assigned' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium">{order.delivery.name}</p>
                      <p className="text-sm text-gray-600">{order.delivery.address}</p>
                      <p className="text-sm text-gray-600">{order.delivery.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="font-semibold">{formatPrice(parseFloat(order.price))}</p>
                  <Button variant="default">View Details</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </RiderLayout>
  );
}

// Protect this route to allow only users with the 'rider' role
export default withRoleGuard(RiderDashboard, 'rider', '/'); 