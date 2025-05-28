import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Package, DollarSign } from 'lucide-react';
// import { DashboardStats } from '@/lib/types';

// Placeholder for Order Status Heatmap component
import OrderStatusHeatmap from './OrderStatusHeatmap';
import BalanceAgingReport from './BalanceAgingReport';
import ProductMovementChart from './ProductMovementChart';
import TopSellers from './TopSellers';
import RoutePerformance from './RoutePerformance';

export default function AdminDashboard() {
  const [snapshot, setSnapshot] = useState<null | {
    total_orders: number;
    delivered_orders: number;
    pending_orders: number;
    total_sales: string;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/admin/snapshot/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch snapshot');
        const data = await res.json();
        setSnapshot(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load snapshot');
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshot();
  }, []);

  if (loading) {
    return <div className="text-center p-6">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="text-center p-6 text-red-500">{error}</div>;
  }

  if (!snapshot) {
    return <div className="text-center p-6">No snapshot data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Today's Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Orders" 
          value={snapshot.total_orders.toString()} 
          description="Total orders today"
          icon={<ShoppingCart className="h-5 w-5 text-blue-600" />} 
        />
        <StatCard 
          title="Delivered Orders" 
          value={snapshot.delivered_orders.toString()} 
          description="Orders delivered today"
          icon={<Package className="h-5 w-5 text-green-600" />} 
        />
        <StatCard 
          title="Pending Orders" 
          value={snapshot.pending_orders.toString()} 
          description="Orders pending delivery"
          icon={<Package className="h-5 w-5 text-yellow-600" />} 
        />
        <StatCard 
          title="Total Sales" 
          value={`₹${Number(snapshot.total_sales).toLocaleString()}`} 
          description="Total sales value today"
          icon={<DollarSign className="h-5 w-5 text-blue-600" />} 
        />
      </div>

      {/* Order Status Heatmap */}
      <OrderStatusHeatmap />

      {/* Balance Aging Report */}
      <BalanceAgingReport />

      {/* Product Movement Chart */}
      <ProductMovementChart />

      {/* Top Sellers */}
      <TopSellers />

      {/* Route Performance */}
      <RoutePerformance />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}
