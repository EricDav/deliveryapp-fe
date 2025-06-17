import { io, Socket } from 'socket.io-client';
import { Product } from './api';

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'https://folixx-delivery-app-e87bd2090a63.herokuapp.com';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    
    if (this.socket) {
        return;
    }

    this.socket = io(this.baseUrl, {
        autoConnect: false, // Important: we'll connect manually
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        timeout: 10000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        setTimeout(() => this.connect(), this.reconnectDelay);
      }
    });

    this.socket.on('connect_error', (error) => {

      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {

        this.socket?.disconnect();
      }
    });

    // Handle authentication errors
    this.socket.on('error', (error: any) => {
      if (error.type === 'unauthorized') {
        this.socket?.disconnect();
      }
    });

    // Add this to log ALL incoming events
    this.socket.onAny((eventName, ...args) => {
       
    });
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public async connect(): Promise<void> {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise((resolve) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket?.connect();
      
      this.socket?.once('connect', () => {
        resolve();
      });
    });

    return this.connectionPromise;
  }

  public disconnect(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  public subscribeToProductUpdates(callback: (product: Product) => void): () => void {
    if (!this.socket) return () => {};
    
    const handler = (data: Product) => {
      callback(data);
    };

    this.socket.on('productUpdate', handler);
    return () => this.socket?.off('productUpdate', handler);
  }

  public async subscribeToOrderUpdates(orderId: string, callback: (orderData: any) => void): Promise<() => void> {
    // Wait for connection before subscribing
    await this.connect();

    if (!this.socket) {
      return () => {};
    }
    
    const eventName = `orderUpdate-${orderId}`;


    // Remove any existing listeners for this event
    this.socket.removeAllListeners(eventName);

    const handler = (data: any) => {
   

      try {
        // Ensure we're passing the data in the correct format
        if (Array.isArray(data)) {
          callback(data);
        } else {
          callback([data]); // Wrap single updates in an array for consistency
        }
      } catch (error) {
      }
    };

    // Add the new listener
    this.socket.on(eventName, handler);
    
    // Verify the listener was added
 

    return () => {
    
      this.socket?.removeAllListeners(eventName);
    };
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }
}

export const websocketService = WebSocketService.getInstance();
