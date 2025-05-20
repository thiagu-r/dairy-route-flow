import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SalesOrderItem {
  id: number;
  product: number;
  product_name: string;
  quantity: string;
  unit_price: string;
  total_amount: string;
}

interface SalesOrder {
  id: number;
  order_number: string;
  seller: number;
  seller_name: string;
  delivery_date: string;
  total_amount: string;
  status: string;
  items: SalesOrderItem[];
}

export default function SalesOrders() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'route_name' | 'route' | 'seller_store' | 'delivery_date'>('route_name');
  const { toast } = useToast();

  const fetchOrders = async (query = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({ title: 'Authentication Error', description: 'You are not authenticated. Please login again.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      let url = 'https://bharatdairy.pythonanywhere.com/apiapp/orders/sales/';
      if (query) url += `?${query}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch sales orders');
      const data = await response.json();
      setOrders(data.results);
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not load sales orders.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [toast]);

  const handleSearch = () => {
    if (!searchTerm) {
      fetchOrders();
      return;
    }
    let query = '';
    if (searchType === 'route_name') query = `route_name=${encodeURIComponent(searchTerm)}`;
    else if (searchType === 'route') query = `route=${encodeURIComponent(searchTerm)}`;
    else if (searchType === 'seller_store') query = `seller_store=${encodeURIComponent(searchTerm)}`;
    else if (searchType === 'delivery_date') query = `delivery_date=${encodeURIComponent(searchTerm)}`;
    fetchOrders(query);
  };

  return (
    <MainLayout requiredRoles={['admin', 'sales']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Sales Orders</h1>
            <p className="text-gray-500">View and search all sales orders</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-2 py-1"
              value={searchType}
              onChange={e => setSearchType(e.target.value as typeof searchType)}
            >
              <option value="route_name">Route Name</option>
              <option value="route">Route ID</option>
              <option value="seller_store">Seller Store</option>
              <option value="delivery_date">Delivery Date</option>
            </select>
            <Input
              placeholder={`Search by ${searchType.replace('_', ' ')}`}
              className="max-w-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            />
            <Button onClick={handleSearch} variant="outline">Search</Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-6">Loading sales orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-6">No sales orders found.</div>
            ) : (
              orders.map(order => (
                <Card key={order.id} className="mb-6">
                  <CardHeader>
                    <CardTitle>{order.order_number}</CardTitle>
                    <div className="text-sm text-gray-500">
                      Seller: {order.seller_name} | Delivery Date: {order.delivery_date} | Total: ₹{order.total_amount} | Status: {order.status}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unit_price}</TableCell>
                            <TableCell>{item.total_amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 