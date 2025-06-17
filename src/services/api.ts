import { getAuthToken, saveAuthToken } from '../utils/auth';
import { UserLocation } from '../types/user';
import { OrderStatusEnum, getAllOrderStatuses } from '../types/orders';
import { CustomerFilters, CustomersResponse } from '../types/customers';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Define interface for the locations API response
export interface LocationsResponse {
  locations: UserLocation[];
}

export interface Category {
  id: number;
  squareId: string;
  name: string;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  squareId: string;
  name: string;
  description: string;
  imageUrl: string;
  imageUrl2: string | null;
  imageUrl3: string | null;
  categoryId: number;
  price: number;
  threshHold: number | null;
  isAvailable: boolean;
  portionCount: number | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

interface SignupData {
  phone: string;
  password: string;
  name: string;
}

interface VerifyOtpData {
  email?: string;
  phone?: string;
  token: string;
}

interface PaginatedResponse<T> {
  products: T[];
  pagination: {
    total: number;
    pageSize: number;
    currentPage: number;
  };
}

// Add this interface for API error responses
interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  imageUrl?: string;
  createdAt?: string;
}

interface AuthResponseWithUser {
  success: boolean;
  token: string;
  user: {
    id: string;
    // other user fields
  };
}

interface VerifyPaymentResponse {
  orderId: number;
  status: string;
  message: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  portions: string;
  price: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
    price: number;
  };
}

export interface DeliveryInfo {
  name: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  locationId?: string;
}

export interface Order {
  id: number;
  externalId: string;
  status: string;
  price: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  delivery: DeliveryInfo;
  receiptUrl?: string;
  shipingFee?: number;
  paystackReference?: string;
  rider?: {
    id: string;
    name: string;
    phone: string;
    status: string;
    currentLocation?: {
      latitude: number;
      longitude: number;
    };
  };
}

interface OrdersResponse {
  orders: Order[];
}

export interface OrderFilters {
  status?: string;
  orderBy?: string;
  sortBy?: string;
  search?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  pageSize?: number;
  pageNumber?: number;
}

// Add these interfaces
interface SendOtpData {
  email?: string;
  phone?: string;
}

export interface Customer {
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  country: string | null;
  createdAt: string;
  imageUrl?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Add interface for status count response
interface StatusCountItem {
  status: string;
  count: string;
}

// Pack price calculation interfaces
export interface PackPriceItem {
  portions: number;
  productId: number;
}

export interface PackPriceResponse {
  productId: string;
  name: string;
  price: number; // Price in kobo
}

// The API returns an array of PackPriceResponse items
export type PackPriceApiResponse = PackPriceResponse[];

// Delivery fee interface
export interface DeliveryFeeResponse {
  fee: number; // Delivery fee in kobo
}

export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = BASE_URL || 'https://folixx-delivery-app-e87bd2090a63.herokuapp.com';
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      const response = await fetch(url, options);
      
