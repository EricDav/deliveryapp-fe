import ControlLayout from "@/components/control-layout";
import {DetailViewConfig, ColumnDefinition} from "@/types/data-table";
import { useState } from "react"
import FilterBar, { DateRange } from '@/components/filter-bar'
import { Input } from "@/components/ui/input"
import { useTheme } from "@/contexts/ThemeContext"
import { useProducts } from '@/hooks/useProducts';
import { DataTable } from "@/components/data-table"
import { withRoleGuard } from "@/components/auth/with-role-guard";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

const InventoryLayout = () => {
    const { theme } = useTheme();
    const { products, loading, error, mutate } = useProducts();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
   
    const [editingItem, setEditingItem] = useState<number | null>(null);
    const [tempValues, setTempValues] = useState<{ portionCount: number | null; threshHold: number | null } | null>(null);

    const handleStartEdit = (id: number, portionCount: number, threshHold: number) => {
        setEditingItem(id);
        setTempValues({ 
            portionCount: portionCount || 0, 
            threshHold: threshHold || 0 
        });
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setTempValues(null);
    };

    const handleUpdateTempValue = (field: 'portionCount' | 'threshHold', value: number | string) => {
        if (!tempValues) return;
        
        // Allow for empty values in the input fields
        const numValue = value === '' ? null : Number(value);
        setTempValues(prev => prev ? { ...prev, [field]: numValue } : null);
    };

    const handleSaveChanges = async (productId: number) => {
        if (!tempValues) return;
        
        try {
            setIsUpdating(true);
            
            // Handle null values properly
            const updateData = {
                portionCount: tempValues.portionCount === null ? 0 : tempValues.portionCount,
                threshHold: tempValues.threshHold === null ? 0 : tempValues.threshHold
            };
            
            // Call the API to update the product
            await apiService.updateProductInventory(productId, updateData);
            
            // Show success message
            toast({
                title: "Success",
                description: "Product inventory updated successfully",
                variant: "success"
            });
            
            // Update local data
            if (products) {
                const updatedProducts = products.map(product => 
                    product.id === productId 
                        ? { ...product, ...updateData }
                        : product
                );
                mutate(updatedProducts, false);
            }
            
            // Exit edit mode
            setEditingItem(null);
            setTempValues(null);
            
            // Refresh data
            mutate();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const inventoryDetailConfig: DetailViewConfig = {
        enabled: true,
        title: (item: any) => `Product: ${item.name}`,
        content: (item: any) => {
            const isEditing = editingItem === item.id;
            
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-medium text-sm text-muted-foreground">Category</h3>
                            <p>{item.category?.name}</p>
                        </div>
                        <div>
                            <h3 className="font-medium text-sm text-muted-foreground">Price</h3>
                            <p>₦ {(item.price / 100).toFixed(2)}</p>
                        </div>
                        <div>
                            <h3 className="font-medium text-sm text-muted-foreground">Portions</h3>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={tempValues?.portionCount ?? item.portionCount ?? ''}
                                    onChange={(e) => handleUpdateTempValue('portionCount', e.target.value)}
                                    className="w-24 mt-1"
                                />
                            ) : (
                                <p>{item.portionCount !== null ? item.portionCount : '-'}</p>
                            )}
                        </div>
                        <div>
                            <h3 className="font-medium text-sm text-muted-foreground">Threshold</h3>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    value={tempValues?.threshHold ?? item.threshHold ?? ''}
                                    onChange={(e) => handleUpdateTempValue('threshHold', e.target.value)}
                                    className="w-24 mt-1"
                                />
                            ) : (
                                <p>{item.threshHold !== null ? item.threshHold : '-'}</p>
                            )}
                        </div>
                        <div>
                            <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                                item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                        </div>
                        {item.description && (
                            <div className="col-span-2">
                                <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                                <p className="text-sm">{item.description}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4">
                        {isEditing ? (
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                    onClick={() => handleSaveChanges(item.id)}
                                    disabled={isUpdating}
                                >
                                    <Check size={16} className="mr-1" />
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                    onClick={handleCancelEdit}
                                    disabled={isUpdating}
                                >
                                    <X size={16} className="mr-1" />
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                size="sm" 
                                onClick={() => handleStartEdit(item.id, item.portionCount, item.threshHold)}
                                variant="outline"
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            >
                                Edit Inventory
                            </Button>
                        )}
                    </div>
                </div>
            );
        },
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

    // Custom action for the DataTable component
    const customInventoryActions = (info: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {editingItem === info.id ? (
                <>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        onClick={() => handleSaveChanges(info.id)}
                        disabled={isUpdating}
                    >
                        <Check size={16} />
                        {isUpdating ? 'Saving...' : 'Save'}
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline"
                        className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                    >
                        <X size={16} />
                        Cancel
                    </Button>
                </>
            ) : (
                <Button 
                    size="sm" 
                    onClick={() => handleStartEdit(info.id, info.portionCount, info.threshHold)}
                    variant="outline"
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                    Edit Inventory
                </Button>
            )}
        </div>
    );

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
            cell: (info) => (
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
            cell: (info) => (
                <span>{info.category?.name || "N/A"}</span>
            ),
        },
        {
            id: "price",
            header: "Price",
            accessorKey: "price",
            cell: (info) => (
                <span>₦ {(info.price / 100).toFixed(2)}</span>
            ),
        },
        {
            id: "portions",
            header: "Portions",
            accessorKey: "portionCount",
            cell: (info) => (
                <div className="flex items-center gap-2">
                    {editingItem === info.id ? (
                        <Input
                            type="number"
                            value={tempValues?.portionCount ?? info.portionCount ?? ''}
                            onChange={(e) => handleUpdateTempValue('portionCount', e.target.value)}
                        
                            className="w-24"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span>{info.portionCount !== null ? info.portionCount : '-'}</span>
                    )}
                </div>
            ),
        },
        {
            id: "threshold",
            header: "Threshold",
            accessorKey: "threshHold",
            cell: (info) => (
                <div className="flex items-center gap-2">
                    {editingItem === info.id ? (
                        <Input
                            type="number"
                            value={tempValues?.threshHold ?? info.threshHold ?? ''}
                            onChange={(e) => handleUpdateTempValue('threshHold', e.target.value)}
                            className="w-24"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span>{info.threshHold !== null ? info.threshHold : '-'}</span>
                    )}
                </div>
            ),
        },
        {
            id: "status",
            header: "Status",
            accessorKey: "isAvailable",
            cell: (info) => (
                <span className={`px-2 py-1 rounded-full text-xs ${
                    info.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {info.isAvailable ? 'Available' : 'Unavailable'}
                </span>
            ),
        },
    ];

    if (loading) {
        return (
            <ControlLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#B2151B]" />
                </div>
            </ControlLayout>
        );
    }

    if (error) {
        return (
            <ControlLayout>
                <div className="text-center py-10">
                    <p className="text-red-500">Failed to load inventory items. Please try again later.</p>
                </div>
            </ControlLayout>
        );
    }

    return (
        <ControlLayout>
            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.brand.textColor }}>
                {theme.brand.name} - Inventory Management
            </h2>
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
                    actions={{ view: false, edit: false, delete: false, custom: customInventoryActions }}
                />
            </div>
        </ControlLayout>
    );
};

// Protect this route to allow only users with the 'csr' role
export default withRoleGuard(InventoryLayout, 'csr', '/');
