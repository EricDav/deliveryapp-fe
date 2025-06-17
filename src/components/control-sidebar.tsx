import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  Home, 
  Package, 
  Users, 
  BarChart, 
  Truck, 
  LogOut, 
  Menu, 
  BookOpen,
 
} from "lucide-react";
import { removeAuthToken } from "@/utils/auth";
import { useToast } from '@/components/ui/use-toast';
import { apiService } from "@/services/api";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [totalOrderCount, setTotalOrderCount] = useState(0);

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, path: "/control" },
    { name: "Orders", icon: <Package size={20} />, path: "/control/orders" },
    { name: "Inventory", icon: <BookOpen size={20} />, path: "/control/inventory" },
  ];

  // Fetch total order count
  useEffect(() => {
    const fetchOrderCount = async () => {
      try {
        // Get all orders to count total
        const allOrders = await apiService.getOrders({ pageSize: 1000 });
        setTotalOrderCount(allOrders?.orders?.length || 0);
      } catch (error) {
        console.error("Error fetching order count:", error);
      }
    };
    
    fetchOrderCount();
    
    // Set up an interval to refresh the count every minute
    const intervalId = setInterval(fetchOrderCount, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleLogout = async () => {
    removeAuthToken();
    toast({
      variant: "success",
      title: "Logged out",
      description: "You have been successfully logged out"
    });
    // Redirect to login page or home
    await router.replace('/');
  };

  return (
    <div className={`h-full bg-[#B2151B] text-white px-4 flex flex-col pt-8 ${isCollapsed ? "w-16" : "w-64"} transition-all duration-300`}>
      <div className="px-4 flex justify-between items-center">
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="focus:outline-none">
          <Menu size={24} />
        </button>
        {!isCollapsed && <img className="w-28" src="/hospitality.png" alt="Logo" />}
      </div>

      <div className="mt-6">
        {!isCollapsed && <p className="px-4 text-gray-300 text-sm">CONTROL PANEL</p>}
      </div>

      <nav className="flex flex-col space-y-1 flex-grow mt-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Link key={item.name} href={item.path} passHref>
            <div
              className={`flex items-center p-3 cursor-pointer hover:bg-[#D85959] rounded-md transition-colors duration-200 ${
                router.pathname === item.path || 
                (item.path !== "/control" && router.pathname.startsWith(item.path)) 
                  ? "bg-[#9C1212]" 
                  : ""
              }`}
            >
              <span>{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="ml-3">{item.name}</span>
                  {item.name === "Orders" && (
                    <span className="ml-3 text-white bg-[#9C1212] px-2 rounded-full">{totalOrderCount}</span>
                  )}
                </>
              )}
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full p-3 text-red-500 hover:bg-red-800/20 rounded-md"
        >
          <LogOut size={20} />
          {!isCollapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
