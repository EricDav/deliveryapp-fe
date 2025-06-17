import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { apiService } from '@/services/api';
import { saveAuthToken, saveUserId, saveUserRole } from '@/utils/auth';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSignupClick: () => void; // To switch to signup modal
}

export function LoginModal({ isOpen, onClose, onSuccess, onSignupClick }: LoginModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const response = await apiService.login(formData);
    
    if (!response.success || !response.data) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: response.error || "Invalid credentials. Please try again.",
      });
      setLoading(false);
      return;
    }

    // Save auth token and user ID
    await saveAuthToken(response.data.token);
    await saveUserId(response.data.id);
    
      if (response.data.role) {
        saveUserRole(response.data.role);
      
      // Check user role and redirect accordingly
      if (response.data.role === 'admin') {
        toast({
          title: "Admin Login",
          description: "Redirecting to admin portal...",
        });
        
        onClose();
        router.push('/admin');
        return;
      } else if (response.data.role === 'csr') {
        toast({
          title: "CSR Login",
          description: "Redirecting to control panel...",
        });
        
        onClose();
        router.push('/control');
        return;
      } else if (response.data.role === 'rider') {
        toast({
          title: "Rider Login",
          description: "Redirecting to rider dashboard...",
        });
        
        onClose();
        router.push('/rider');
        return;
      }
    }
    
    toast({
      title: "Login successful",
      description: `Welcome back, ${response.data.name}!`,
    });

    setLoading(false);
    onSuccess();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-white">
        <div className="p-6">
          <DialogHeader className="flex flex-row items-center justify-between pb-2">
            <DialogTitle className="text-2xl font-bold">
              Login
            </DialogTitle>
            <DialogClose asChild>
              <button className="rounded-full hover:bg-gray-100 p-1">
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#B2151B] text-white rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button 
                  type="button"
                  onClick={onSignupClick}
                  className="text-[#B2151B] font-medium hover:underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
