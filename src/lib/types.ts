
// Type definitions for the Dairy Factory Management System

// User roles
export type UserRole = 'admin' | 'sales' | 'delivery';

// User
export interface User {
  id: string;
  name: string;
  role: UserRole;
  token?: string;
}

// Product
export interface Product {
  id: string;
  name: string;
  unit: string;
}

// Route (Area)
export interface Route {
  id: string;
  name: string;
}

// Seller (Vendor)
export interface Seller {
  id: string;
  name: string;
  route_id: string;
  is_public: boolean;
  balance?: number;
}

// Price Plan
export interface PricePlan {
  id: string;
  seller_id: string | null; // null for general price plan
  product_id: string;
  price: number;
}

// Sales Order
export interface SalesOrder {
  id: string;
  date: string;
  seller_id: string;
  route_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_by: string;
  total_amount: number;
  items: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
}

// Purchase Order
export interface PurchaseOrder {
  id: string;
  date: string;
  route_id: string;
  status: 'pending' | 'approved' | 'cancelled';
  created_by: string;
  approved_by?: string;
  total_amount: number;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
}

// Loading Order
export interface LoadingOrder {
  id: string;
  date: string;
  purchase_order_id: string;
  status: 'pending' | 'completed';
  created_by: string;
  items: LoadingOrderItem[];
}

export interface LoadingOrderItem {
  id: string;
  loading_order_id: string;
  product_id: string;
  quantity: number;
  crates: number;
}

// Delivery Order
export interface DeliveryOrder {
  id: string;
  date: string;
  seller_id: string;
  sales_order_id: string;
  status: 'pending' | 'completed';
  created_by: string;
  amount_paid: number;
  balance: number;
  items: DeliveryOrderItem[];
}

export interface DeliveryOrderItem {
  id: string;
  delivery_order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total: number;
}

// Return Order
export interface ReturnOrder {
  id: string;
  date: string;
  seller_id: string;
  created_by: string;
  items: ReturnOrderItem[];
}

export interface ReturnOrderItem {
  id: string;
  return_order_id: string;
  product_id: string;
  quantity: number;
}

// Broken Order
export interface BrokenOrder {
  id: string;
  date: string;
  route_id: string;
  created_by: string;
  items: BrokenOrderItem[];
}

export interface BrokenOrderItem {
  id: string;
  broken_order_id: string;
  product_id: string;
  quantity: number;
}

// Denomination (Cash Handover)
export interface Denomination {
  id: string;
  route_id: string;
  date: string;
  amount: number;
  incentives: number;
  created_by: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalSales: number;
  totalReturns: number;
  totalBreakages: number;
  cashCollected: number;
  routeStats: Array<{
    route_id: string;
    route_name: string;
    sales: number;
    returns: number;
  }>;
}
