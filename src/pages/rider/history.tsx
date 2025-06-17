import { useState, useEffect } from 'react';
import { withRoleGuard } from '@/components/auth/with-role-guard';
import RiderLayout from '@/components/rider-layout';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { formatPrice } from '@/lib/utils';

interface DeliveryHistory {
  id: number;
  externalId: string;
  status: string;
  price: string;
  createdAt: string;
  delivery: {
    name: string;
    phone: string;
    address: string;
  };
}

function RiderHistory() {
  const [deliveries, setDeliveries] = useState<DeliveryHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeliveryHistory();
  }, []);

  const fetchDeliveryHistory = async () => {
    try {
      setLoading(true);
      // Get the stored user ID
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Get the rider's details
      const currentUser = await apiService.getUserDetails(userId);
      
      // Then fetch completed orders for this rider
      const response = await apiService.getOrders({ 
        status: 'delivered',
        userId: userId, // Use the stored user ID
        pageSize: 50
      });
      setDeliveries(response?.orders || []);
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load delivery history",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className="p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Delivery History</h1>
        
        <div className="grid gap-3 md:gap-4">
          {deliveries.length === 0 ? (
            <Card className="p-4 md:p-6 text-center text-gray-500">
              No delivery history found
            </Card>
          ) : (
            deliveries.map((delivery) => (
              <Card key={delivery.id} className="p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-4">
                  <div>
                    <div className="flex items-center justify-between md:justify-start gap-2 mb-2">
                      <p className="font-medium">Order #{delivery.externalId}</p>
                      <Badge variant="outline" className="md:hidden">
                        {delivery.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(delivery.createdAt)}
                    </p>
                    <p className="text-sm mt-2 font-medium">
                      {delivery.delivery.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {delivery.delivery.phone}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 break-words">
                      {delivery.delivery.address}
                    </p>
                  </div>
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                    <Badge variant="outline" className="hidden md:inline-flex">
                      {delivery.status}
                    </Badge>
                    <p className="font-medium order-first md:order-last">
                      {formatPrice(parseFloat(delivery.price))}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </RiderLayout>
  );
}

export default withRoleGuard(RiderHistory, ['rider']); 