'use client';

import CustomerLayout from '@/components/customer-layout';
import { useState, useEffect } from 'react';
import { getUserId, isAuthenticated, removeAuthToken } from '@/utils/auth';
import { apiService } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { UserLocations } from '@/components/user/user-locations';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';

// Updated UserProfile interface that matches the API response
interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  imageUrl: string;
  role: string;
  isActive: boolean;
  isUserVerified: boolean;
  isEmailVerified: boolean;
  country: string | null;
  state: string | null;
  address: string | null;
  token: string | null;
  tokenCreatedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  riderData: any | null;
  createdAt: string;
  updatedAt: string;
  wallet?: {
    id: number;
    balance: string;
    userId: string;
    uuid: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default function Settings() {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeSubmitting, setPasswordChangeSubmitting] = useState(false);

  // Default notification preferences
  const [notifications, setNotifications] = useState({
      orderUpdates: true,
      promotions: false,
      newsletter: true,
      itemAvailability: true,
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Profile section collapse state
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      setError('Please log in to view your settings.');
      setLoading(false);
      return;
    }

    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = await getUserId();
        
        if (!userId) {
          setError('Not authenticated. Unable to fetch user ID. Please log in again.');
          setLoading(false);
          return;
        }
        
        const response = await apiService.getUserDetails(userId);
        
        if (response && response.data && response.data.user) {
          setUser(response.data.user);
          setEditedUser(response.data.user);
        } else {
          setError('Failed to load user details. Response was not as expected.');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to load user details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetails();
  }, []);

  const handleSave = async () => {
    if (!editedUser || !user?.id) return;
    
    setSubmitting(true);
    try {
      await apiService.updateUserDetails(user.id, {
        name: editedUser.name,
        email: editedUser.email,
        phone: editedUser.phone,
        country: editedUser.country,
        state: editedUser.state,
        address: editedUser.address,
      });
      
      setUser(editedUser);
    setIsEditing(false);
      toast({
        variant: "success",
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
    // Keep profile section expanded after canceling edit
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords don't match",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters long",
      });
      return;
    }

    setPasswordChangeSubmitting(true);
    try {
      await apiService.changePassword(user.id, {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast({
        variant: "success",
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to change password",
      });
    } finally {
      setPasswordChangeSubmitting(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleLogout = async () => {
    removeAuthToken();
    toast({
      variant: "success",
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    router.replace('/customer/menu');
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <p className="text-center">Loading user data...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!isAuthenticated()) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="text-center py-12 bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">{error || 'Please sign in to view and manage your settings.'}</p>
            <button 
              onClick={() => router.push('/customer/menu')}
              className="mt-4 px-6 py-2 bg-[#B2151B] text-white rounded-lg hover:bg-[#d41921] transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error && isAuthenticated() && !user) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <p className="text-center text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-[#B2151B] text-white rounded-lg hover:bg-[#d41921] transition-colors block mx-auto"
          >
            Try Again
          </button>
        </div>
      </CustomerLayout>
    );
  }

  if (isAuthenticated() && !user && !error && !loading) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto py-8 px-4">
          <p className="text-center">Initializing user data...</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-[#B2151B] text-white rounded-lg hover:bg-[#d41921] transition-colors block mx-auto"
          >
            Refresh
          </button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
              <button
                onClick={() => setIsProfileCollapsed(!isProfileCollapsed)}
                disabled={isEditing}
                className={`p-1 rounded-full transition-colors ${
                  isEditing 
                    ? 'cursor-not-allowed text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                {isProfileCollapsed ? (
                  <ChevronDown className={`h-5 w-5 ${isEditing ? 'text-gray-300' : 'text-gray-500'}`} />
                ) : (
                  <ChevronUp className={`h-5 w-5 ${isEditing ? 'text-gray-300' : 'text-gray-500'}`} />
                )}
              </button>
            </div>
            {!isEditing && !isProfileCollapsed && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsProfileCollapsed(false);
                }}
                className="text-[#B2151B] hover:text-orange-600 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {/* Collapsible Profile Content */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isProfileCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
          }`}>
            {user && editedUser && (
          <div className="space-y-4">
                {/* User Image */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img 
                      src={user.imageUrl || "/placeholder-avatar.png"} 
                      alt="Profile" 
                      className="h-24 w-24 rounded-full object-cover"
                    />
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 bg-[#B2151B] text-white p-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  id="name"
                      value={editedUser.name}
                      onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none"
                />
              ) : (
                    <p className="text-gray-900">{user.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              {isEditing ? (
                <input
                  type="email"
                  id="email"
                      value={editedUser.email || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none"
                />
              ) : (
                    <p className="text-gray-900">{user.email || 'Not set'}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  id="phone"
                      value={editedUser.phone}
                      onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{user.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="country"
                      value={editedUser.country || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, country: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{user.country || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      id="state"
                      value={editedUser.state || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, state: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none"
                />
              ) : (
                    <p className="text-gray-900">{user.state || 'Not set'}</p>
              )}
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  id="address"
                      value={editedUser.address || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none"
                />
              ) : (
                    <p className="text-gray-900">{user.address || 'Not set'}</p>
              )}
            </div>

                {/* Wallet Information (Display Only) */}
                {user.wallet && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet Balance
                    </label>
                    <p className="text-gray-900 font-bold">₦{user.wallet.balance}</p>
                  </div>
                )}

            {isEditing && (
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-[#B2151B] text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>

          {/* Password Change Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Password</h2>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-[#B2151B] hover:text-orange-600 font-medium"
                >
                  Change Password
                </button>
              )}
            </div>
            
            {isChangingPassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none pr-10"
                      required
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none pr-10"
                      required
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[#B2151B] focus:outline-none pr-10"
                      required
                    />
                    <button 
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelPasswordChange}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    disabled={passwordChangeSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#B2151B] text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                    disabled={passwordChangeSubmitting}
                  >
                    {passwordChangeSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
              </form>
            ) : (
              <p className="text-gray-500">For security, your password is hidden. Click "Change Password" to update it.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <UserLocations />
        </div>

      </div>
    </div>

    {showLogoutConfirm && (
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="mb-6 text-gray-600">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-[#B2151B] text-white hover:bg-[#a11217]"
                onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </Dialog>
    )}
    </CustomerLayout>
  );
} 