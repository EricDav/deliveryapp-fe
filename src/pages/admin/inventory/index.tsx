import AdminLayout from "@/components/auth-layout";
import { DataTable } from "@/components/data-table";
import { DetailViewConfig, ColumnDefinition } from "@/types/data-table";
import Image from "next/image";
import { useProducts } from '@/hooks/useProducts';
import { useState } from "react"
import FilterBar, { DateRange } from '@/components/filter-bar'


const InventoryLayout = () => {

  const { products, loading, error } = useProducts();
  
      const inventoryDetailConfig: DetailViewConfig = {
        enabled: true,
        title: (item: any) => `Product: ${item.name}`,
      }


  const [filters, setFilters] = useState({
    searchQuery: '',
    dateRange: { from: undefined, to: undefined } as DateRange,
    customerType: 'all',
    status: 'all'
  });

  const handleFilterChange = (newFilters:any) => {
    setFilters(prevFilters => {
      if (JSON.stringify(prevFilters) === JSON.stringify(newFilters)) {
        return prevFilters;
      }
      return newFilters;
    });
    
  };

      const inventoryColumns: ColumnDefinition[] = [
        {
          id: "id",
          header: "#",
          accessorKey: "id",
        },
        {
          id: "name",
          header: "Name",
          accessorKey: "name",
          cell: (info: any) => (
            <div className="flex items-center gap-3">
              <img
                src={info.imageUrl || "/placeholder.svg"}
                alt={info.name}
                width={60}
                height={60}
                className="rounded-md object-cover"
              />
              <span className="font-medium">{info.name}</span>
            </div>
          ),
        },
        {
          id: "category",
          header: "Category",
          accessorKey: "category",
          cell: (info: any) => (
            <span>{info.category?.name || "N/A"}</span>
          ),
        },
        {
          id: "price",
          header: "Price",
          accessorKey: "price",
          cell: (info: any) => (
            <span>₦ {info.price.toLocaleString()}</span>
          ),
        },
        {
          id: "status",
          header: "Status",
          accessorKey: "isAvailable",
          cell: (info: any) => (
            <span>
              {info.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          ),
        },
      ]
  return (
    <AdminLayout>
          <h2 className="text-xl font-semibold mb-4">Inventory Management</h2>
          <div className="container mx-auto p-6">
   

          <div className="flex justify-between items-center my-8">
            
            <FilterBar
              initialFilters={filters}
              onFilterChange={handleFilterChange}
              showSearch={true}
              showDateRange={true}
              showCustomerType={true}
              showStatus={true}
            
            />
            </div>
          <DataTable
            data={products}
            columns={inventoryColumns}
            tableType="inventory"
            detailView={inventoryDetailConfig}
            actions={{ edit: true, delete: true }}
           
        
          />
    </div>
       
    </AdminLayout>
  );
};

export default InventoryLayout;
