import { useMemo } from 'react';
import { 
  OrderStatusEnum, 
  getStatusDetails, 
  getStatusesByRole, 
  getNextStatuses,
  canRoleSeeStatus,
  getCustomerTimelineLabel
} from '@/types/orders';
import { getUserRole } from '@/utils/auth';

export interface UseOrderStatusReturn {
  userRole: string;
  visibleStatuses: string[];
  getNextPossibleStatuses: (currentStatus: string) => string[];
  canSeeStatus: (status: string) => boolean;
  getStatusLabel: (status: string, isCustomer?: boolean) => string;
  getStatusColor: (status: string) => string;
  isStatusCompleted: (targetStatus: string, currentStatus: string) => boolean;
}

export function useOrderStatus(): UseOrderStatusReturn {
  const userRole = getUserRole() || 'customer';
  
  const visibleStatuses = useMemo(() => {
    return getStatusesByRole(userRole);
  }, [userRole]);

  const getNextPossibleStatuses = (currentStatus: string): string[] => {
    return getNextStatuses(currentStatus, userRole);
  };

  const canSeeStatus = (status: string): boolean => {
    return canRoleSeeStatus(userRole, status);
  };

  const getStatusLabel = (status: string, isCustomer: boolean = false): string => {
    if (isCustomer || userRole === 'customer') {
      return getCustomerTimelineLabel(status);
    }
    return getStatusDetails(status).label;
  };

  const getStatusColor = (status: string): string => {
    return getStatusDetails(status).color;
  };

  const isStatusCompleted = (targetStatus: string, currentStatus: string): boolean => {
    // Define the order of statuses for completion checking
    const statusOrder = [
      OrderStatusEnum.RECEIVED,
      OrderStatusEnum.CONFIRMED,
      OrderStatusEnum.PREPARING,
      OrderStatusEnum.READY,
      OrderStatusEnum.ASSIGNED_TO_RIDER,
      OrderStatusEnum.IN_TRANSIT,
      OrderStatusEnum.ARRIVED
    ];

    const currentIndex = statusOrder.indexOf(currentStatus as OrderStatusEnum);
    const targetIndex = statusOrder.indexOf(targetStatus as OrderStatusEnum);

    return currentIndex >= targetIndex && currentIndex !== -1 && targetIndex !== -1;
  };

  return {
    userRole,
    visibleStatuses,
    getNextPossibleStatuses,
    canSeeStatus,
    getStatusLabel,
    getStatusColor,
    isStatusCompleted,
  };
} 