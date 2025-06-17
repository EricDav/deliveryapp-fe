import { useState, useEffect } from 'react';
import { withRoleGuard } from '@/components/auth/with-role-guard';
import RiderLayout from '@/components/rider-layout';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Package } from 'lucide-react';
import { apiService } from '@/services/api';
import { riderService } from '@/services/riders';
import { formatPrice } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const statusOptions = [
  { value: 'picked-up', label: 'Picked Up' },
  { value: 'on-the-way', label: 'On The Way' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'delivered', label: 'Delivered' }
];

function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      // Get the stored user ID
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Get the rider's details
      const currentUser = await apiService.getUserDetails(userId);
      
      // Then fetch orders for this rider
      const response = await apiService.getOrders({ 
        status: 'assigned,picked-up,on-the-way',
        userId: userId // Use the stored user ID
      });
      setDeliveries(response?.orders || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load deliveries",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      setUpdatingStatus(orderId);
      await riderService.updateOrderRiderStatus(orderId.toString(), status);
      
      // Update local state
      setDeliveries(prevDeliveries => 
        prevDeliveries.map(delivery => 
          delivery.id === orderId 
            ? { ...delivery, status } 
            : delivery
        )
      );

      toast({
        title: "Status Updated",
        description: `Order status updated to ${status}`,
      });

      // If order is delivered, remove it from the list after a delay
      if (status === 'delivered') {
        setTimeout(() => {
          setDeliveries(prevDeliveries => 
            prevDeliveries.filter(delivery => delivery.id !== orderId)
          );
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'assigned': 'bg-blue-100 text-blue-800',
      'picked-up': 'bg-yellow-100 text-yellow-800',
      'on-the-way': 'bg-purple-100 text-purple-800',
      'arrived': 'bg-indigo-100 text-indigo-800',
      'delivered': 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Current Deliveries</h1>
        <p className="text-gray-600 mt-1">Manage your ongoing deliveries</p>
      </div>

      <div className="space-y-6">
        {deliveries.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No active deliveries at the moment</p>
          </Card>
        ) : (
          deliveries.map((delivery) => (
            <Card key={delivery.id} className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold">Order #{delivery.externalId}</h3>
                  <p className="text-sm text-gray-500">{delivery.items.length} items</p>
                </div>
                <Badge className={getStatusBadgeColor(delivery.status)}>
                  {delivery.status.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </Badge>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="font-medium">{delivery.delivery.name}</p>
                    <p className="text-gray-600">{delivery.delivery.address}</p>
                    <p className="text-gray-600">{delivery.delivery.phone}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Order Items:</p>
                  <ul className="space-y-1">
                    {delivery.items.map((item) => (
                      <li key={item.id} className="text-sm">
                        {item.portions}x {item.product.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-xl font-semibold">{formatPrice(parseFloat(delivery.price))}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Select
                    value={delivery.status}
                    onValueChange={(value) => handleStatusUpdate(delivery.id, value)}
                    disabled={updatingStatus === delivery.id}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          disabled={
                            statusOptions.findIndex(o => o.value === option.value) <=
                            statusOptions.findIndex(o => o.value === delivery.status)
                          }
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline">
                    View Map
                  </Button>
                </div>
              </div>

              {updatingStatus === delivery.id && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </RiderLayout>
  );
}

// Protect this route to allow only users with the 'rider' role
export default withRoleGuard(DeliveriesPage, 'rider', '/'); 