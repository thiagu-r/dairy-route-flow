import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SellerOrder {
  id: number;
  order_number: string;
  delivery_date: string;
  status: string;
  total_amount: string;
  seller_name?: string;
  seller_id?: number;
  route_name?: string;
  items?: Array<{
    id: number;
    product_name: string;
    quantity: string;
    unit_price: string;
    total_amount: string;
  }>;
}

interface Route {
  id: number;
  name: string;
}

export default function SalesReport() {
  const [sellerModal, setSellerModal] = useState<{ name: string; id: number } | null>(null);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([]);
  const [sellerOrdersLoading, setSellerOrdersLoading] = useState(false);
  const [sellerOrdersError, setSellerOrdersError] = useState<string | null>(null);

  // Filter state
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [route, setRoute] = useState("");
  const [seller, setSeller] = useState("");
  const [status, setStatus] = useState("");

  // Routes for dropdown
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);

  // Sales orders
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null);

  // Fetch routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      setRoutesLoading(true);
      setRoutesError(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/routes/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch routes');
        const data = await res.json();
        setRoutes(data.results || data); // handle both array and paginated
      } catch (error) {
        setRoutesError('Could not load routes.');
      } finally {
        setRoutesLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  // Fetch sales orders with filters
  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const token = localStorage.getItem('access_token');
      let url = 'https://bharatdairy.pythonanywhere.com/apiapp/orders/sales/?';
      const params = [];
      if (fromDate) params.push(`delivery_date__gte=${fromDate}`);
      if (toDate) params.push(`delivery_date__lte=${toDate}`);
      if (route) params.push(`route=${route}`);
      if (seller) params.push(`seller_store=${encodeURIComponent(seller)}`);
      if (status) params.push(`status=${status}`);
      url += params.join('&');
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch sales orders');
      const data = await res.json();
      setOrders(data.results || []);
    } catch (error) {
      setOrdersError('Could not load sales orders.');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Optionally, fetch orders on mount
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  // Fetch seller orders when modal opens
  const handleOpenSellerModal = async (seller: { name: string; id: number }) => {
    setSellerModal(seller);
    setSellerOrders([]);
    setSellerOrdersLoading(true);
    setSellerOrdersError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/orders/sales/?seller_id=${seller.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch seller orders');
      const data = await res.json();
      setSellerOrders(data.results || []);
    } catch (error) {
      setSellerOrdersError('Could not load sales orders for this seller.');
    } finally {
      setSellerOrdersLoading(false);
    }
  };

  // Fetch order details
  const handleViewOrder = async (orderId: number) => {
    setSelectedOrder(null);
    setOrderDetailsLoading(true);
    setOrderDetailsError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/orders/sales/${orderId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch order details');
      const data = await res.json();
      setSelectedOrder(data);
    } catch (error) {
      setOrderDetailsError('Could not load order details.');
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  return (
    <MainLayout requiredRoles={['admin', 'sales']}>
      <div className="space-y-6">
        {/* Filters Bar */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <Input type="date" className="w-40" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <Input type="date" className="w-40" value={toDate} onChange={e => setToDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Route</label>
            <select className="border rounded px-2 py-1 w-40" value={route} onChange={e => setRoute(e.target.value)}>
              <option value="">All Routes</option>
              {routesLoading ? (
                <option disabled>Loading...</option>
              ) : routesError ? (
                <option disabled>{routesError}</option>
              ) : (
                routes.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Seller</label>
            <Input placeholder="Search seller..." className="w-48" value={seller} onChange={e => setSeller(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select className="border rounded px-2 py-1 w-32" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <Button className="h-10" onClick={fetchOrders}>Search</Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-gray-500">Total Sales</div>
              <div className="text-2xl font-bold">₹0</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-gray-500"># Orders</div>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-gray-500"># Sellers</div>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-gray-500">Avg Order Value</div>
              <div className="text-2xl font-bold">₹0</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="font-semibold mb-2">Sales Over Time</div>
              <div className="h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400">[Line/Bar Chart]</div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-2">Sales by Route</div>
                <div className="h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400">[Pie/Bar Chart]</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="font-semibold mb-2">Top Products</div>
                <div className="h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400">[Pie/Bar Chart]</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sales Orders Table */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold text-lg">Sales Orders</div>
              <div className="flex gap-2">
                <Button variant="outline">Export CSV</Button>
                <Button variant="outline">Export PDF</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : ordersError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-red-500">{ordersError}</TableCell>
                    </TableRow>
                  ) : orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No sales orders found.</TableCell>
                    </TableRow>
                  ) : (
                    orders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>
                          <button 
                            className="text-blue-600 underline" 
                            onClick={() => handleOpenSellerModal({ 
                              name: order.seller_name || '', 
                              id: order.seller_id || 0 
                            })}
                          >
                            {order.seller_name || 'Seller'}
                          </button>
                        </TableCell>
                        <TableCell>{order.route_name || '-'}</TableCell>
                        <TableCell>{order.delivery_date}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>₹{order.total_amount}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewOrder(order.id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Seller Orders Modal */}
        <Dialog open={!!sellerModal} onOpenChange={open => !open && setSellerModal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sales Orders for {sellerModal?.name}</DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              {sellerOrdersLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : sellerOrdersError ? (
                <div className="p-4 text-center text-red-500">{sellerOrdersError}</div>
              ) : sellerOrders.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No sales orders found for this seller.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellerOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>{order.delivery_date}</TableCell>
                        <TableCell>{order.status}</TableCell>
                        <TableCell>₹{order.total_amount}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewOrder(order.id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Order Details Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={open => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              {orderDetailsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading order details...</div>
              ) : orderDetailsError ? (
                <div className="p-4 text-center text-red-500">{orderDetailsError}</div>
              ) : selectedOrder ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Seller</p>
                      <p className="font-medium">{selectedOrder.seller_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Route</p>
                      <p className="font-medium">{selectedOrder.route_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Delivery Date</p>
                      <p className="font-medium">{selectedOrder.delivery_date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-medium">{selectedOrder.status}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Order Items</h3>
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
                        {selectedOrder.items?.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>₹{item.unit_price}</TableCell>
                            <TableCell>₹{item.total_amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-xl font-bold">₹{selectedOrder.total_amount}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
} 