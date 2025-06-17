import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Rider {
  id: string;
  name: string;
  isActive: boolean;
}

interface RiderAssignmentModalProps {
  show: boolean;
  onHide: () => void;
  riders: Rider[];
  onAssign: (riderId: string) => void;
  isLoading: boolean;
}

export function RiderAssignmentModal({
  show,
  onHide,
  riders,
  onAssign,
  isLoading
}: RiderAssignmentModalProps) {
  return (
    <Dialog open={show} onOpenChange={onHide}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Rider to Order</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {riders.length === 0 ? (
            <p className="text-center text-muted-foreground">No active riders available</p>
          ) : (
            <div className="space-y-2">
              {riders.map((rider) => (
                <button
                  key={rider.id}
                  onClick={() => onAssign(rider.id)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent disabled:opacity-50"
                >
                  <span>{rider.name}</span>
                  {rider.isActive && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center mt-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onHide} disabled={isLoading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 