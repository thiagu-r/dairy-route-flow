
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, ShoppingCart, Package, DollarSign } from 'lucide-react';
import { DashboardStats } from '@/lib/types';

// In a real app, this would come from your API
const mockDashboardStats: DashboardStats = {
  totalSales: 45280,
  totalReturns: 1250,
  totalBreakages: 320,
  cashCollected: 43710,
  routeStats: [
    { route_id: '1', route_name: 'North Area', sales: 15400, returns: 450 },
    { route_id: '2', route_name: 'South Area', sales: 12300, returns: 320 },
    { route_id: '3', route_name: 'East Area', sales: 8950, returns: 210 },
    { route_id: '4', route_name: 'West Area', sales: 8630, returns: 270 },
  ]
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats(mockDashboardStats);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return <div className="text-center p-6">Loading dashboard data...</div>;
  }

  if (!stats) {
    return <div className="text-center p-6">Failed to load dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Sales" 
          value={`$${stats.totalSales.toLocaleString()}`} 
          description="Total value of sold products"
          icon={<ShoppingCart className="h-5 w-5 text-blue-600" />}
        />
        <StatCard 
          title="Returns" 
          value={`$${stats.totalReturns.toLocaleString()}`} 
          description="Value of returned products"
          icon={<Package className="h-5 w-5 text-yellow-600" />}
        />
        <StatCard 
          title="Breakages" 
          value={`$${stats.totalBreakages.toLocaleString()}`} 
          description="Value of broken inventory"
          icon={<Package className="h-5 w-5 text-red-600" />}
        />
        <StatCard 
          title="Cash Collected" 
          value={`$${stats.cashCollected.toLocaleString()}`} 
          description="Total cash handovers"
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Performance</CardTitle>
          <CardDescription>Sales and returns by route area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.routeStats.map((route) => (
              <div key={route.route_id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{route.route_name}</p>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <ShoppingCart className="h-3.5 w-3.5 mr-1 text-blue-600" />
                      <span>${route.sales.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Package className="h-3.5 w-3.5 mr-1 text-yellow-600" />
                      <span>${route.returns.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-100 h-2 w-32 rounded-full">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(route.sales / 20000) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
