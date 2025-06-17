import { useState, useEffect } from 'react';
import { withRoleGuard } from '@/components/auth/with-role-guard';
import RiderLayout from '@/components/rider-layout';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';
import { riderService } from '@/services/riders';

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

function LocationPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Geolocation is not supported by your browser",
      });
      setLoading(false);
      return;
    }

    // Get initial location
    getCurrentLocation();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const getCurrentLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setLocation(newLocation);
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: getGeolocationErrorMessage(error.code),
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const startTracking = () => {
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setLocation(newLocation);
      },
      (error) => {
        console.error('Error tracking location:', error);
        toast({
          variant: "destructive",
          title: "Tracking Error",
          description: getGeolocationErrorMessage(error.code),
        });
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
    setWatchId(id);
    setIsTracking(true);
  };

  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };


  const getGeolocationErrorMessage = (code: number): string => {
    switch (code) {
      case 1:
        return "Location access was denied. Please enable location services.";
      case 2:
        return "Unable to determine your location. Please try again.";
      case 3:
        return "Location request timed out. Please try again.";
      default:
        return "An unknown error occurred while getting your location.";
    }
  };

  const formatCoordinate = (coord: number): string => {
    return coord.toFixed(6);
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
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
        <h1 className="text-2xl font-semibold">Location Management</h1>
        <p className="text-gray-600 mt-1">View and manage your location settings</p>
      </div>

      <div className="grid gap-6">
        {/* Current Location Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-gray-400" />
              <h2 className="text-lg font-semibold">Current Location</h2>
            </div>
            <Button 
              variant="outline" 
              onClick={getCurrentLocation}
              disabled={isTracking}
            >
              Refresh
            </Button>
          </div>

          {location ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Latitude</p>
                  <p className="text-lg font-medium">{formatCoordinate(location.latitude)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Longitude</p>
                  <p className="text-lg font-medium">{formatCoordinate(location.longitude)}</p>
                </div>
              </div>
              
              {location.accuracy && (
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-lg font-medium">{Math.round(location.accuracy)} meters</p>
                </div>
              )}
              
              {location.timestamp && (
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-medium">{formatTimestamp(location.timestamp)}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Unable to get location information</p>
          )}
        </Card>

        {/* Location Tracking Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-1">Live Location Tracking</h2>
              <p className="text-sm text-gray-600">
                Keep your location updated in real-time
              </p>
            </div>
            <Switch
              checked={isTracking}
              onCheckedChange={(checked) => {
                if (checked) {
                  startTracking();
                } else {
                  stopTracking();
                }
              }}
            />
          </div>
        </Card>

        {/* Location Settings Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Location Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">High Accuracy Mode</p>
                <p className="text-sm text-gray-600">
                  Use GPS for more accurate location data
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Background Tracking</p>
                <p className="text-sm text-gray-600">
                  Continue tracking when app is in background
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>
      </div>
    </RiderLayout>
  );
}

// Protect this route to allow only users with the 'rider' role
export default withRoleGuard(LocationPage, 'rider', '/'); 