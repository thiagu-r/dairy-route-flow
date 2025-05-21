import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import RoutesManagement from "./pages/RoutesManagement";
import Sellers from "./pages/Sellers";
import Products from "./pages/Products";
import PricePlans from "./pages/PricePlans";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import Categories from "./pages/Categories";
import Users from "./pages/Users";
import SalesOrders from "./pages/SalesOrders";
import PurchaseOrders from "./pages/PurchaseOrders";
import DeliveryOrders from "./pages/DeliveryOrders";
import LoadingOrders from "./pages/LoadingOrders";
import SalesDashboard from "./pages/SalesDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouterRoutes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/routes" element={<RoutesManagement />} />
            <Route path="/sellers" element={<Sellers />} />
            <Route path="/products" element={<Products />} />
            <Route path="/price-plans" element={<PricePlans />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/sales-dashboard" element={<SalesDashboard />} />
            <Route path="/sales-orders" element={<SalesOrders />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/loading" element={<LoadingOrders />} />
            <Route path="/delivery-orders" element={<DeliveryOrders />} />
            
            {/* Redirects */}
            <Route path="/" element={<Index />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
