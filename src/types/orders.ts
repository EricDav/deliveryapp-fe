/**
 * Standardized order status enum used throughout the application
 * MUST match the backend OrderStatusEnum exactly
 */
export enum OrderStatusEnum {
  RECEIVED = 'received',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  PREPARING = 'preparing',
  READY = 'ready',
  ASSIGNED_TO_RIDER = 'assigned to a rider',
  IN_TRANSIT = 'in transit',
  ARRIVED = 'arrived',
}

/**
 * Role-based status visibility configuration
 */
export const ROLE_STATUS_VISIBILITY = {
  customer: [
    OrderStatusEnum.RECEIVED,
    OrderStatusEnum.CONFIRMED,
    OrderStatusEnum.READY,
    OrderStatusEnum.IN_TRANSIT,
    OrderStatusEnum.ARRIVED,
  ],
  rider: [
    OrderStatusEnum.READY,
    OrderStatusEnum.ASSIGNED_TO_RIDER,
    OrderStatusEnum.IN_TRANSIT,
    OrderStatusEnum.ARRIVED,
  ],
  admin: Object.values(OrderStatusEnum), // Can see all statuses
  csr: Object.values(OrderStatusEnum),   // Can see all statuses
};

/**
 * Get user-friendly label and color for a status
 */
export const getStatusDetails = (status: string): { label: string, color: string } => {
  const statusMap: Record<string, { label: string, color: string }> = {
    [OrderStatusEnum.RECEIVED]: { label: 'Order Received', color: 'bg-yellow-100 text-yellow-800' },
    [OrderStatusEnum.CONFIRMED]: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    [OrderStatusEnum.FAILED]: { label: 'Failed', color: 'bg-red-100 text-red-800' },
    [OrderStatusEnum.PREPARING]: { label: 'Preparing', color: 'bg-orange-100 text-orange-800' },
    [OrderStatusEnum.READY]: { label: 'Ready for Pickup', color: 'bg-purple-100 text-purple-800' },
    [OrderStatusEnum.ASSIGNED_TO_RIDER]: { label: 'Assigned to Rider', color: 'bg-indigo-100 text-indigo-800' },
    [OrderStatusEnum.IN_TRANSIT]: { label: 'In Transit', color: 'bg-cyan-100 text-cyan-800' },
    [OrderStatusEnum.ARRIVED]: { label: 'Delivered', color: 'bg-green-100 text-green-800' },
  };

  return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};

/**
 * Get customer-friendly label for timeline display
 */
export const getCustomerTimelineLabel = (status: string): string => {
  const customerLabels: Record<string, string> = {
    [OrderStatusEnum.RECEIVED]: 'Order Placed',
    [OrderStatusEnum.CONFIRMED]: 'Order Confirmed',
    [OrderStatusEnum.READY]: 'Ready for Delivery',
    [OrderStatusEnum.IN_TRANSIT]: 'On the Way',
    [OrderStatusEnum.ARRIVED]: 'Delivered',
  };

  return customerLabels[status] || status;
};

/**
 * Get array of all possible status values
 */
export const getAllOrderStatuses = (): string[] => {
  return Object.values(OrderStatusEnum);
};

/**
 * Get statuses visible to a specific role
 */
export const getStatusesByRole = (role: string): string[] => {
  const normalizedRole = role.toLowerCase();
  return ROLE_STATUS_VISIBILITY[normalizedRole as keyof typeof ROLE_STATUS_VISIBILITY] || [];
};

/**
 * Check if a role can see a specific status
 */
export const canRoleSeeStatus = (role: string, status: string): boolean => {
  const allowedStatuses = getStatusesByRole(role);
  return allowedStatuses.includes(status);
};

/**
 * Get next possible statuses based on current status and role
 */
export const getNextStatuses = (currentStatus: string, role: string): string[] => {
  const roleStatuses = getStatusesByRole(role);
  
  // Define status progression rules
  const statusProgression: Record<string, string[]> = {
    [OrderStatusEnum.RECEIVED]: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.FAILED],
    [OrderStatusEnum.CONFIRMED]: [OrderStatusEnum.PREPARING, OrderStatusEnum.FAILED],
    [OrderStatusEnum.PREPARING]: [OrderStatusEnum.READY],
    [OrderStatusEnum.READY]: [OrderStatusEnum.ASSIGNED_TO_RIDER],
    [OrderStatusEnum.ASSIGNED_TO_RIDER]: [OrderStatusEnum.IN_TRANSIT],
    [OrderStatusEnum.IN_TRANSIT]: [OrderStatusEnum.ARRIVED],
    [OrderStatusEnum.ARRIVED]: [], // Final status
    [OrderStatusEnum.FAILED]: [], // Final status
  };

  const nextStatuses = statusProgression[currentStatus] || [];
  
  // Filter by role permissions
  return nextStatuses.filter(status => roleStatuses.includes(status));
}; 