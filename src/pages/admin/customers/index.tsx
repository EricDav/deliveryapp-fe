import AdminLayout from "@/components/auth-layout";
import { DataTable } from "@/components/data-table";
import { DetailViewConfig, type ColumnDefinition } from "@/types/data-table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import FilterBar, { DateRange } from '@/components/filter-bar'
import { useEffect, useState } from "react"
import { apiService, Customer } from "@/services/api";
import { CustomerFilters } from "@/types/customers";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import CustomPagination from "@/components/custom-pagination";
import { Button } from "@/components/ui/button";

const CustomerLayout = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const [filters, setFilters] = useState<CustomerFilters & {
    dateRange: DateRange;
    customerType: string;
  }>({
    orderBy: 'asc',
    sortBy: 'createdAt',
    search: '',
    pageSize: 10,
    pageNumber: 1,
    dateRange: { from: undefined, to: undefined },
    customerType: 'all'
  });

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // Convert filter format for API
      const apiFilters: CustomerFilters = {
        orderBy: filters.orderBy,
        sortBy: filters.sortBy,
        search: filters.search,
        pageSize: filters.pageSize,
        pageNumber: filters.pageNumber,
        dateFrom: filters.dateRange.from ? format(filters.dateRange.from, 'yyyy-MM-dd') : undefined,
        dateTo: filters.dateRange.to ? format(filters.dateRange.to, 'yyyy-MM-dd') : undefined
      };
      
      const response = await apiService.getCustomers(apiFilters);
      if (response) {
        setCustomers(response.customers || []);
      
      // Set pagination data
      if (response.pagination) {
        setTotalItems(response.pagination.total);
        setTotalPages(Math.ceil(response.pagination.total / response.pagination.pageSize));
        }
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCsv = async () => {
    setIsExporting(true);
    try {
      // Fetch all customers with pageSize set to total
      const exportFilters: CustomerFilters = {
        ...filters,
        pageNumber: 1,
        pageSize: totalItems > 0 ? totalItems : 1000 // Use total or fallback to 1000
      };
      
      const response = await apiService.getCustomers(exportFilters);
      if (response) {
        const allCustomers = response.customers || [];
      
      if (allCustomers.length === 0) {
        toast({
          variant: "destructive",
          title: "Export failed",
          description: "No data available to export",
        });
        return;
      }
      
      // Convert data to CSV format
      const headers = ["Name", "Email", "Phone", "Address", "Country", "Join Date"];
        const csvData = allCustomers.map((customer: Customer) => [
        customer.name || '',
        customer.email || '',
        customer.phone || '',
        customer.address?.replace('  null', '') || '',
        customer.country || '',
        format(new Date(customer.createdAt), 'PP')
      ]);
      
      // Add headers
      csvData.unshift(headers);
      
      // Convert to CSV string
      const csvContent = csvData.map(row => row.map(cell => 
        `"${String(cell).replace(/"/g, '""')}"`
      ).join(',')).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = format(new Date(), 'yyyy-MM-dd');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `customers-${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: `${allCustomers.length} customers exported to CSV`,
      });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export customers';
      toast({
        variant: "destructive",
        title: "Export failed",
        description: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const customerDetailConfig: DetailViewConfig = {
    enabled: true,
    title: (item) => `Customer: ${item.name}`,
  };

  const customerColumns: ColumnDefinition[] = [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <Image
            src={row.imageUrl || "/placeholder.svg"}
            alt={row.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div>
            <div className="font-medium">{row.name}</div>
            <div className="text-sm text-muted-foreground">{row.email || 'No email'}</div>
          </div>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      accessorKey: "phone",
    },
    {
      id: "address",
      header: "Address",
      accessorKey: "address",
      cell: (row: any) => row.address && row.address !== "  null" ? row.address : "No address",
    },
    {
      id: "createdAt",
      header: "Join Date",
      accessorKey: "createdAt",
      cell: (row: any) => format(new Date(row.createdAt), 'PP'),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: () => (
        <Badge className="bg-green-100 text-green-800">
          Active
        </Badge>
      ),
    },
  ];

  const handleFilterChange = (newFilters: any) => {
    setFilters(prevFilters => {
      if (JSON.stringify(prevFilters) === JSON.stringify(newFilters)) {
        return prevFilters;
      }
      return newFilters;
    });
  };
    
  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      pageNumber: page
    }));
  };

  return (
    <AdminLayout>
      <h2 className="text-xl font-semibold mb-4">Customer Management</h2>
      <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-800">Customers</h1>
        
          <div className="flex items-center gap-3">
            {!isLoading && !error && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportToCsv} 
                disabled={isExporting || customers.length === 0}
                className="flex items-center gap-1"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>Export CSV</span>
              </Button>
            )}
            
            {!isLoading && !error && totalPages > 0 && (
              <CustomPagination
                currentPage={filters.pageNumber || 1}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={totalItems}
                currentItems={customers.length}
                variant="compact"
                align="right"
                showPageCount={false}
              />
            )}
          </div>
      </div>

      <div className="flex justify-between items-center my-8">
            <FilterBar
              initialFilters={filters}
              onFilterChange={handleFilterChange}
              showSearch={true}
              showDateRange={true}
              showCustomerType={true}
            showStatus={false}
              customerTypeOptions={[
                { value: 'all', label: 'All Types' },
                { value: 'premium', label: 'Premium Users' },
              ]}
            />
            </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading customers...</span>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 my-4">
            <div className="flex">
              <div className="text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
      <DataTable
              data={Array.isArray(customers) ? customers : []}
        columns={customerColumns}
        tableType="customers"
        detailView={customerDetailConfig}
        actions={{ view: true, edit: true, delete: true }}
      />
      
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing {customers.length} of {totalItems} customers
            </div>
          </>
        )}
    </div>
    </AdminLayout>
  );
};

export default CustomerLayout;