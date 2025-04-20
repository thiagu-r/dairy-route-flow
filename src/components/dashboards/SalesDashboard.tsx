
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Calendar, User, List } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SalesStats {
  ordersCreated: number;
  pendingOrders: number;
  completedOrders: number;
  sellersCalled: number;
  upcomingDeliveries: Array<{
    id: string;
    date: string;
    route: string;
    sellers: number;
  }>;
  recentSellers: Array<{
    id: string;
    name: string;
    route: string;
    lastOrder: string;
  }>;
}

// Mock data
const mockSalesStats: SalesStats = {
  ordersCreated: 28,
  pendingOrders: 12,
  completedOrders: 16,
  sellersCalled: 34,
  upcomingDeliveries: [
    { id: '1', date: '2023-05-15', route: 'North Area', sellers: 8 },
    { id: '2', date: '2023-05-16', route: 'South Area', sellers: 12 },
    { id: '3', date: '2023-05-17', route: 'East Area', sellers: 6 },
  ],
  recentSellers: [
    { id: '1', name: 'Metro Grocery', route: 'North Area', lastOrder: '2023-05-14' },
    { id: '2', name: 'City Mart', route: 'South Area', lastOrder: '2023-05-13' },
    { id: '3', name: 'Daily Fresh', route: 'West Area', lastOrder: '2023-05-12' },
    { id: '4', name: 'Green Valley', route: 'East Area', lastOrder: '2023-05-11' },
  ]
};

export default function SalesDashboard() {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats(mockSalesStats);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Sales Dashboard</h2>
          <p className="text-gray-500">Manage your sales activities</p>
        </div>
        <Button asChild className="bg-blue-700 hover:bg-blue-800">
          <Link to="/sales-orders/new">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Create Sales Order
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Orders Created" 
          value={stats.ordersCreated.toString()} 
          description="Total sales orders created"
          icon={<ShoppingCart className="h-5 w-5 text-blue-600" />}
        />
        <StatCard 
          title="Pending Orders" 
          value={stats.pendingOrders.toString()} 
          description="Orders awaiting delivery"
          icon={<ShoppingCart className="h-5 w-5 text-yellow-600" />}
        />
        <StatCard 
          title="Completed Orders" 
          value={stats.completedOrders.toString()} 
          description="Successfully delivered orders"
          icon={<ShoppingCart className="h-5 w-5 text-green-600" />}
        />
        <StatCard 
          title="Sellers Called" 
          value={stats.sellersCalled.toString()} 
          description="Contact made with sellers"
          icon={<User className="h-5 w-5 text-indigo-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deliveries</CardTitle>
            <CardDescription>Scheduled deliveries for the next days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingDeliveries.map((delivery) => (
                <div key={delivery.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{delivery.route}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5 mr-1" />
                      <span>{delivery.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">
                      <span>{delivery.sellers} sellers</span>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sellers</CardTitle>
            <CardDescription>Sellers with recent orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentSellers.map((seller) => (
                <div key={seller.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{seller.name}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <List className="h-3.5 w-3.5 mr-1" />
                      <span>{seller.route}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">
                      <span>Last: {seller.lastOrder}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
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
