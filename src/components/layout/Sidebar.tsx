import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  ShoppingCart, 
  Users, 
  Truck, 
  Package, 
  Settings, 
  BarChart2,
  Map,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, icon: Icon, label, active, onClick }: NavItemProps) => (
  <Link 
    to={to} 
    className={cn(
      "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
      active 
        ? "bg-blue-100 text-blue-700" 
        : "text-gray-700 hover:bg-gray-100"
    )}
    onClick={onClick}
  >
    <Icon className="h-5 w-5 mr-3" />
    <span>{label}</span>
  </Link>
);

export default function Sidebar() {
  const location = useLocation();
  const { hasRole, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  // Navigation items based on user role
  const getNavItems = () => {
    const items = [];
    items.push(
      { to: "/dashboard", icon: Home, label: "Dashboard", visible: true },
      { to: "/users", icon: Users, label: "Users", visible: hasRole('admin') || hasRole('ADMIN') },
      { to: "/sales-orders", icon: ShoppingCart, label: "Sales Orders", visible: hasRole('admin') || hasRole('ADMIN') || hasRole('sales') },
      { to: "/purchase-orders", icon: Package, label: "Purchase Orders", visible: hasRole('admin') || hasRole('ADMIN') || hasRole('delivery') },
      { to: "/loading", icon: Truck, label: "Loading Orders", visible: hasRole('admin') || hasRole('ADMIN') || hasRole('delivery') },
      { to: "/delivery-orders", icon: Truck, label: "Delivery Orders", visible: hasRole('admin') || hasRole('ADMIN') || hasRole('delivery') },
      { to: "/returns", icon: ShoppingCart, label: "Returns", visible: hasRole('admin') || hasRole('ADMIN') || hasRole('delivery') },
      { to: "/denomination", icon: ShoppingCart, label: "Cash Handover", visible: hasRole('admin') || hasRole('ADMIN') || hasRole('delivery') },
      { to: "/routes", icon: Map, label: "Routes Management", visible: hasRole('admin') || hasRole('ADMIN') },
      { to: "/sellers", icon: Users, label: "Sellers", visible: hasRole('admin') || hasRole('ADMIN') },
      { to: "/categories", icon: Map, label: "Categories", visible: hasRole('admin') || hasRole('ADMIN') },
      { to: "/products", icon: Package, label: "Products", visible: true },
      { to: "/price-plans", icon: Tag, label: "Price Plans", visible: true },
      { to: "/sales-report", icon: BarChart2, label: "Sales Report", visible: true },
      { to: "/delivery-summary-report", icon: BarChart2, label: "Delivery Summary", visible: hasRole('admin') || hasRole('ADMIN') },
      { to: "/distributors", icon: Users, label: "Distributors", visible: hasRole('admin') || hasRole('ADMIN') },
      { to: "/delivery-teams", icon: Users, label: "Delivery Team", visible: hasRole('admin') || hasRole('ADMIN') },
    );
    
    // Sales links
    if (hasRole('sales')) {
      items.push(
        { to: "/sales-dashboard", icon: ShoppingCart, label: "Sales Dashboard", visible: true },
        { to: "/sales-orders", icon: ShoppingCart, label: "Sales Orders", visible: true }
      );
    }
    
    // Delivery links
    if (hasRole('delivery')) {
      items.push(
        { to: "/purchase-orders", icon: Package, label: "Purchase Orders", visible: true },
        { to: "/loading", icon: Truck, label: "Loading Orders", visible: true },
        { to: "/delivery-orders", icon: Truck, label: "Delivery Orders", visible: true },
        { to: "/returns", icon: ShoppingCart, label: "Returns", visible: true },
        { to: "/broken", icon: Package, label: "Broken Items", visible: true },
        { to: "/denomination", icon: ShoppingCart, label: "Cash Handover", visible: true }
      );
    }
    
    // Settings accessible to all roles
    items.push({ to: "/settings", icon: Settings, label: "Settings", visible: true });
    
    return items.filter(item => item.visible);
  };
  
  return (
    <div className={cn(
      "bg-white shadow-md h-screen overflow-y-auto transition-all",
      collapsed ? "w-20" : "w-60"
    )}>
      <div className="p-4 border-b flex justify-between items-center">
        {!collapsed && <h2 className="text-xl font-bold text-blue-700">Bharat</h2>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>
      
      <div className="p-3">
        {getNavItems().map((item, index) => (
          <NavItem
            key={index}
            to={item.to}
            icon={item.icon}
            label={collapsed ? "" : item.label}
            active={isActive(item.to)}
          />
        ))}
      </div>
    </div>
  );
}
