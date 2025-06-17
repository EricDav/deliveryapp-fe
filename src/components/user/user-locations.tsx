import React, { useState, useEffect } from 'react';
import { UserLocation } from '@/types/user';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, Home, Briefcase, Heart, Plus, Trash2, Check, X } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

const locationIcons = {
  home: <Home className="w-5 h-5" />,
  work: <Briefcase className="w-5 h-5" />,
  favorite: <Heart className="w-5 h-5" />,
  other: <MapPin className="w-5 h-5" />,
};

interface LocationFormData {
  name: string;
  address: string;
  isDefault: boolean;
}

// Define possible location response types
interface LocationsResponse {
  locations: UserLocation[];
}

export function UserLocations() {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<UserLocation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    address: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async (showMainLoading = true) => {
    if (showMainLoading) {
    setIsLoading(true);
    }
    try {
      const response = await apiService.getUserLocations();
      // Check if the response is an object with a locations property
      const userLocations = Array.isArray(response) 
        ? response 
        : (response as LocationsResponse).locations;
      
      if (!Array.isArray(userLocations)) {
        throw new Error('Invalid response format from API');
      }
      
      setLocations(userLocations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to load locations',
      });
    } finally {
      if (showMainLoading) {
      setIsLoading(false);
      }
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // If this is the first location, make it default
      if (locations.length === 0) {
        formData.isDefault = true;
      }
      
      const newLocation = await apiService.addUserLocation({
        name: formData.name || 'My Location', // Use a default name if empty
        address: formData.address,
        isDefault: formData.isDefault,
      });
      
      if (newLocation) {
        // 1. Add the new location to the list immediately
        setLocations([...locations, newLocation as UserLocation]);
        
        // 2. Reset form and close add mode
      setIsAddingLocation(false);
      resetForm();
      
        // 3. Show success message
      toast({
        variant: "success",
        title: "Success",
        description: "Location added successfully",
      });
        
        // 4. Refresh locations from API with loading spinner
        setIsRefreshing(true);
        try {
          await fetchLocations(false); // Don't show main loading during refresh
        } catch (refreshError) {
          // If refresh fails, we still have the location in the list
          console.warn('Failed to refresh locations after adding:', refreshError);
        } finally {
          setIsRefreshing(false);
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to add location',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    setIsDeleting(true);
    try {
      await apiService.deleteUserLocation(locationId);
      
      // Remove from local state immediately
      setLocations(locations.filter(loc => loc.id !== locationId));
      
      toast({
        variant: "success",
        title: "Success",
        description: "Location deleted successfully",
      });

      // Refresh locations from API
      setIsRefreshing(true);
      try {
        await fetchLocations(false); // Don't show main loading during refresh
      } catch (refreshError) {
        console.warn('Failed to refresh locations after deleting:', refreshError);
      } finally {
        setIsRefreshing(false);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete location',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setLocationToDelete(null);
    }
  };

  const handleConfirmDelete = () => {
    if (locationToDelete) {
      handleDeleteLocation(locationToDelete.id);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setLocationToDelete(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      isDefault: false,
    });
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading your saved locations...</div>;
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Saved Locations</h2>
        {!isAddingLocation && (
          <button
            onClick={() => setIsAddingLocation(true)}
            className="inline-flex items-center text-[#B2151B] hover:text-orange-600 font-medium"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add New Location
          </button>
        )}
      </div>

      {isAddingLocation ? (
        <form onSubmit={handleAddLocation} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4">Add New Location</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="E.g. My Home, Office, etc."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none"
              />
            </div>
            
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none"
                required
                placeholder="Enter your address here"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleInputChange}
                className="h-4 w-4 text-[#B2151B] rounded border-gray-300 focus:ring-[#B2151B]"
              />
              <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                Set as default address
              </label>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsAddingLocation(false);
                  resetForm();
                }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-4 h-4 inline mr-1" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-[#B2151B] text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (
                  <>
                    <Check className="w-4 h-4 inline mr-1" />
                    Save Location
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : locations.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No saved locations</h3>
          <p className="text-gray-500 mb-4">Save your favorite addresses for faster checkout</p>
          <button
            onClick={() => setIsAddingLocation(true)}
            className="px-4 py-2 bg-[#B2151B] text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add First Location
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Loading overlay during refresh */}
          {isRefreshing && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-xl">
              <div className="flex items-center gap-2 text-[#B2151B]">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#B2151B]"></div>
                <span className="text-sm font-medium">Refreshing locations...</span>
              </div>
            </div>
          )}
          
        <div className="space-y-3">
          {locations.map((location) => (
            <div 
              key={location.id} 
              className={`bg-white rounded-xl p-4 flex items-start border ${location.isDefault ? 'border-[#B2151B]' : 'border-gray-100'} shadow-sm`}
            >
          
              
              <div className="flex-grow">
                <div className="flex items-center">
                  <h3 className="font-medium">{location.name}</h3>
                  {location.isDefault && (
                    <span className="ml-2 text-xs bg-[#FEF0F1] text-[#B2151B] px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{location.address}</p>
              </div>
              
              <button 
                  onClick={() => {
                    setLocationToDelete(location);
                    setShowDeleteConfirm(true);
                  }}
                className="p-2 text-gray-400 hover:text-red-500"
                aria-label="Delete location"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && locationToDelete && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-sm w-full mx-4">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              
              <h2 className="text-lg font-semibold text-center mb-2">Delete Location</h2>
              <p className="text-gray-600 text-center mb-2">
                Are you sure you want to delete this location?
              </p>
              
              <div className="bg-gray-50 rounded-lg p-3 mb-6">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{locationToDelete.name}</p>
                    <p className="text-xs text-gray-500">{locationToDelete.address}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 text-center mb-6">
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
