import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconHome, IconPizza, IconHistory, IconSettings, IconLogout, IconShoppingCart, IconMenu } from '../components/icons/Icons';
import { useCart } from '../contexts/CartContext';
import { useRouter } from 'next/router';
import { isAuthenticated, removeAuthToken } from '@/utils/auth';
import { SignupModal } from '@/components/auth/SignupModal';
import { LoginModal } from '@/components/auth/LoginModal';
import { useToast } from '@/components/ui/use-toast';
import { Dialog } from '@/components/ui/dialog';
import Cart from './cart/Cart';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: MainLayoutProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Select location');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { items } = useCart();
  const router = useRouter();
  const isMenuPage = router.pathname === '/customer/menu';
  const isCheckoutPage = router.pathname.startsWith('/customer/checkout');
  const { toast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Check authentication status only on the client side
  useEffect(() => {
    setIsClient(true);
    setIsUserAuthenticated(isAuthenticated());
  }, []);

  // This function handles the checkout button click
  const handleCheckout = async () => {
    console.log('Checkout clicked');
    if (isNavigating) {
      console.log('Navigation already in progress, skipping.');
      return;
    }
    setIsNavigating(true);
    if (isCartOpen) {
      setIsCartOpen(false);
    }
    try {
      // Both authenticated and guest users go directly to checkout
      if (isAuthenticated()) {
        await router.push('/customer/checkout');
      } else {
        // For guests, go directly to checkout with guest flag
        await router.push('/customer/checkout?guest=true');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to navigate to checkout. Please try again.",
      });
    } finally {
      setIsNavigating(false);
    }
  };

  // Switch from login to signup
  const handleShowSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  // Switch from signup to login
  const handleShowLogin = () => {
    setShowSignupModal(false);
    setShowLoginModal(true);
  };

  // Handle successful authentication
  const handleAuthSuccess = async () => {
    setShowLoginModal(false);
    setShowSignupModal(false);
    setIsUserAuthenticated(true);
    
    // Continue directly to checkout page with delivery address
    await router.replace('/customer/checkout');
    
    // Show a welcome toast for new users
    toast({
      variant: "success",
      title: "Welcome!",
      description: "Your account is ready. Complete your order to enjoy your meal.",
    });
  };

  // Handle logout
  const handleLogout = async () => {
    removeAuthToken();
    setIsUserAuthenticated(false);
    toast({
      variant: "success",
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    
    // Redirect to home/menu page
    await router.replace('/customer/menu');
  };

  const handleGuestCheckout = () => {
    // Close the signup modal
    setShowSignupModal(false);
    
    // Add a short delay to ensure modal closes properly before redirect
    setTimeout(async () => {
      // Redirect to checkout with guest flag
      await router.replace('/customer/checkout?guest=true');
      
      // Optional: show a toast to confirm guest checkout
      toast({
        variant: "success",
        title: "Guest Checkout",
        description: "You're continuing as a guest. Your cart items have been saved.",
      });
    }, 100);
  };

  return (
    <>
      <div className="min-h-screen bg-[#f5f7f8]">
        {/* Daash-inspired Header */}
        <header className="daash-header">
          <div className="daash-header-content">
            {/* Left section - Menu and Logo */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setShowMobileMenu(true)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-[#f5f7f8] transition-colors md:hidden"
                aria-label="Open menu"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#2c3137]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 7h14M5 12h14M5 17h14" />
                </svg>
              </button>
              
              {/* Logo */}
              <Link href="/customer/menu" className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#121212] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-lg">F</span>
                </div>
              </Link>
            </div>

            {/* Center section - Location (only on larger screens) */}
            <div className="hidden sm:flex items-center gap-4 flex-1 max-w-md mx-4">
              {/* Location Selector */}
              <button
                onClick={() => setShowLocationModal(true)}
                className="location-selector"
              >
                <svg className="location-icon" fill="currentColor" viewBox="0 0 17 16">
                  <path d="M8.967 1a5 5 0 0 1 5 5c0 .982-.513 2.324-1.422 4.046-.218.414-.457.843-.713 1.284a53.536 53.536 0 0 1-1.863 2.975l-.18.263a1 1 0 0 1-1.645 0l-.324-.48-.317-.483a53.525 53.525 0 0 1-1.401-2.275c-.256-.441-.495-.87-.714-1.284C4.48 8.324 3.967 6.982 3.967 6a5 5 0 0 1 5-5Zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                </svg>
                <span className="location-text">{selectedLocation}</span>
                <svg className="w-4 h-4 text-[#757d87] rotate-90" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.96 5.497A.741.741 0 0 1 7.006 4.45l3.18 3.18a1.046 1.046 0 0 1 0 1.48l-3.18 3.18a.741.741 0 0 1-1.048-1.048L8.83 8.37 5.96 5.497Z" />
                </svg>
              </button>

              {/* Search Bar - Hidden on smaller screens to save space */}
              <div className="relative flex-1 hidden lg:block">
                <input
                  type="search"
                  placeholder="Search for food..."
                  className="daash-search-input"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#757d87]" fill="currentColor" viewBox="0 0 17 16">
                  <path fillRule="evenodd" d="M13.062 10.705a.426.426 0 0 1-.087-.55 5.387 5.387 0 1 0-1.677 1.743.426.426 0 0 1 .55.062l2.06 2.278a.637.637 0 0 0 .727.157c.458-.2.815-.583.984-1.053a.643.643 0 0 0-.197-.716l-2.36-1.921Zm-4.545.449A3.77 3.77 0 1 1 8.19 3.62a3.77 3.77 0 0 1 .327 7.534Z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Right section - Cart and Auth */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Cart Button */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-1.5 sm:p-2.5 rounded-lg hover:bg-[#f5f7f8] transition-colors"
                disabled={isCheckoutPage}
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#757d87]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.25 20.625a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0ZM20.25 20.625a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0ZM2.625 1.493a1.132 1.132 0 1 0 0 2.265H3.93c.886 0 1.65.623 1.829 1.49l2.132 11.855c.108.527.572.905 1.11.905h9.75c.043 0 .087-.003.13-.008h.156a1.5 1.5 0 0 0 1.467-1.186l1.963-7.5A1.5 1.5 0 0 0 21 7.5H8.226l-.248-2.708a4.132 4.132 0 0 0-4.048-3.3H2.625Z" />
                </svg>
                {items.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-[#121212] text-white text-xs w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </button>

              {/* Auth Button */}
              {isClient && isUserAuthenticated ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/customer/orders"
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f5f7f8] transition-colors text-[#757d87] hover:text-[#2c3137]"
                  >
                    <IconHistory size={18} />
                    <span className="text-sm font-medium">Orders</span>
                  </Link>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-red-50 transition-colors text-[#757d87] hover:text-red-600"
                  >
                    <IconLogout size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="text-xs sm:text-sm font-medium hidden sm:block">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="daash-button-primary text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2.5"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="daash-container pt-4 sm:pt-6">
          {children}
        </main>

        {/* Cart Sidebar */}
        {isCartOpen && (
          <Cart 
            onClose={() => setIsCartOpen(false)} 
            onCheckout={handleCheckout}
            isNavigating={isNavigating}
          />
        )}

        {/* Mobile Menu Sidebar */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
            <div className="fixed top-0 left-0 w-80 h-full bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#e0e4e7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#121212] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">F</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#2c3137]">Folixx</h2>
                    <p className="text-xs text-[#757d87]">Food Delivery</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg hover:bg-[#f5f7f8] transition-colors"
                >
                  <svg className="w-5 h-5 text-[#757d87]" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.97 2.97a.75.75 0 0 1 1.06 0L8 6.939l3.97-3.97a.75.75 0 1 1 1.06 1.061L9.061 8l3.97 3.97a.75.75 0 0 1 .072.976l-.073.084a.75.75 0 0 1-1.06 0L8 9.061l-3.97 3.97a.75.75 0 0 1-1.06-1.061L6.939 8l-3.97-3.97a.75.75 0 0 1-.072-.976l.073-.084Z" />
                  </svg>
                </button>
              </div>

              {/* Location Section */}
              <div className="p-4 border-b border-[#e0e4e7]">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    setShowLocationModal(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f7f8] transition-colors"
                >
                  <svg className="w-5 h-5 text-[#757d87]" fill="currentColor" viewBox="0 0 17 16">
                    <path d="M8.967 1a5 5 0 0 1 5 5c0 .982-.513 2.324-1.422 4.046-.218.414-.457.843-.713 1.284a53.536 53.536 0 0 1-1.863 2.975l-.18.263a1 1 0 0 1-1.645 0l-.324-.48-.317-.483a53.525 53.525 0 0 1-1.401-2.275c-.256-.441-.495-.87-.714-1.284C4.48 8.324 3.967 6.982 3.967 6a5 5 0 0 1 5-5Zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                  </svg>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-[#2c3137]">Deliver to</p>
                    <p className="text-xs text-[#757d87]">{selectedLocation}</p>
                  </div>
                  <svg className="w-4 h-4 text-[#757d87]" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.96 5.497A.741.741 0 0 1 7.006 4.45l3.18 3.18a1.046 1.046 0 0 1 0 1.48l-3.18 3.18a.741.741 0 0 1-1.048-1.048L8.83 8.37 5.96 5.497Z" />
                  </svg>
                </button>
              </div>

              {/* Navigation Menu */}
              <div className="p-4">
                <nav className="space-y-2">
                  <Link
                    href="/customer/menu"
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isMenuPage ? 'bg-[#121212] text-white' : 'hover:bg-[#f5f7f8] text-[#2c3137]'
                    }`}
                  >
                    <IconPizza size={20} />
                    <span className="font-medium">Menu</span>
                  </Link>

                  {isClient && isUserAuthenticated && (
                    <Link
                      href="/customer/orders"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f7f8] transition-colors text-[#2c3137]"
                    >
                      <IconHistory size={20} />
                      <span className="font-medium">Orders</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      setIsCartOpen(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#f5f7f8] transition-colors text-[#2c3137]"
                  >
                    <div className="relative">
                      <IconShoppingCart size={20} />
                      {items.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#121212] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                          {items.length}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">Cart ({items.length})</span>
                  </button>
                </nav>
              </div>

              {/* Auth Section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#e0e4e7] bg-white">
                {isClient && isUserAuthenticated ? (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-red-600"
                  >
                    <IconLogout size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full daash-button-primary justify-center"
                  >
                    Login
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Location Modal */}
        {showLocationModal && (
          <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
              <div className="fixed inset-0 bg-black/50" onClick={() => setShowLocationModal(false)} />
              <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#2c3137]">Deliver to</h2>
                  <button
                    onClick={() => setShowLocationModal(false)}
                    className="p-2 rounded-lg hover:bg-[#f5f7f8] transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#757d87]" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2.97 2.97a.75.75 0 0 1 1.06 0L8 6.939l3.97-3.97a.75.75 0 1 1 1.06 1.061L9.061 8l3.97 3.97a.75.75 0 0 1 .072.976l-.073.084a.75.75 0 0 1-1.06 0L8 9.061l-3.97 3.97a.75.75 0 0 1-1.06-1.061L6.939 8l-3.97-3.97a.75.75 0 0 1-.072-.976l.073-.084Z" />
                    </svg>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Add your delivery address"
                    className="daash-input pl-9"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#757d87]" fill="currentColor" viewBox="0 0 17 16">
                    <path d="M8.967 1a5 5 0 0 1 5 5c0 .982-.513 2.324-1.422 4.046-.218.414-.457.843-.713 1.284a53.536 53.536 0 0 1-1.863 2.975l-.18.263a1 1 0 0 1-1.645 0l-.324-.48-.317-.483a53.525 53.525 0 0 1-1.401-2.275c-.256-.441-.495-.87-.714-1.284C4.48 8.324 3.967 6.982 3.967 6a5 5 0 0 1 5-5Zm0 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
                  </svg>
                </div>
              </div>
            </div>
          </Dialog>
        )}

        {/* Auth Modals */}
        <SignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          onLoginClick={handleShowLogin}
          onSuccess={handleAuthSuccess}
          onGuestCheckout={handleGuestCheckout}
        />

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSignupClick={handleShowSignup}
          onSuccess={handleAuthSuccess}
        />

        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black/50" onClick={() => setShowLogoutConfirm(false)} />
              <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-[#2c3137] mb-4">Confirm Logout</h3>
                <p className="text-[#757d87] mb-6">Are you sure you want to logout?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="daash-button-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      handleLogout();
                    }}
                    className="daash-button-primary flex-1"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </Dialog>
        )}
      </div>
    </>
  );
}