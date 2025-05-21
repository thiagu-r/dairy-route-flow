import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface LoadingOrderItem {
  id: number;
  product: number;
  product_name: string;
  purchase_order_quantity: string;
  loaded_quantity: string;
  remaining_quantity: string;
  delivered_quantity: string;
  total_quantity: string;
  return_quantity: string;
  unit_price: string;
}

interface LoadingOrder {
  id: number;
  order_number: string;
  route: number;
  route_name: string;
  loading_date: string;
  status: string;
  items: LoadingOrderItem[];
  crates_loaded: number;
  loading_time: string;
}

export default function LoadingOrders() {
  const [orders, setOrders] = useState<LoadingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'route_name' | 'loading_date'>('route_name');
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
      let url = 'https://bharatdairy.pythonanywhere.com/apiapp/orders/loading/';
      if (query) url += `?${query}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch loading orders');
      const data = await response.json();
      setOrders(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not load loading orders.', variant: 'destructive' });
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
    else if (searchType === 'loading_date') query = `loading_date=${encodeURIComponent(searchTerm)}`;
    fetchOrders(query);
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  return (
    <MainLayout requiredRoles={['admin', 'delivery']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Loading Orders</h1>
            <p className="text-gray-500">View and search all loading orders</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-2 py-1"
              value={searchType}
              onChange={e => setSearchType(e.target.value as typeof searchType)}
            >
              <option value="route_name">Route Name</option>
              <option value="loading_date">Loading Date</option>
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
              <div className="text-center py-6">Loading loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-6">No loading orders found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Loading Date</TableHead>
                    <TableHead>Status</TableHead>
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
                        <TableCell>{order.route_name}</TableCell>
                        <TableCell>{order.loading_date}</TableCell>
                        <TableCell>{order.status}</TableCell>
                      </TableRow>
                      {expandedOrderId === order.id && (
                        <TableRow key={order.id + '-expanded'}>
                          <TableCell colSpan={5} className="bg-gray-50">
                            <div className="mb-2 text-sm text-gray-600">
                              <span className="mr-4">Crates Loaded: {order.crates_loaded}</span>
                              <span>Loading Time: {order.loading_time}</span>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product</TableHead>
                                  <TableHead>PO Qty</TableHead>
                                  <TableHead>Loaded Qty</TableHead>
                                  <TableHead>Remaining Qty</TableHead>
                                  <TableHead>Delivered Qty</TableHead>
                                  <TableHead>Total Qty</TableHead>
                                  <TableHead>Return Qty</TableHead>
                                  <TableHead>Unit Price</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map(item => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell>{item.purchase_order_quantity}</TableCell>
                                    <TableCell>{item.loaded_quantity}</TableCell>
                                    <TableCell>{item.remaining_quantity}</TableCell>
                                    <TableCell>{item.delivered_quantity}</TableCell>
                                    <TableCell>{item.total_quantity}</TableCell>
                                    <TableCell>{item.return_quantity}</TableCell>
                                    <TableCell>{item.unit_price}</TableCell>
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