      // If the response is not ok, throw an error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying... ${retries} attempts left`);
        await delay(RETRY_DELAY);
        return this.fetchWithRetry<T>(url, options, retries - 1);
      }
      throw error;
    }
  }

  private async fetchApi<T>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    try {
      // Get auth token
      const token = getAuthToken();
      
      // Set headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> || {})
      };

      // Add token to headers if it exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${this.baseUrl}${endpoint}`;
      const fetchOptions = {
        ...options,
        headers,
      };

      const response = await this.fetchWithRetry<T>(url, fetchOptions);
      return { success: true, data: response };
    } catch (error) {
      console.error('API call failed:', error);
      
      // Enhance error message for network/connection issues
      if (error instanceof Error) {
        if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
          return { 
            success: false, 
            error: 'Unable to connect to the server. Please check your internet connection and try again.' 
          };
        }
        return { success: false, error: error.message };
      }
      
      return { 
        success: false, 
        error: 'An unexpected error occurred. Please try again later.' 
      };
    }
  }

  // Products
  async getProducts(params?: { 
    query?: string; 
    category?: string | null; 
    pageNumber?: number; 
    pageSize?: number; 
  }): Promise<PaginatedResponse<Product>> {
    // Build query string from params
    let queryString = '';
    if (params) {
      const queryParams = [];
      if (params.query) queryParams.push(`name=${encodeURIComponent(params.query)}`);
      if (params.category) queryParams.push(`category=${encodeURIComponent(params.category)}`);
      if (params.pageNumber) queryParams.push(`pageNumber=${params.pageNumber}`);
      if (params.pageSize) queryParams.push(`pageSize=${params.pageSize}`);
      if (queryParams.length) queryString = `?${queryParams.join('&')}`;
    }
    
    const response = await this.fetchApi<PaginatedResponse<Product>>(`/v1/products${queryString}`);
    return response.data || { products: [], pagination: { total: 0, pageSize: 10, currentPage: 1 } };
  }

  async getProduct(id: number): Promise<Product | null> {
    const response = await this.fetchApi<Product>(`/v1/products/${id}`);
    return response.data || null;
  }

  // Orders
  async createOrder(orderData: any): Promise<any> {
    return this.fetchApi('/v1/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async createGuestOrder(orderData: any): Promise<any> {
    return this.fetchApi('/v1/orders/guest', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Calculate pack price for order items
  async calculatePackPrice(items: Array<{
    portions: number;
    productId: number;
  }>): Promise<PackPriceApiResponse> {
    const response = await this.fetchWithRetry<PackPriceApiResponse>(
      `${this.baseUrl}/v1/orders/packs`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      }
    );
    
    // Handle both direct array response and wrapped response
    if (Array.isArray(response)) {
      return response;
    }
    
    // If the response is wrapped in a data property
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as any).data || [];
    }
    
    // Fallback to empty array
    return [];
  }

  async getDeliveryFee(params?: {
    lat?: number;
    long?: number;
    address?: string;
  }): Promise<number> {
    try {
      // Build query string from parameters
      let queryString = '';
      if (params) {
        const queryParams = [];
        if (params.lat !== undefined) queryParams.push(`lat=${params.lat}`);
        if (params.long !== undefined) queryParams.push(`long=${params.long}`);
        if (params.address) queryParams.push(`address=${encodeURIComponent(params.address)}`);
        if (queryParams.length) queryString = `?${queryParams.join('&')}`;
      }
      
      const response = await this.fetchWithRetry<DeliveryFeeResponse | { data: DeliveryFeeResponse }>(
        `${this.baseUrl}/v1/orders/delivery/fee${queryString}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Handle both direct response and wrapped response
      if (typeof response === 'object' && response !== null) {
        if ('fee' in response) {
          return response.fee;
        }
        // Check if it's wrapped in a data property
        if ('data' in response && typeof response.data === 'object' && response.data !== null && 'fee' in response.data) {
          return response.data.fee;
        }
      }
      
      // Fallback to 0 if no fee found
      return 0;
    } catch (error) {
      console.error('Error fetching delivery fee:', error);
      return 0; // Fallback to 0 on error
    }
  }

  async updateOrder(orderId: string, updateData: { 
    status: string; 
    paymentMethod?: {
      cardNumber: string;
      name: string;
    }
  }): Promise<any> {
    try {
      // Validate status value using the enum values
      const validStatuses = getAllOrderStatuses();
      
      if (updateData.status && !validStatuses.includes(updateData.status)) {
        throw new Error(`Invalid status value. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Call the PATCH endpoint
      const response = await this.fetchApi(`/v1/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });
      
      return response;
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to update order status');
      }
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    try {
      // Ensure we have authentication
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required to view order details');
      }

      // Make the API call with explicit auth header
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await this.fetchApi<Order>(`/v1/orders/${orderId}`, {
        method: 'GET',
        headers
      });
      
      return response.data || null;
    } catch (error) {
      const err = error as ApiErrorResponse;
      console.error('Error fetching order:', err);
      
      // Handle unauthorized errors specifically
      if (err.statusCode === 401) {
        throw new Error('You are not authorized to view this order. Please log in again.');
      }
      
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to fetch order');
      }
    }
  }

  async getOrderByExternalId(externalId: string): Promise<Order | null> {
    try {
      // Ensure we have authentication
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required to view order details');
      }

      // Make the API call with explicit auth header
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await this.fetchApi<Order>(`/v1/orders/external/${externalId}`, {
        method: 'GET',
        headers
      });
      
      return response.data || null;
    } catch (error) {
      const err = error as ApiErrorResponse;
      console.error('Error fetching order:', err);
      
      // Handle unauthorized errors specifically
      if (err.statusCode === 401) {
        throw new Error('You are not authorized to view this order. Please log in again.');
      }
      
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to fetch order');
      }
    }
  }

  async getOrders(filters?: OrderFilters): Promise<OrdersResponse | null> {
        const params = new URLSearchParams();
        
    if (filters?.status) params.append('status', filters.status);
    if (filters?.orderBy) params.append('orderBy', filters.orderBy);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters?.pageNumber) params.append('pageNumber', filters.pageNumber.toString());
        
    const response = await this.fetchApi<OrdersResponse>(`/v1/orders?${params.toString()}`);
    
    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to fetch orders');
    }
  }

  // Add method to get order status counts
  async getOrderStatusCounts(): Promise<Record<string, number> | null> {
    try {
      const response = await this.fetchApi<StatusCountItem[]>('/v1/orders/status/count');
      
      if (response.success && response.data) {
        const statusCounts: Record<string, number> = {};
        
        response.data.forEach(item => {
          let mappedStatus = item.status;
          
          // Map backend status names to frontend OrderStatusEnum values
          switch (item.status.toLowerCase()) {
            case 'received':
              mappedStatus = 'received';
              break;
            case 'confirmed':
              mappedStatus = 'confirmed';
              break;
            case 'failed':
              mappedStatus = 'failed';
              break;
            case 'preparing':
              mappedStatus = 'preparing';
              break;
            case 'ready':
              mappedStatus = 'ready';
              break;
            case 'assigned to a rider':
              mappedStatus = 'assigned to a rider';
              break;
            case 'in transit':
              mappedStatus = 'in transit';
              break;
            case 'arrived':
              mappedStatus = 'arrived';
              break;
            case 'completed': // Legacy mapping
              mappedStatus = 'arrived';
              break;
            default:
              mappedStatus = item.status;
              break;
          }
          
          statusCounts[mappedStatus] = parseInt(item.count);
        });
        
        return statusCounts;
      } else {
        throw new Error(response.error || 'Failed to fetch order status counts');
      }
    } catch (error) {
      console.error('Error fetching order status counts:', error);
      throw error;
    }
  }

  //Auth
  async signup(data: SignupData): Promise<ApiResponse<void>> {
    const response = await this.fetchApi<void>('/v1/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    if (!response.success && response.error) {
      const err = response.error as unknown as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        return { success: false, error: err.message.join(', ') };
      }
      return { success: false, error: err.message || 'Failed to create account' };
    }
    
    return response;
  }

  async sendOtp(data: SendOtpData): Promise<void> {
    try {
      await this.fetchApi('/v1/users/resend-otp', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to send OTP');
      }
    }
  }

  async verifyOtp(data: VerifyOtpData): Promise<ApiResponse<AuthResponseWithUser>> {
    const payload: { token: string; email?: string; phone?: string } = { token: data.token };
    if (data.email) {
      payload.email = data.email;
    } else if (data.phone) {
      payload.phone = data.phone;
    } else {
      return { success: false, error: 'Either email or phone must be provided for OTP verification.' };
    }

    const response = await this.fetchApi<AuthResponseWithUser>('/v1/users/verify-user', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    if (!response.success && response.error) {
      const err = response.error as unknown as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        return { success: false, error: err.message.join(', ') };
      }
      return { success: false, error: err.message || 'Failed to verify OTP' };
    }
    
    return response;
  }

  async login(data: { username: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    const response = await this.fetchApi<AuthResponse>('/v1/users/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log('Login response:', response);
    
    if (!response.success && response.error) {
      const err = response.error as unknown as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        return { success: false, error: err.message.join(', ') };
      }
      return { success: false, error: err.error || 'Failed to log in' };
    }
    
    return response;
  }

  async getUserDetails(userId: string): Promise<any> {
    try {
      const value = await this.fetchApi<any>(`/v1/users/${userId}`);
      console.log('User details response:', value);
      return value;
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to fetch user details');
      }
    }
  }

  async updateUserDetails(userId: string, data: any): Promise<any> {
    return await this.fetchApi<any>(`/v1/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(userId: string, data: any): Promise<any> {
    return await this.fetchApi<any>(`/v1/users/${userId}/change-password`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // User Locations
  async getUserLocations(): Promise<LocationsResponse | UserLocation[]> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      const response = await this.fetchApi<LocationsResponse>('/v1/users/locations/all');
      return response.data || [];
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to fetch locations');
      }
    }
  }

  async addUserLocation(locationData: {
    name?: string;
    address: string;
    isDefault: boolean;
    country?: string;
    state?: string;
    city?: string;
  }): Promise<UserLocation | null> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      const response = await this.fetchApi<UserLocation>('/v1/users/locations', {
        method: 'POST',
        body: JSON.stringify(locationData),
      });
      return response.data || null;
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to add location');
      }
    }
  }

  async deleteUserLocation(locationId: string): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      await this.fetchApi<void>(`/v1/users/locations/${locationId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to delete location');
      }
    }
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse | null> {
    try {
      const response = await this.fetchApi<VerifyPaymentResponse>(`/v1/orders/payments/verify?reference=${reference}`, {
        method: 'GET',
      });
      return response.data || null;
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to verify payment');
      }
    }
  }

  async setGuestPassword(data: { email: string; password: string; token: string }): Promise<any> {
    try {
      const response = await this.fetchApi<any>('/v1/users/set-guest-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to set password');
      }
    }
  }

  async getCustomers(filters?: CustomerFilters): Promise<CustomersResponse | null> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('Authentication required');
      }
      
      // Build query string from filters
      let queryParams = '';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.orderBy) params.append('orderBy', filters.orderBy);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.search) params.append('search', filters.search);
        if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.append('dateTo', filters.dateTo);
        if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
        if (filters.pageNumber) params.append('pageNumber', filters.pageNumber.toString());
        
        queryParams = `?${params.toString()}`;
      }
      
      const response = await this.fetchApi<CustomersResponse>(`/v1/users${queryParams}`);
      return response.data || null;
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to fetch customers');
      }
    }
  }

  // Get available riders
  async getAvailableRiders(): Promise<any[]> {
    try {
      const response = await this.fetchApi<{users: any[], pagination: any}>('/v1/users?role=rider');
      return response.data?.users || [];
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to fetch riders');
      }
    }
  }

  // Upload image
  async uploadImage(imageFile: File): Promise<string> {
    try {
      
      // Create FormData - this is how Postman sends files
      const formData = new FormData();
      formData.append('file', imageFile);
      
      // Make a direct fetch call without our wrapper
      const token = getAuthToken();
      
      const response = await fetch(`${this.baseUrl}/v1/uploads/images`, {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
      });

      if (!response.ok) {
        console.error("Upload failed:", response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Upload success, received data:", data);
      return data.imageUrl;
    } catch (error) {
      console.error("Upload error:", error);
      const err = error as Error;
      throw new Error(err.message || 'Failed to upload image');
    }
  }

  // Create CSR
  async createCSR(csrData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    imageUrl?: string;
    country?: string;
    state?: string;
    address?: string;
  }): Promise<any> {
    try {
      return await this.fetchApi('/v1/users/csr', {
        method: 'POST',
        body: JSON.stringify(csrData),
      });
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to create CSR');
      }
    }
  }

  // Add riders
  async createRider(riderData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    imageUrl?: string;
    country?: string;
    state?: string;
    address?: string;
    riderData: {
      vehicleType: string;
      licenseNumber: string;
      isExternalRider: boolean;
    }
  }): Promise<any> {
    try {
      return await this.fetchApi('/v1/users/rider', {
        method: 'POST',
        body: JSON.stringify(riderData),
      });
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to create rider');
      }
    }
  }

  // Get CSRs
  async getCSRs(): Promise<any[]> {
    try {
      const response = await this.fetchApi<{users: any[], pagination: any}>('/v1/users?role=csr');
      return response.data?.users || [];
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to fetch CSRs');
      }
    }
  }

  // Helper method to check if user is authenticated
  private isAuthenticated(): boolean {
    const token = getAuthToken();
    return !!token;
  }
  
  // Update product portions and threshold
  async updateProductInventory(productId: number, data: { portionCount?: number; threshHold?: number }): Promise<any> {
    try {
      return await this.fetchApi(`/v1/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to update product inventory');
      }
    }
  }

  async getCategories(): Promise<Category[]> {
    const response = await this.fetchApi<Category[]>(`/v1/products/categories`);
    console.log('Categories API response:', response);
    console.log('Categories response.data:', response.data);
    
    // Handle direct array response or wrapped response
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response as Category[];
    } else {
      return [];
    }
  }

  async updateRiderLocation(location: { latitude: number; longitude: number }): Promise<any> {
   
    try {
      return await this.fetchApi('/v1/users/locations/update-rider-location', {
        method: 'PATCH',
        body: JSON.stringify(location),
      });
    } catch (error) {
      const err = error as ApiErrorResponse;
      if (Array.isArray(err.message)) {
        throw new Error(err.message.join(', '));
      } else {
        throw new Error(err.message || 'Failed to update rider location');
      }
    }
  }

  async getActiveRiders() {
    const response = await this.fetchApi<{users: any[]}>('/v1/users/available/riders');
    return response.data || [];
  }

  async assignRiderToOrder(orderId: string, riderId: string) {
    const response = await this.fetchApi<any>(`/v1/orders/${orderId}/riders/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ riderId }),
    });
    return response.data;
  }

  async getUserById(userId: string) {
    const response = await this.fetchApi<any>(`/v1/users/${userId}`);
    return response;
  }

  async updateUserById(userId: string, data: any) {
    const response = await this.fetchApi<any>(`/v1/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response;
  }
}

export const apiService = ApiService.getInstance(); 