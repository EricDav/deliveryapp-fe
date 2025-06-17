import { PackageCheck, ChefHat, ClipboardCheck, Truck, CheckCircle, XCircle, Calendar, List } from "lucide-react";

const orderStatuses = [
  { label: "Confirmed", count: 0, color: "bg-blue-100", icon: <PackageCheck size={24} className="text-blue-500" /> },
  { label: "Cooking", count: 0, color: "bg-yellow-100", icon: <ChefHat size={24} className="text-yellow-500" /> },
  { label: "Ready for delivery", count: 0, color: "bg-green-100", icon: <ClipboardCheck size={24} className="text-green-500" /> },
  { label: "Item on the way", count: 0, color: "bg-red-100", icon: <Truck size={24} className="text-red-500" /> },
  { label: "Delivered", count: 0, color: "bg-gray-100", icon: <CheckCircle size={24} className="text-gray-600" /> },
  { label: "Refunded", count: 0, color: "bg-gray-100", icon: <XCircle size={24} className="text-gray-600" /> },
  { label: "Scheduled", count: 0, color: "bg-gray-100", icon: <Calendar size={24} className="text-gray-600" /> },
  { label: "All", count: 0, color: "bg-gray-100", icon: <List size={24} className="text-gray-600" /> },
];

const OrderSummary = () => {
  return (
    <div className="grid grid-cols-4 gap-8">
    {orderStatuses.map((status, index) => (
      <div
        key={index}
        className={`p-4 rounded-lg shadow-md flex items-center ${status.color} w-full ${index < 4 ? 'h-32' : 'h-28'}`}
      >
        <div className="mr-4">{status.icon}</div>
        <div>
          <p className="text-xl font-bold text-black">{status.count}</p>
          <p className="text-sm font-medium text-gray-700">{status.label}</p>
        </div>
      </div>
    ))}
  </div>
  );
};

export default OrderSummary;
