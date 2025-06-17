"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Pencil, Trash2, Eye, UserPlus, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTableProps, DetailViewConfig, TableType } from "@/types/data-table"


export function DataTable({
  data,
  columns,
  tableType = "default",
  detailView = { enabled: false },
  isControl = false,
  actions = { view: false, edit: true, delete: true },
  onView,
  onEdit,
  onDelete,
  onRowClick,
  onAssignOrder,
  onChangeOrderStatus,
}: DataTableProps) {
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedRider, setSelectedRider] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")

  // Mock riders data - in a real app, this would come from props or an API
  const riders = [
    { id: "rider1", name: "John Doe" },
    { id: "rider2", name: "Jane Smith" },
    { id: "rider3", name: "Mike Johnson" },
  ]

  // Mock order statuses - in a real app, this would come from props or an API
  const orderStatuses = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ]

  const handleItemClick = (item: any) => {
    if (onRowClick) {
      onRowClick(item)
      return
    }

    if (detailView.enabled) {
      setSelectedItem(item)
      setIsModalOpen(true)
    }
  }

  const handleViewClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    if (onView) {
      onView(item)
    } else if (detailView.enabled) {
      setSelectedItem(item)
      setIsModalOpen(true)
    }
  }

  const handleEditClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    if (onEdit) {
      onEdit(item)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(item)
    }
  }

  const handleAssignClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    setSelectedItem(item)
    setSelectedRider("")
    setIsAssignModalOpen(true)
  }

  const handleStatusClick = (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    setSelectedItem(item)
    setSelectedStatus(item.orderStatus || "pending")
    setIsStatusModalOpen(true)
  }

  const handleAssignSubmit = () => {
    if (onAssignOrder && selectedItem && selectedRider) {
      onAssignOrder(selectedItem, selectedRider)
    }
    setIsAssignModalOpen(false)
  }

  const handleStatusSubmit = () => {
    if (onChangeOrderStatus && selectedItem && selectedStatus) {
      onChangeOrderStatus(selectedItem, selectedStatus)
    }
    setIsStatusModalOpen(false)
  }

  const getDetailTitle = () => {
    if (!selectedItem) return "";
    if (detailView.title) return detailView.title(selectedItem);

    const titles: Record<TableType, string> = {
      orders: `Order #${selectedItem[detailView.idField || "orderId"]}`,
      customers: `Customer: ${selectedItem.name || selectedItem.fullName}`,
      riders: `Rider: ${selectedItem.name || selectedItem.fullName}`,
      inventory: `Product: ${selectedItem.name}`,
      default: `Details #${selectedItem.id || ""}`
    };

    return titles[tableType || 'default'];
  };

  return (
    <>
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column) => (
                <TableHead key={column.id} className="font-medium text-base py-4 px-6">
                  {column.header}
                </TableHead>
              ))}
              {(actions.view || actions.edit || actions.delete || actions.custom || isControl) && (
                <TableHead className="text-right py-4 px-6">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-32 text-center">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={`${detailView.enabled || onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} ${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  }`}
                  onClick={() => handleItemClick(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} className="py-4 px-6">
                      {column.cell ? column.cell(row) : row[column.accessorKey]}
                    </TableCell>
                  ))}
                  {(actions.view || actions.edit || actions.delete || actions.custom || isControl) && (
                    <TableCell className="text-right py-4 px-6">
                      <div className="flex justify-end gap-3">
                        {isControl ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="h-9 w-9 text-muted-foreground">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="h-4 w-4"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                        
                              <DropdownMenuItem onClick={(e:any) => handleStatusClick(e, row)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Change Status
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <>
                            {actions.view && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => handleViewClick(e, row)}
                                className="h-9 w-9 text-muted-foreground"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                            )}
                            {actions.edit && onEdit && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => handleEditClick(e, row)}
                                className="h-9 w-9 text-muted-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}
                            {actions.delete && onDelete && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e) => handleDeleteClick(e, row)}
                                className="h-9 w-9 text-destructive border-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            )}
                            {actions.custom && actions.custom(row)}
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail View Modal */}
      {detailView.enabled && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{getDetailTitle()}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedItem && (
                <>
                  {detailView.content ? (
                    detailView.content(selectedItem)
                  ) : (
                    // Default content based on table type
                    <DefaultDetailContent item={selectedItem} tableType={tableType} />
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Assign Order Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Order to Rider</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedItem && (
              <>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Order #{selectedItem.orderId || selectedItem.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.customerInformation || selectedItem.customer || "Customer information"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rider-select">Select Rider</Label>
                  <Select value={selectedRider} onValueChange={setSelectedRider}>
                    <SelectTrigger id="rider-select">
                      <SelectValue placeholder="Select a rider" />
                    </SelectTrigger>
                    <SelectContent>
          {riders.map(({ id, name }) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignSubmit} disabled={!selectedRider}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Order Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Order Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedItem && (
              <>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-1">Order #{selectedItem.orderId || selectedItem.id}</p>
                  <p className="text-sm text-muted-foreground">
                    Current Status: {selectedItem.orderStatus || "Pending"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status-select">New Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger id="status-select">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusSubmit} disabled={!selectedStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function DefaultDetailContent({ item, tableType }: { item: any; tableType: TableType }) {
  if (tableType === "orders") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Order Date</h3>
            <p>{item.orderDate}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
            <p>{item.orderStatus}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Total Amount</h3>
            <p>{item.totalAmount}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-2">Customer Information</h3>
          <div className="bg-muted p-3 rounded-md">
            <p>{item.customerInformation}</p>
          </div>
        </div>

        {item.items && (
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Order Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.items.map((orderItem: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{orderItem.name}</TableCell>
                    <TableCell>{orderItem.quantity}</TableCell>
                    <TableCell>{orderItem.price}</TableCell>
                    <TableCell className="text-right">{orderItem.subtotal}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    )
  }

  if (tableType === "customers") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          {item.imageUrl && (
            <div className="h-16 w-16 rounded-full overflow-hidden">
              <img
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.name || "Customer"}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{item.name || item.fullName}</h2>
            <p className="text-muted-foreground">{item.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Phone</h3>
            <p>{item.phone}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Customer Since</h3>
            <p>{item.joinDate}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Total Orders</h3>
            <p>{item.totalOrders}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Total Spent</h3>
            <p>{item.totalSpent}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm text-muted-foreground mb-2">Address</h3>
          <div className="bg-muted p-3 rounded-md">
            <p>{item.address}</p>
          </div>
        </div>
      </div>
    )
  }

  if (tableType === "riders") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          {item.imageUrl && (
            <div className="h-16 w-16 rounded-full overflow-hidden">
              <img
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.name || "Rider"}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{item.name || item.fullName}</h2>
            <p className="text-muted-foreground">{item.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Phone</h3>
            <p>{item.phone}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
            <p>{item.status}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Vehicle Type</h3>
            <p>{item.vehicleType}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">License Number</h3>
            <p>{item.licenseNumber}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Total Deliveries</h3>
            <p>{item.totalDeliveries}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Rating</h3>
            <p>{item.rating} / 5</p>
          </div>
        </div>
      </div>
    )
  }

  if (tableType === "inventory") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          {item.imageUrl && (
            <div className="h-24 w-24 rounded-md overflow-hidden">
              <img
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.name}
                width={96}
                height={96}
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p className="text-muted-foreground">{item.category}</p>
            <p className="font-medium text-lg">{item.price}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">SKU</h3>
            <p>{item.sku || "N/A"}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Stock</h3>
            <p>{item.stock || "N/A"}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
            <p>{item.status ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Recommended</h3>
            <p>{item.recommended ? "Yes" : "No"}</p>
          </div>
        </div>

        {item.description && (
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-2">Description</h3>
            <div className="bg-muted p-3 rounded-md">
              <p>{item.description}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Generic fallback for other table types
  return (
    <div className="space-y-4">
      {Object.entries(item).map(([key, value]) => (
        <div key={key}>
          <h3 className="font-medium text-sm text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}</h3>
          <p>{String(value)}</p>
        </div>
      ))}
    </div>
  )
}

