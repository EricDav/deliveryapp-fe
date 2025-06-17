import { useState, useEffect } from 'react';
import { withRoleGuard } from '@/components/auth/with-role-guard';
import RiderLayout from '@/components/rider-layout';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Camera } from 'lucide-react';
import { apiService } from '@/services/api';
import { getAuthToken } from '@/utils/auth';

interface RiderSettings {
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  licenseNumber: string;
  notificationSettings: {
    orderAlerts: boolean;
    locationTracking: boolean;
    emailNotifications: boolean;
  };
  imageUrl?: string;
}

function RiderSettings() {
  const [settings, setSettings] = useState<RiderSettings>({
    name: '',
    email: '',
    phone: '',
    vehicleType: '',
    licenseNumber: '',
    notificationSettings: {
      orderAlerts: true,
      locationTracking: true,
      emailNotifications: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const isAuthenticated = () => {
    const token = getAuthToken();
    return !!token;
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please log in to view your settings",
        });
        return;
      }

      // Get the user ID from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User ID not found",
        });
        return;
      }

      // Use the /v1/users/{id} endpoint
      const response = await apiService.getUserById(userId);
      if (response.success && response.data) {
        // Store the user data in localStorage for other pages
        localStorage.setItem('userId', response.data.id);
        localStorage.setItem('userData', JSON.stringify({
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          role: response.data.role,
          imageUrl: response.data.imageUrl
        }));

        setSettings({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          vehicleType: response.data.riderData?.vehicleType || '',
          licenseNumber: response.data.riderData?.licenseNumber || '',
          notificationSettings: {
            orderAlerts: response.data.notificationSettings?.orderAlerts ?? true,
            locationTracking: response.data.notificationSettings?.locationTracking ?? true,
            emailNotifications: response.data.notificationSettings?.emailNotifications ?? true
          },
          imageUrl: response.data.imageUrl
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!isAuthenticated()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please log in to update your settings",
        });
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User ID not found",
        });
        return;
      }

      setSaving(true);
      // Use the /v1/users/{id} endpoint
      await apiService.updateUserById(userId, {
        name: settings.name,
        phone: settings.phone,
        riderData: {
          vehicleType: settings.vehicleType,
          licenseNumber: settings.licenseNumber
        },
        notificationSettings: settings.notificationSettings
      });
      
      // Update stored user data
      const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
      localStorage.setItem('userData', JSON.stringify({
        ...storedUserData,
        name: settings.name,
        phone: settings.phone
      }));

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please log in to update your profile image",
      });
      return;
    }

    const riderId = localStorage.getItem('riderId');
    if (!riderId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User ID not found",
      });
      return;
    }

    try {
      const imageUrl = await apiService.uploadImage(file);
      setSettings(prev => ({ ...prev, imageUrl }));
      
      // Update user profile with new image using actual rider ID
      await apiService.updateUserDetails(riderId, { imageUrl });
      
      // Update stored rider data
      const storedRiderData = JSON.parse(localStorage.getItem('riderData') || '{}');
      localStorage.setItem('riderData', JSON.stringify({
        ...storedRiderData,
        imageUrl
      }));

      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image",
      });
    }
  };

  // Add effect to check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please log in to view your settings",
      });
      // You might want to redirect to login page here
      return;
    }
    fetchSettings();
  }, []);

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
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-6">Profile</h1>
        
        <div className="grid gap-6">
          {/* Profile Section */}
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-6">Profile Information</h2>
            
            <div className="grid gap-6">
              <div className="flex items-start gap-8">
                <div className="relative flex-shrink-0">
                  <img
                    src={settings.imageUrl || "/placeholder.svg"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                  />
                  <label
                    htmlFor="image-upload"
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                  />
              </div>

                  <div className="grid grid-cols-2 gap-4">
                <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    disabled
                        className="mt-1 bg-gray-50"
                  />
                </div>
                
                <div>
                      <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                  />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Vehicle Information */}
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-6">Vehicle Information</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="vehicleType" className="text-sm font-medium">Vehicle Type</Label>
                <Input
                  id="vehicleType"
                  value={settings.vehicleType}
                  onChange={(e) => setSettings(prev => ({ ...prev, vehicleType: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="licenseNumber" className="text-sm font-medium">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={settings.licenseNumber}
                  onChange={(e) => setSettings(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-6">Notification Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Order Alerts</p>
                  <p className="text-sm text-gray-500">Receive notifications for new orders</p>
                </div>
                <Switch
                  checked={settings.notificationSettings.orderAlerts}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, orderAlerts: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Location Tracking</p>
                  <p className="text-sm text-gray-500">Allow location tracking while on duty</p>
                </div>
                <Switch
                  checked={settings.notificationSettings.locationTracking}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, locationTracking: checked }
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive updates via email</p>
                </div>
                <Switch
                  checked={settings.notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    notificationSettings: { ...prev.notificationSettings, emailNotifications: checked }
                  }))}
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-2 bg-[#B2151B] hover:bg-red-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </RiderLayout>
  );
}

export default withRoleGuard(RiderSettings, ['rider']); 