
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Package, ShoppingCart, AlertTriangle, DollarSign } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

interface DeliveryStats {
  pendingPurchaseOrders: number;
  approvedPurchaseOrders: number;
  pendingLoadingOrders: number;
  completedDeliveries: number;
  cashCollected: number;
  todayPurchaseOrders: Array<{
    id: string;
    route: string;
    status: 'pending' | 'approved' | 'cancelled';
    items: number;
    value: number;
  }>;
  todayDeliveries: Array<{
    id: string;
    seller: string;
    route: string;
    status: 'pending' | 'completed';
    value: number;
    progress: number;
  }>;
}

// Mock data
const mockDeliveryStats: DeliveryStats = {
  pendingPurchaseOrders: 4,
  approvedPurchaseOrders: 3,
  pendingLoadingOrders: 2,
  completedDeliveries: 8,
  cashCollected: 12580,
  todayPurchaseOrders: [
    { id: '1', route: 'North Area', status: 'approved', items: 12, value: 4250 },
    { id: '2', route: 'South Area', status: 'pending', items: 15, value: 5100 },
    { id: '3', route: 'East Area', status: 'approved', items: 8, value: 2800 },
    { id: '4', route: 'West Area', status: 'pending', items: 10, value: 3450 },
  ],
  todayDeliveries: [
    { id: '1', seller: 'Metro Grocery', route: 'North Area', status: 'completed', value: 1250, progress: 100 },
    { id: '2', seller: 'City Mart', route: 'North Area', status: 'completed', value: 980, progress: 100 },
    { id: '3', seller: 'Daily Fresh', route: 'South Area', status: 'pending', value: 1450, progress: 60 },
    { id: '4', seller: 'Green Valley', route: 'East Area', status: 'pending', value: 850, progress: 30 },
  ]
};

export default function DeliveryDashboard() {
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats(mockDeliveryStats);
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
          <h2 className="text-xl font-semibold">Delivery Dashboard</h2>
          <p className="text-gray-500">Manage purchase orders and deliveries</p>
        </div>
        <div className="space-x-3">
          <Button asChild variant="outline">
            <Link to="/purchase-orders/new">
              <Package className="h-4 w-4 mr-2" />
              New Purchase Order
            </Link>
          </Button>
          <Button asChild className="bg-blue-700 hover:bg-blue-800">
            <Link to="/loading/new">
              <Truck className="h-4 w-4 mr-2" />
              Create Loading Order
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Pending POs" 
          value={stats.pendingPurchaseOrders.toString()} 
          description="Purchase orders waiting approval"
          icon={<Package className="h-5 w-5 text-yellow-600" />}
        />
        <StatCard 
          title="Approved POs" 
          value={stats.approvedPurchaseOrders.toString()} 
          description="Purchase orders ready for loading"
          icon={<Package className="h-5 w-5 text-green-600" />}
        />
        <StatCard 
          title="Pending Loading" 
          value={stats.pendingLoadingOrders.toString()} 
          description="Orders ready to be loaded"
          icon={<Truck className="h-5 w-5 text-blue-600" />}
        />
        <StatCard 
          title="Completed" 
          value={stats.completedDeliveries.toString()} 
          description="Successful deliveries today"
          icon={<ShoppingCart className="h-5 w-5 text-green-600" />}
        />
        <StatCard 
          title="Cash Collected" 
          value={`$${stats.cashCollected.toLocaleString()}`} 
          description="Total cash collected today"
          icon={<DollarSign className="h-5 w-5 text-blue-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Purchase Orders</CardTitle>
            <CardDescription>Purchase orders for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.todayPurchaseOrders.map((po) => (
                <div key={po.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{po.route}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Package className="h-3.5 w-3.5 mr-1" />
                      <span>{po.items} items (${po.value.toLocaleString()})</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="px-2 py-1 text-xs font-medium rounded-full bg-opacity-10" 
                      style={{
                        backgroundColor: po.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: po.status === 'approved' ? 'rgb(34, 197, 94)' : 'rgb(234, 179, 8)'
                      }}>
                      {po.status === 'approved' ? 'Approved' : 'Pending'}
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
            <CardTitle>Today's Deliveries</CardTitle>
            <CardDescription>Current delivery progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.todayDeliveries.map((delivery) => (
                <div key={delivery.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{delivery.seller}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Truck className="h-3.5 w-3.5 mr-1" />
                        <span>{delivery.route} (${delivery.value.toLocaleString()})</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progress</span>
                      <span>{delivery.progress}%</span>
                    </div>
                    <Progress value={delivery.progress} className="h-1.5" />
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
