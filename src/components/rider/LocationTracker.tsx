import { useEffect, useRef } from 'react';
import { apiService } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

export const LocationTracker = () => {
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Geolocation is not supported by your browser",
      });
      return;
    }

    // Start watching position
    const startWatching = () => {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            await apiService.updateRiderLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          } catch (error) {
            console.error('Error updating location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Failed to get your location. Please enable location services.",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    };

    startWatching();

    // Cleanup function
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // This is a headless component, so it doesn't render anything
  return null;
}; 