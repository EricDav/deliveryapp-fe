import AdminLayout from "@/components/auth-layout";
import { DataTable } from "@/components/data-table";
import { DetailViewConfig, type ColumnDefinition } from "@/types/data-table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState, useEffect } from "react"
import FilterBar, { DateRange } from '@/components/filter-bar'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

// Define CSR interface
interface CSR {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  avatar?: string;
  country?: string;
  state?: string;
  address?: string;
  createdAt: string;
}

const CSRManagementPage = () => {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csrs, setCsrs] = useState<CSR[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [csrData, setCSRData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    profileImage: null as File | null,
  });

  const fetchCSRs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get CSRs from the API using the existing getCSRs method
      const csrData = await apiService.getCSRs();
      
      // Map the API response to our CSR interface
      const formattedCSRs: CSR[] = csrData.map((csr: any) => ({
        id: csr.id,
        name: csr.name,
        email: csr.email,
        phone: csr.phone,
        status: csr.status || "Active", // Default to Active if status is not provided
        country: csr.country,
        state: csr.state,
        address: csr.address,
        createdAt: csr.createdAt,
        avatar: csr.imageUrl || "/placeholder.svg?height=60&width=60",
      }));
      
      setCsrs(formattedCSRs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch CSRs';
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
  
  useEffect(() => {
    fetchCSRs();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCSRData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCSRData(prev => ({ ...prev, profileImage: e.target.files![0] }));
    }
  };

  const createCSR = async () => {
    // Validate form
    if (!csrData.name || !csrData.email || !csrData.phone || !csrData.password) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, upload the image if provided
      let imageUrl = "";
      if (csrData.profileImage) {
        imageUrl = await apiService.uploadImage(csrData.profileImage);
      }
      
      // Then create the CSR
      await apiService.createCSR({
        name: csrData.name,
        email: csrData.email,
        phone: csrData.phone,
        password: csrData.password,
        imageUrl: imageUrl,
        address: csrData.address,
      });
      
      toast({
        title: "Success",
        description: "CSR created successfully."
      });
      setIsDialogOpen(false);
      
      // Reset form
      setCSRData({
        name: "",
        email: "",
        phone: "",
        password: "",
        address: "",
        profileImage: null,
      });
      
      // Refresh CSRs list
      fetchCSRs();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create CSR"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const csrColumns: ColumnDefinition[] = [
    {
      id: "id",
      header: "#",
      accessorKey: "id",
    },
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      cell: (info) => (
        <div className="flex items-center gap-3">
          <Image
            src={info.avatar || "/placeholder.svg"}
            alt={info.name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div>
            <div className="font-medium">{info.name}</div>
            <div className="text-sm text-muted-foreground">{info.email}</div>
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
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (info) => {
        const statusStyles = {
          Active: "bg-green-100 text-green-800",
          Inactive: "bg-gray-100 text-gray-800",
        }
        const style = statusStyles[info.status as keyof typeof statusStyles] || "bg-gray-100 text-gray-800"
  
        return <Badge className={style}>{info.status}</Badge>
      },
    },
    {
      id: "location",
      header: "Location",
      accessorKey: "country",
      cell: (info) => (
        <div>
          {info.state && <span>{info.state}, </span>}
          {info.country || "Not specified"}
        </div>
      ),
    },
    {
      id: "createdAt",
      header: "Joined",
      accessorKey: "createdAt",
      cell: (info) => {
        const date = new Date(info.createdAt);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      },
    },
  ];

  const csrDetailConfig: DetailViewConfig = {
    enabled: true,
    title: (item) => `CSR: ${item.name}`,
  };

  const [filters, setFilters] = useState({
    searchQuery: '',
    dateRange: { from: undefined, to: undefined } as DateRange,
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

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-xl font-semibold mb-5">Customer Service Representatives</h1>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-medium text-gray-800">CSRs</h1>
          <div className="flex gap-4">
            <Button 
              onClick={fetchCSRs} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#B2151B] hover:bg-red-700">Add New CSR</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Create New Customer Service Representative</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={csrData.name}
                        onChange={handleInputChange}
                        placeholder="Full Name" 
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email"
                        value={csrData.email}
                        onChange={handleInputChange}
                        placeholder="Email Address" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={csrData.phone}
                        onChange={handleInputChange}
                        placeholder="Phone Number" 
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        name="password"
                        type="password"
                        value={csrData.password}
                        onChange={handleInputChange}
                        placeholder="Password" 
                      />
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      name="address"
                      value={csrData.address}
                      onChange={handleInputChange}
                      placeholder="Address" 
                    />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="profileImage">Profile Image</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Input 
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="w-full"
                        />
                      </div>
                      {csrData.profileImage && (
                        <div className="mt-2 relative h-32 w-full border rounded overflow-hidden">
                          <Image 
                            src={URL.createObjectURL(csrData.profileImage)} 
                            alt="Preview" 
                            fill
                            style={{ objectFit: 'contain' }}
                          />
                          <button
                            type="button"
                            onClick={() => setCSRData(prev => ({ ...prev, profileImage: null }))}
                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl"
                            aria-label="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-[#B2151B] hover:bg-red-700" 
                      onClick={createCSR}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating..." : "Create CSR"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex justify-between items-center my-8">
          <FilterBar
            initialFilters={filters}
            onFilterChange={handleFilterChange}
            showSearch={true}
            showDateRange={true}
            showStatus={true}
            customerTypeOptions={[
              { value: 'all', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-500">Loading CSRs...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : csrs.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <p className="text-gray-500">No CSRs found</p>
          </div>
        ) : (
          <DataTable
            data={csrs}
            columns={csrColumns}
            tableType="customers"
            detailView={csrDetailConfig}
            actions={{ view: true, edit: true, delete: true }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default CSRManagementPage; 