import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, 
  Clock, 
  MapPin, 
  Settings, 
  LogOut,
  Bike
} from 'lucide-react';
import { removeAuthToken } from '@/utils/auth';
import { useToast } from '@/components/ui/use-toast';
import { LocationTracker } from './rider/LocationTracker';


interface RiderLayoutProps {
  children: ReactNode;
}

export default function RiderLayout({ children }: RiderLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    removeAuthToken();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    await router.replace('/');
  };

  const navigationItems = [
    { href: '/rider', label: 'Dashboard', icon: Home },
    { href: '/rider/deliveries', label: 'Deliveries', icon: Bike },
    { href: '/rider/history', label: 'History', icon: Clock },
    { href: '/rider/location', label: 'Location', icon: MapPin },
    { href: '/rider/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <LocationTracker />
      <div className="flex flex-col h-screen bg-gray-100 md:flex-row">
        {/* Sidebar for Desktop */}
        <aside className="hidden md:block md:w-64 bg-white shadow-md">
          <div className="h-full flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b">
              <img src="/hospitality.png" alt="Logo" className="h-12" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link 
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-[#B2151B] text-white' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-2 w-full text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden bg-white shadow-md p-4">
          <img src="/hospitality.png" alt="Logo" className="h-8" />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-t md:hidden">
          <div className="flex justify-around items-center h-16">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    isActive 
                      ? 'text-[#B2151B]' 
                      : 'text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-600"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-xs mt-1">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
} 