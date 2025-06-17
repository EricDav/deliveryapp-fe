import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import AdminLayout from '@/components/auth-layout';
// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsDashboard() {
  // Mock data for the line chart
  const lineChartData = {
    labels: ['Oct 20', 'Oct 21', 'Oct 22', 'Oct 23', 'Oct 24', 'Oct 25', 'Oct 27'],
    datasets: [
      {
        data: [1200, 2200, 2800, 2400, 3000, 3600, 2000, 3200, 2600],
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.2,
      },
    ],
  };

  // Mock data for the bar chart
  const barChartData = {
    labels: ['Oct 20', 'Oct 21', 'Oct 22', 'Oct 23', 'Oct 24', 'Oct 25', 'Oct 27'],
    datasets: [
      {
        label: 'Facebook Ads',
        data: [3000, 4500, 3500, 4500, 4800, 2200, 3500],
        backgroundColor: '#6366F1',
      },
      {
        label: 'Google Ads',
        data: [1700, 3800, 2000, 3100, 3800, 1300, 2500],
        backgroundColor: '#F87171',
      },
    ],
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 5000,
        ticks: {
          stepSize: 1000,
          callback: function(value: any) {
            if (value === 0) return '0';
            return value / 1000 + 'K';
          }
        }
      }
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 5000,
        ticks: {
          stepSize: 1000,
          callback: function(value:any) {
            if (value === 0) return '0';
            return value / 1000 + 'K';
          }
        }
      }
    },
  };

  return (
    <AdminLayout>
          <div className="p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Analytics Report</h1>
        <div className="flex gap-4">
          <div className="flex items-center border rounded-lg bg-white px-4 py-2">
            <span className="mr-2">12 Sep - 28 Oct 2024</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="flex items-center border rounded-lg bg-white px-4 py-2">
            <span className="mr-2">Shop Location</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="flex items-center border rounded-lg bg-white px-4 py-2">
            <span className="mr-2">All Vendor</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Total Sales Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-gray-500 mb-2">Total Sales</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">$11,249</p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>10% vs last 30 days</span>
              </div>
            </div>
            <div className="h-12 w-24 opacity-30">
              {/* Mini chart placeholder */}
              <div className="h-full w-full bg-green-100 flex items-end">
                <div className="w-2 h-4 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-6 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-5 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-8 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-7 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-10 bg-green-600 mx-0.5"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-gray-500 mb-2">Total Revenue</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">$5,249</p>
              <div className="flex items-center mt-2 text-sm text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>10% vs last 30 days</span>
              </div>
            </div>
            <div className="h-12 w-24 opacity-30">
              {/* Mini chart placeholder */}
              <div className="h-full w-full bg-green-100 flex items-end">
                <div className="w-2 h-4 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-6 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-5 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-8 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-7 bg-green-300 mx-0.5"></div>
                <div className="w-2 h-10 bg-green-600 mx-0.5"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sales by Channel Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-gray-500 mb-2">Sales by Channnel</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">$5,249</p>
              <div className="flex items-center mt-2 text-sm text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>10% vs last 30 days</span>
              </div>
            </div>
            <div className="h-12 w-24 opacity-30">
              {/* Mini chart placeholder */}
              <div className="h-full w-full bg-red-100 flex items-end">
                <div className="w-2 h-7 bg-red-300 mx-0.5"></div>
                <div className="w-2 h-5 bg-red-300 mx-0.5"></div>
                <div className="w-2 h-6 bg-red-300 mx-0.5"></div>
                <div className="w-2 h-4 bg-red-300 mx-0.5"></div>
                <div className="w-2 h-5 bg-red-300 mx-0.5"></div>
                <div className="w-2 h-10 bg-red-600 mx-0.5"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Sales Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Sales Statistics</h2>
            <div className="flex items-center border rounded-lg px-4 py-1">
              <span className="mr-2">Weekly</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="h-64">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>
        
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Top Selling Product</h2>
            <div className="flex items-center border rounded-lg px-4 py-1">
              <span className="mr-2">Monthly</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Product Name</span>
              <span>Sales Time</span>
            </div>
            
            {/* Product 1 */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-gray-200 mr-3 overflow-hidden">
                  {/* <img src="" alt="Airpods Pro" /> */}
                </div>
                <span>Jollof Rice</span>
              </div>
              <span>11,120</span>
            </div>
            
            {/* Product 2 */}
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-gray-200 mr-3 overflow-hidden">
                  {/* <img src="" alt="Macbook Pro" /> */}
                </div>
                <span>Beans</span>
              </div>
              <span>10,976</span>
            </div>
            
            {/* Product 3 */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-lg bg-gray-200 mr-3 overflow-hidden">
                  {/* <img src="" alt="Shoes Nike" /> */}
                </div>
                <span>Spaghetti</span>
              </div>
              <span>8,483</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Sales by Paid Channel */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Sales by Paid Channel</h2>
            <div className="flex items-center border rounded-lg px-4 py-1">
              <span className="mr-2">Weekly</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <div className="mb-4 flex items-center">
            <div className="flex items-center mr-6">
              <div className="h-3 w-3 bg-indigo-500 rounded-sm mr-2"></div>
              <span className="text-sm">Facebook Ads</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-red-400 rounded-sm mr-2"></div>
              <span className="text-sm">Google Ads</span>
            </div>
          </div>
          
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
        
        {/* Customer's Report */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Customer's Report</h2>
            <div className="flex items-center border rounded-lg px-4 py-1">
              <span className="mr-2">Monthly</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          <div className="mb-2 flex items-center">
            <div className="flex items-center mr-6">
              <div className="h-3 w-3 bg-green-500 rounded-sm mr-2"></div>
              <span className="text-sm">Last Month</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 bg-yellow-400 rounded-sm mr-2"></div>
              <span className="text-sm">This Month</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* New vs Repeat Customers */}
            <div>
              <div className="mb-1">
                <p className="text-2xl font-bold">11,200</p>
                <p className="text-sm text-gray-500">New Customer's</p>
              </div>
              <div className="h-3 flex mb-6">
                <div className="bg-green-500 h-full w-3/5 rounded-l"></div>
                <div className="bg-yellow-400 h-full w-2/5 rounded-r"></div>
              </div>
              
              <div className="mb-1">
                <p className="text-2xl font-bold">24,120</p>
                <p className="text-sm text-gray-500">Purchase of Product</p>
              </div>
              <div className="h-3 flex mb-6">
                <div className="bg-green-500 h-full w-2/5 rounded-l"></div>
                <div className="bg-yellow-400 h-full w-3/5 rounded-r"></div>
              </div>
              
              <p className="text-sm text-gray-500">Jan 01</p>
            </div>
            
            {/* Right Column */}
            <div>
              <div className="mb-1">
                <p className="text-2xl font-bold">1,600</p>
                <p className="text-sm text-gray-500">Repeat Customer's</p>
              </div>
              <div className="h-3 flex mb-6">
                <div className="bg-green-500 h-full w-2/5 rounded-l"></div>
                <div className="bg-yellow-400 h-full w-3/5 rounded-r"></div>
              </div>
              
              <div className="mb-1">
                <p className="text-2xl font-bold">2,300</p>
                <p className="text-sm text-gray-500">Cancel Orders</p>
              </div>
              <div className="h-3 flex mb-6">
                <div className="bg-green-500 h-full w-2/5 rounded-l"></div>
                <div className="bg-yellow-400 h-full w-3/5 rounded-r"></div>
              </div>
              
              <p className="text-sm text-gray-500">Feb 01</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AdminLayout>
  
  );
}