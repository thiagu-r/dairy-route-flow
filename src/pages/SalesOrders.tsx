import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
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

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Seller Store</TableHead>
                    <TableHead>Delivery Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <>
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <TableCell className="w-8">
                          {expandedOrderId === order.id ? <ChevronDown /> : <ChevronRight />}
                        </TableCell>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{order.seller_name}</TableCell>
                        <TableCell>{order.delivery_date}</TableCell>
                      </TableRow>
                      {expandedOrderId === order.id && (
                        <TableRow key={order.id + '-expanded'}>
                          <TableCell colSpan={4} className="bg-gray-50">
                            <div className="mb-2 text-sm text-gray-600">
                              <span className="mr-4">Total: ₹{order.total_amount}</span>
                              <span>Status: {order.status}</span>
                            </div>
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
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 