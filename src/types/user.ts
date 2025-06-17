export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  defaultAddress: string;
  notifications: {
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
    itemAvailability: boolean;
  };
}

export interface UserSettings {
  profile: UserProfile;
  theme: string;
  language: string;
} 

export interface UserLocation {
  id: string;
  userId: string;
  name?: string;
  address: string;
  country?: string;
  state?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}