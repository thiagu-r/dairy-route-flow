import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface PurchaseOrderItem {
  id: number;
  product: number;
  product_name: string;
  sales_order_quantity: string;
  extra_quantity: string;
  remaining_quantity: string;
  total_quantity: string;
}

interface PurchaseOrder {
  id: number;
  order_number: string;
  route: number;
  delivery_date: string;
  notes: string;
  status: string;
  items: PurchaseOrderItem[];
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({ title: 'Authentication Error', description: 'You are not authenticated. Please login again.', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const url = 'https://bharatdairy.pythonanywhere.com/apiapp/orders/purchase/';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      const data = await response.json();
      setOrders(data.results);
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not load purchase orders.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, [toast]);

  const toggleExpand = (orderId: number) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  return (
    <MainLayout requiredRoles={['admin', 'delivery']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Purchase Orders</h1>
            <p className="text-gray-500">View all purchase orders</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-6">Loading purchase orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-6">No purchase orders found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Order Number</TableHead>
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
                        <TableCell>{order.route}</TableCell>
                        <TableCell>{order.delivery_date}</TableCell>
                        <TableCell>{order.status}</TableCell>
                      </TableRow>
                      {expandedOrderId === order.id && (
                        <TableRow key={order.id + '-expanded'}>
                          <TableCell colSpan={5} className="bg-gray-50">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Sales Order Qty</TableHead>
                                  <TableHead>Extra Qty</TableHead>
                                  <TableHead>Remaining Qty</TableHead>
                                  <TableHead>Total Qty</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {order.items.map(item => (
                                  <TableRow key={item.id}>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell>{item.sales_order_quantity}</TableCell>
                                    <TableCell>{item.extra_quantity}</TableCell>
                                    <TableCell>{item.remaining_quantity}</TableCell>
                                    <TableCell>{item.total_quantity}</TableCell>
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