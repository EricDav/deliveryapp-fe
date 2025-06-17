import AdminLayout from "../../components/auth-layout";
import { LayoutDashboard, ChartColumnBig } from "lucide-react"
import OrderSummary from "@/components/order-summary";
import { FoodItems } from "@/components/food-items";
import BarChartComponent from "@/components/bar-chart";

export default function AdminDashboard() {
    return (
        <AdminLayout>
            <div className=" flex flex-col space-y-5">
                <div className="text-2xl flex space-x-3 items-center font-bold">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                </div>
                <div className="bg-white flex flex-col space-y-5 shadow-md p-8 mt-5 rounded-md">
                    <div className="flex justify-between">
                        <div className="flex space-x-2">
                            <ChartColumnBig />
                            <span className="font-semibold">Dashboard order statistics
                            </span>
                        </div>
                    </div>
                    <OrderSummary />
                </div>
                <div className="bg-white flex flex-col space-y-5 shadow-md p-5 mt-5 rounded-md">
                    <span className="font-semibold">No of Deliveries</span>
                    < BarChartComponent />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <FoodItems title="Top Selling Items" type="selling" />
                    <FoodItems title="Top Rated Items" type="rated" />
                </div>
            </div>
        </AdminLayout>
    );
}