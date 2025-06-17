import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { apiService } from '@/services/api';
import { saveAuthToken, saveUserId } from '@/utils/auth';
import { X, Loader2 } from 'lucide-react';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onLoginClick?: () => void;
  onGuestCheckout?: () => void;
}

export function SignupModal({ isOpen, onClose, onSuccess, onLoginClick, onGuestCheckout }: SignupModalProps) {
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    name: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let locationData = null;
    let addressData = null;
    
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        locationData = { latitude, longitude };
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          
          if (response.ok) {
            const data = await response.json();
            addressData = data.display_name;
          }
        } catch (geocodeError) {
          console.error('Error getting address:', geocodeError);
        }
      } catch (locationError) {
        console.error('Error getting location:', locationError);
      }
    }

    const signupData = { 
      ...formData,
      ...(addressData && { address: addressData })
    };
    
    const response = await apiService.signup(signupData);
    
    if (!response.success) {
      toast({
        variant: "default",
        title: "Signup Failed",
        description: response.error || "Unable to create account. Please try again.",
      });
      setLoading(false);
      return;
    }

    setStep('otp');
    toast({
      variant: "success",
      title: "Success",
      description: "OTP sent to your phone number",
    });
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await apiService.verifyOtp({ 
      phone: formData.phone,
      token: otp 
    });
    
    if (!response.success || !response.data) {
      toast({
        variant: "default",
        title: "Verification Failed",
        description: response.error || "Failed to verify OTP. Please try again.",
      });
      setLoading(false);
      return;
    }
    
    // Save token and user ID to cookies
    if (response.data.token) {
      saveAuthToken(response.data.token);
      if (response.data.user && response.data.user.id) {
        saveUserId(response.data.user.id);
      }
    }
    
    toast({
      variant: "success",
      title: "Success",
      description: "Account verified successfully",
    });
    onSuccess();
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 bg-white">
        <div className="p-6">
          <DialogHeader className="flex flex-row items-center justify-between pb-2">
            <DialogTitle className="text-2xl font-bold">
              {step === 'form' ? 'Create Account' : 'Verify OTP'}
            </DialogTitle>
            <DialogClose asChild>
              <button className="rounded-full hover:bg-gray-100 p-1">
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </DialogHeader>

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="number"
                  value={formData.phone}
                  maxLength={12}
                  placeholder='Enter your phone number'
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password (6 characters minimum)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#B2151B] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#B2151B] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>
          )}

          {step === 'form' && onLoginClick && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={onLoginClick}
                  className="text-[#B2151B] font-medium hover:underline"
                >
                  Login
                </button>
              </p>
            </div>
          )}

          {step === 'form' && onGuestCheckout && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Want to checkout as guest?{' '}
                <button 
                  type="button"
                  onClick={onGuestCheckout}
                  className="text-[#B2151B] font-medium hover:underline"
                >
                  Continue as Guest
                </button>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 