import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { apiService } from '@/services/api';
import { saveAuthToken, saveUserId } from '@/utils/auth';
import { Loader2 } from 'lucide-react';

interface PostPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderExternalId: string;
  email: string;
  onSuccess: () => void;
}

export function PostPaymentModal({ isOpen, onClose, orderExternalId, email, onSuccess }: PostPaymentModalProps) {
  const [step, setStep] = useState<'options' | 'create-account'>('options');
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpResendDisabled, setOtpResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  // Check if the ID is an externalId (contains letters) or a numeric orderId
  const isExternalId = /[a-zA-Z]/.test(orderExternalId);
  const orderIdForDisplay = isExternalId ? orderExternalId : `Order #${orderExternalId}`;

  // Debug log when component mounts or props change
  useEffect(() => {
    console.log("PostPaymentModal rendered with:", { 
      isOpen, 
      orderExternalId, 
      isExternalId, 
      email,
      step
    });
  }, [isOpen, orderExternalId, isExternalId, email, step]);

  // Force modal to show - this helps with potential timing issues
  useEffect(() => {
    if (orderExternalId && email) {
      console.log("PostPaymentModal has valid data, ensuring it's visible");
    }
  }, [orderExternalId, email]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && otpResendDisabled) {
      setOtpResendDisabled(false);
    }
  }, [countdown, otpResendDisabled]);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      // Call the API to send OTP
      await apiService.sendOtp({ email });
      
      setOtpSent(true);
      setOtpResendDisabled(true);
      setCountdown(60); // 60 seconds cooldown
      
      toast({
        variant: "success",
        title: "OTP Sent",
        description: "A verification code has been sent to your email.",
      });
    } catch (err) {
      console.error("Error sending OTP:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send verification code",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!token.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the verification code",
      });
      return;
    }
    
    // Validate password
    if (passwordData.password !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords don't match",
      });
      return;
    }

    if (passwordData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Setting guest password with OTP verification for:", email);
      const response = await apiService.setGuestPassword({
        email,
        password: passwordData.password,
        token
      });
      
      console.log("Account creation response:", response);
      
      // If the API returns auth token, save it
      if (response && response.token) {
        saveAuthToken(response.token);
        if (response.userId) {
          saveUserId(response.userId);
        }
      }
      
      toast({
        variant: "success",
        title: "Success",
        description: "Account created successfully. You can now track your orders anytime.",
      });
      
      onSuccess();
    } catch (err) {
      console.error("Error creating account:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create account",
      });
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    // Create WhatsApp message with order details
    const message = `Hello, I'd like to track my order with ID: ${orderIdForDisplay}`;
    // Use international format for Nigerian number
    const whatsappNumber = '2348123456789';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    
    // Close modal and continue to order tracking
    onClose();
    onSuccess();
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log("Dialog onOpenChange triggered:", open);
        if (!open) {
          console.log("Dialog closing");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {step === 'options' ? 'Track Your Order' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {step === 'options' ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                How would you like to track your order?
              </p>
              
              <div className="space-y-3 mt-4">
                <button
                  onClick={() => {
                    console.log("Create account option clicked");
                    setStep('create-account');
                  }}
                  className="w-full py-3 bg-[#B2151B] text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                >
                  Create Account & Track Order
                </button>
                
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="flex-shrink mx-4 text-gray-600">or</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>
                
                <button
                  onClick={openWhatsApp}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.436-9.884 9.939-9.884 2.64 0 5.122 1.031 6.988 2.898 1.865 1.859 2.897 4.349 2.895 6.979-.003 5.448-4.437 9.888-9.885 9.888M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                  </svg>
                  Chat with Agent on WhatsApp
                </button>
                
                <p className="text-sm text-gray-500 text-center pt-2">
                  You can also continue without tracking - your order is being prepared.
                </p>
                
                <button
                  onClick={() => { onClose(); onSuccess(); }}
                  className="w-full py-2 text-gray-600 hover:text-gray-900 text-sm"
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAccountCreation} className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">
                  Create an account with:
                </p>
                <p className="font-medium mt-1">{email}</p>
              </div>
              
              {!otpSent ? (
                <div className="text-center py-2">
                  <p className="text-gray-600 mb-3">
                    First, we'll send a verification code to your email.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading || otpResendDisabled}
                    className="w-full py-3 bg-[#B2151B] text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Verification Code'
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                      required
                      placeholder="Enter code from your email"
                    />
                    <div className="text-right mt-1">
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={loading || otpResendDisabled}
                        className="text-sm text-gray-600 hover:text-[#B2151B]"
                      >
                        {otpResendDisabled
                          ? `Resend code in ${countdown}s`
                          : "Resend code"}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.password}
                      onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                      required
                      placeholder="Choose a password (min 6 characters)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2"
                      required
                      placeholder="Confirm your password"
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
                      'Create Account & Track Order'
                    )}
                  </button>
                </>
              )}
              
              <button
                type="button"
                onClick={() => setStep('options')}
                className="w-full py-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                Back to Options
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 