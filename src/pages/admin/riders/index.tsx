import AdminLayout from "@/components/auth-layout";
import { DataTable } from "@/components/data-table";
import { DetailViewConfig, type ColumnDefinition } from "@/types/data-table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState, useEffect, useRef } from "react"
import FilterBar, { DateRange } from '@/components/filter-bar'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

// Define Rider interface
interface Rider {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  vehicleType: string;
  licenseNumber: string;
  totalDeliveries?: number;
  rating?: number;
  avatar?: string;
}
const RiderLayout = () => {
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [riders, setRiders] = useState<Rider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [riderData, setRiderData] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      vehicleType: "Electric Bike",
      licenseNumber: "",
      isExternal: false,
      riderCardImage: null as File | null,
    });

    const [date, setDate] = useState<{
        from: Date | undefined
        to: Date | undefined
      }>({
        from: new Date("2024-09-12"),
        to: new Date("2024-10-28"),
      })
    
      const [customerType, setCustomerType] = useState("all")
      const [status, setStatus] = useState("all")
      const [searchQuery, setSearchQuery] = useState("")
    
    // Fetch riders on component mount
    useEffect(() => {
      fetchRiders();
    }, []);

    const fetchRiders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ridersData = await apiService.getAvailableRiders();
        
        // Map API data to the format needed for display
        const formattedRiders = ridersData.map(rider => ({
          id: rider.id,
          name: rider.name || 'Unknown',
          email: rider.email || 'No email',
          phone: rider.phone || 'No phone',
          status: rider.isActive ? 'Online' : 'Offline',
          vehicleType: rider.riderData?.vehicleType || 'Not specified',
          licenseNumber: rider.riderData?.licenseNumber || 'Not available',
          totalDeliveries: rider.totalDeliveries || 0,
          rating: rider.rating || 0,
          avatar: rider.imageUrl || '/placeholder.svg?height=60&width=60'
        }));
        
        setRiders(formattedRiders);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch riders';
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
      
  const customerDetailConfig: DetailViewConfig = {
    enabled: true,
    title: (item) => `Rider: ${item.name}`,
  };

  const riderColumns: ColumnDefinition[] = [
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
      id: "vehicleType",
      header: "Vehicle",
      accessorKey: "vehicleType",
    },
    {
      id: "totalDeliveries",
      header: "Deliveries",
      accessorKey: "totalDeliveries",
    },
    {
      id: "rating",
      header: "Rating",
      accessorKey: "rating",
      cell: (info) => (
        <div className="flex items-center">
          <span className="font-medium">{info.rating}</span>
          <span className="text-yellow-500 ml-1">★</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: (info) => {
        const statusStyles = {
          Online: "bg-green-100 text-green-800",
          Offline: "bg-gray-100 text-gray-800",
        }
        const style = statusStyles[info.status as keyof typeof statusStyles] || "bg-gray-100 text-gray-800"
  
        return <Badge className={style}>{info.status}</Badge>
      },
    },
  ]

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRiderData(prev => ({ ...prev, [name]: value }));
  };

  const handleVehicleTypeChange = (value: string) => {
    setRiderData(prev => ({ ...prev, vehicleType: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setRiderData(prev => ({ ...prev, isExternal: checked }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setRiderData(prev => ({ ...prev, riderCardImage: file }));
  };

  const createRider = async () => {
    // Validate form
    if (!riderData.name || !riderData.email || !riderData.phone || !riderData.password || !riderData.licenseNumber) {
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
      if (riderData.riderCardImage) {
        imageUrl = await apiService.uploadImage(riderData.riderCardImage);
      }
      
      // Then create the rider with the correct structure
      await apiService.createRider({
        name: riderData.name,
        email: riderData.email,
        phone: riderData.phone,
        password: riderData.password,
        imageUrl: imageUrl,
        riderData: {
          vehicleType: riderData.vehicleType,
          licenseNumber: riderData.licenseNumber,
          isExternalRider: riderData.isExternal
        }
      });
      
      toast({
        title: "Success",
        description: "Rider created successfully."
      });
      setIsDialogOpen(false);
      // Reset form
      setRiderData({
        name: "",
        email: "",
        phone: "",
        password: "",
        vehicleType: "Electric Bike",
        licenseNumber: "",
        isExternal: false,
        riderCardImage: null,
      });
      // Refresh riders list
      fetchRiders();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create rider"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-xl font-semibold mb-5">Rider Management</h1>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-medium text-gray-800">Riders</h1>
        <div className="flex gap-4">
          <Button 
            onClick={fetchRiders} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#B2151B] hover:bg-red-700">Add New Rider</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Rider</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      name="name"
                      value={riderData.name}
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
                      value={riderData.email}
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
                      value={riderData.phone}
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
                      value={riderData.password}
                      onChange={handleInputChange}
                      placeholder="Password" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="vehicleType">Vehicle Type</Label>
                    <Select 
                      value={riderData.vehicleType} 
                      onValueChange={handleVehicleTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Vehicle Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ICE Bike">ICE Bike</SelectItem>
                        <SelectItem value="Electric Bike">Electric Bike</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input 
                      id="licenseNumber" 
                      name="licenseNumber"
                      value={riderData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="License Number" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isExternal" 
                      checked={riderData.isExternal}
                      onCheckedChange={handleCheckboxChange}
                    />
                    <Label 
                      htmlFor="isExternal" 
                      className="cursor-pointer"
                    >
                      External Rider
                    </Label>
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="riderCardImage">Rider Card Image</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="riderCardImage" 
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-gray-500">
                        {riderData.riderCardImage ? riderData.riderCardImage.name : "No file chosen"}
                      </span>
                    </div>
                    {riderData.riderCardImage && (
                      <div className="mt-2 relative w-full h-20 rounded overflow-hidden">
                        <Image 
                          src={URL.createObjectURL(riderData.riderCardImage)} 
                          alt="Preview" 
                          fill
                          style={{ objectFit: 'contain' }}
                        />
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
                    onClick={createRider}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Rider"}
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
          showCustomerType={true}
          showStatus={true}
          customerTypeOptions={[
            { value: 'all', label: 'All Types' },
            { value: 'premium', label: 'Premium Users' },
          ]}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-500">Loading riders...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      ) : riders.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">No riders found</p>
        </div>
      ) : (
        <DataTable
          data={riders}
          columns={riderColumns}
          tableType="riders"
          detailView={customerDetailConfig}
          actions={{ view: true, edit: true, delete: true }}
        />
      )}
    </div>
   
    </AdminLayout>
  );
};

export default RiderLayout;