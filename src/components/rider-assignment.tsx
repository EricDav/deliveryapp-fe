import { useState, useEffect } from 'react';
import { Rider, riderService } from '@/services/riders';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface RiderAssignmentProps {
  orderId: string;
  currentRiderId?: string;
  onRiderAssigned?: () => void;
}

export function RiderAssignment({ orderId, currentRiderId, onRiderAssigned }: RiderAssignmentProps) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvailableRiders();
  }, []);

  useEffect(() => {
    if (currentRiderId) {
      setSelectedRider(currentRiderId);
    }
  }, [currentRiderId]);

  const fetchAvailableRiders = async () => {
    try {
      setLoading(true);
      const availableRiders = await riderService.getAvailableRiders();
      setRiders(availableRiders);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch available riders. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRider = async () => {
    if (!selectedRider) return;

    try {
      setAssigning(true);
      await riderService.assignRiderToOrder(orderId, selectedRider);
      
      toast({
        title: "Success",
        description: "Rider assigned successfully",
      });

      onRiderAssigned?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign rider. Please try again.",
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={selectedRider}
          onValueChange={setSelectedRider}
          disabled={assigning}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a rider" />
          </SelectTrigger>
          <SelectContent>
            {riders.map((rider) => (
              <SelectItem key={rider.id} value={rider.id}>
                {rider.name} - {rider.phone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          onClick={handleAssignRider}
          disabled={!selectedRider || assigning}
        >
          {assigning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning...
            </>
          ) : (
            'Assign Rider'
          )}
        </Button>
      </div>

      {riders.length === 0 && (
        <p className="text-sm text-gray-500">No available riders at the moment</p>
      )}
    </div>
  );
} 