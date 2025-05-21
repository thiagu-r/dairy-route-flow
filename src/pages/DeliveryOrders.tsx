import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface DeliveryOrderItem {
  id: number;
  product: number;
  product_name: string;
  ordered_quantity: string;
  extra_quantity: string;
  delivered_quantity: string;
  unit_price: string;
  total_price: string;
}

interface DeliveryOrder {
  id: number;
  order_number: string;
  seller: number;
  seller_name: string;
  route: number;
  route_name: string;
  delivery_date: string;
  delivery_time: string;
  actual_delivery_date: string;
  actual_delivery_time: string;
  total_price: string;
  opening_balance: string;
  amount_collected: string;
  balance_amount: string;
  payment_method: string;
  status: string;
  notes: string | null;
  items: DeliveryOrderItem[];
  sync_status: string;
  local_id: string;
  sales_order: number;
}

export default function DeliveryOrders() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'route_name' | 'delivery_date' | 'seller_store_name'>('route_name');
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
      let url = 'https://bharatdairy.pythonanywhere.com/apiapp/orders/delivery/';
      if (query) url += `?${query}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch delivery orders');
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not load delivery orders.', variant: 'destructive' });
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
    else if (searchType === 'delivery_date') query = `delivery_date=${encodeURIComponent(searchTerm)}`;
    else if (searchType === 'seller_store_name') query = `seller_store_name=${encodeURIComponent(searchTerm)}`;
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
            <h1 className="text-2xl font-bold mb-1">Delivery Orders</h1>
            <p className="text-gray-500">View and search all delivery orders</p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-2 py-1"
              value={searchType}
              onChange={e => setSearchType(e.target.value as typeof searchType)}
            >
              <option value="route_name">Route Name</option>
              <option value="delivery_date">Delivery Date</option>
              <option value="seller_store_name">Seller Store Name</option>
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
              <div className="text-center py-6">Loading delivery orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-6">No delivery orders found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Seller Store</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Delivery Date</TableHead>
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
                        <TableCell>{order.seller_name}</TableCell>
                        <TableCell>{order.route_name}</TableCell>
                        <TableCell>{order.delivery_date}</TableCell>
                        <TableCell>{order.status}</TableCell>
                      </TableRow>
                      {expandedOrderId === order.id && (
                        <TableRow key={order.id + '-expanded'}>
                          <TableCell colSpan={6} className="bg-gray-50">
                            <div className="mb-2 text-sm text-gray-600">
                              <span className="mr-4">Total: ₹{order.total_price}</span>
                              <span>Status: {order.status}</span>
                              <span className="ml-4">Amount Collected: ₹{order.amount_collected}</span>
                              <span className="ml-4">Balance: ₹{order.balance_amount}</span>
                              <span className="ml-4">Payment: {order.payment_method}</span>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Ordered Qty</TableHead>
                                  <TableHead>Delivered Qty</TableHead>
                                  <TableHead>Unit Price</TableHead>
                                  <TableHead>Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map(item => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell>{item.ordered_quantity}</TableCell>
                                    <TableCell>{item.delivered_quantity}</TableCell>
                                    <TableCell>{item.unit_price}</TableCell>
                                    <TableCell>{item.total_price}</TableCell>
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