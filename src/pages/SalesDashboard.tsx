import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

interface Route {
  id: number;
  name: string;
  code: string;
}

interface Seller {
  id: number;
  store_name: string;
  route: number;
  route_name: string;
}

interface SalesOrderItem {
  id?: number;
  product: number;
  product_name?: string;
  quantity: string;
  unit_price: string;
  total_amount?: string;
}

interface SalesOrder {
  id: number;
  order_number: string;
  seller: number;
  seller_name: string;
  delivery_date: string;
  total_amount?: string;
  status?: string;
  items?: SalesOrderItem[];
}

interface ProductPrice {
  product: number;
  product_name: string;
  price: string;
}

interface Product {
  id: number;
  name: string;
}

export default function SalesDashboard() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [sellerSearch, setSellerSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [createOrderSeller, setCreateOrderSeller] = useState<Seller | null>(null);
  const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editOrderItems, setEditOrderItems] = useState<SalesOrderItem[]>([]);
  const [editOrderStatus, setEditOrderStatus] = useState<string>('draft');
  const [savingEdit, setSavingEdit] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [addProductId, setAddProductId] = useState<number | null>(null);
  const [addProductQty, setAddProductQty] = useState('');
  const [addProductLoading, setAddProductLoading] = useState(false);
  const { toast } = useToast();

  // Fetch routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/routes/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch routes');
        const data = await response.json();
        setRoutes(data);
      } catch (error) {
        toast({ title: 'Failed', description: 'Could not load routes.', variant: 'destructive' });
      }
    };
    fetchRoutes();
  }, [toast]);

  // Fetch sellers and sales orders when route or date changes
  useEffect(() => {
    if (!selectedRoute || !selectedDate) return;
    setLoading(true);
    const fetchSellersAndOrders = async () => {
      try {
        const token = localStorage.getItem('access_token');
        // Fetch sellers
        const sellersRes = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/sellers/?route=${selectedRoute}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!sellersRes.ok) throw new Error('Failed to fetch sellers');
        const sellersData = await sellersRes.json();
        setSellers(sellersData.results);
        // Fetch sales orders
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const ordersRes = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/orders/sales/?route=${selectedRoute}&delivery_date=${dateStr}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!ordersRes.ok) throw new Error('Failed to fetch sales orders');
        const ordersData = await ordersRes.json();
        setSalesOrders(ordersData.results);
      } catch (error) {
        toast({ title: 'Failed', description: 'Could not load sellers or sales orders.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchSellersAndOrders();
  }, [selectedRoute, selectedDate, toast]);

  // Helper to check if a seller has a sales order
  const getSellerOrder = (sellerId: number) =>
    salesOrders.find(order => order.seller === sellerId);

  // Filter sellers by search
  const filteredSellers = sellerSearch
    ? sellers.filter(s => s.store_name.toLowerCase().includes(sellerSearch.toLowerCase()))
    : sellers;

  // Handler for clicking a seller
  const handleSellerClick = (seller: Seller) => {
    const order = getSellerOrder(seller.id);
    if (order) {
      setSelectedOrder(order);
    }
  };

  // Fetch sales order details if selectedOrder is set and missing items
  useEffect(() => {
    if (!selectedOrder || selectedOrder.items) return;
    const fetchOrderDetail = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/orders/sales/${selectedOrder.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch sales order detail');
        const data = await response.json();
        setSelectedOrder(prev => prev ? { ...prev, ...data } : prev);
      } catch (error) {
        toast({ title: 'Failed', description: 'Could not load sales order detail.', variant: 'destructive' });
      }
    };
    fetchOrderDetail();
  }, [selectedOrder, toast]);

  // Fetch general price plan when opening create order modal
  useEffect(() => {
    if (!createOrderSeller) return;
    const fetchPrices = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/price-plans/?is_general=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch price plan');
        const data = await res.json();
        // Assume first plan is general, and has product_prices
        const plan = Array.isArray(data) ? data[0] : data;
        setProductPrices(plan.product_prices || []);
        setOrderItems((plan.product_prices || []).map((p: ProductPrice) => ({ product: p.product, product_name: p.product_name, quantity: '', unit_price: p.price })));
      } catch (error) {
        toast({ title: 'Failed', description: 'Could not load price plan.', variant: 'destructive' });
      }
    };
    fetchPrices();
  }, [createOrderSeller, toast]);

  // Handle order item quantity change
  const handleItemQtyChange = (idx: number, qty: string) => {
    setOrderItems(items => items.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
  };

  // Handle create order submit
  const handleCreateOrder = async () => {
    if (!createOrderSeller || !selectedDate) return;
    const items = orderItems.filter(i => i.quantity && parseFloat(i.quantity) > 0).map(i => ({ product: i.product, quantity: i.quantity, unit_price: i.unit_price }));
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Please enter at least one product quantity.', variant: 'destructive' });
      return;
    }
    setCreatingOrder(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/orders/sales/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          seller: createOrderSeller.id,
          delivery_date: format(selectedDate, 'yyyy-MM-dd'),
          status: 'draft',
          items,
        }),
      });
      if (!res.ok) throw new Error('Failed to create sales order');
      const data = await res.json();
      setSelectedOrder(data); // Show the new order in the detail modal
      setCreateOrderSeller(null);
      // Refresh sales orders
      setSalesOrders(prev => [...prev, data]);
      toast({ title: 'Success', description: 'Sales order created.' });
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not create sales order.', variant: 'destructive' });
    } finally {
      setCreatingOrder(false);
    }
  };

  // When opening order for edit, copy items and status
  useEffect(() => {
    if (editMode && selectedOrder) {
      setEditOrderItems(selectedOrder.items ? selectedOrder.items.map(i => ({ ...i })) : []);
      setEditOrderStatus(selectedOrder.status || 'draft');
    }
  }, [editMode, selectedOrder]);

  // Handle edit item quantity change
  const handleEditItemQtyChange = (idx: number, qty: string) => {
    setEditOrderItems(items => items.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
  };

  // Handle edit order save
  const handleSaveEdit = async () => {
    if (!selectedOrder) return;
    const items = editOrderItems.filter(i => i.quantity && parseFloat(i.quantity) > 0).map(i => ({
      id: i.id,
      product: i.product,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price
    }));
    if (items.length === 0) {
      toast({ title: 'Error', description: 'Please enter at least one product quantity.', variant: 'destructive' });
      return;
    }
    setSavingEdit(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/orders/sales/${selectedOrder.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: selectedOrder.id,
          order_number: selectedOrder.order_number,
          seller: selectedOrder.seller,
          seller_name: selectedOrder.seller_name,
          delivery_date: selectedOrder.delivery_date,
          total_amount: selectedOrder.total_amount,
          status: editOrderStatus,
          items,
        }),
      });
      if (!res.ok) throw new Error('Failed to update sales order');
      const data = await res.json();
      setSelectedOrder(data);
      setEditMode(false);
      // Update salesOrders in dashboard
      setSalesOrders(prev => prev.map(o => o.id === data.id ? { ...o, ...data } : o));
      toast({ title: 'Success', description: 'Sales order updated.' });
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not update sales order.', variant: 'destructive' });
    } finally {
      setSavingEdit(false);
    }
  };

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/products/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setAllProducts(data.results || data);
      } catch (error) {
        toast({ title: 'Failed', description: 'Could not load products.', variant: 'destructive' });
      }
    };
    fetchProducts();
  }, [toast]);

  // Add product to editOrderItems
  const handleAddProductToOrder = async () => {
    if (!addProductId || !addProductQty || parseFloat(addProductQty) <= 0) return;
    setAddProductLoading(true);
    try {
      // Find price from productPrices (general price plan)
      let price = '';
      let productName = '';
      const priceObj = productPrices.find(p => p.product === addProductId);
      if (priceObj) {
        price = priceObj.price;
        productName = priceObj.product_name;
      } else {
        // If not in cached price plan, fetch general price plan again
        const token = localStorage.getItem('access_token');
        const res = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/price-plans/?is_general=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch price plan');
        const data = await res.json();
        const plan = Array.isArray(data) ? data[0] : data;
        const found = (plan.product_prices || []).find((p: ProductPrice) => p.product === addProductId);
        if (found) {
          price = found.price;
          productName = found.product_name;
        }
      }
      if (!price) {
        toast({ title: 'Error', description: 'No price found for selected product.', variant: 'destructive' });
        setAddProductLoading(false);
        return;
      }
      setEditOrderItems(items => [
        ...items,
        {
          product: addProductId,
          product_name: productName || (allProducts.find(p => p.id === addProductId)?.name ?? ''),
          quantity: addProductQty,
          unit_price: price,
        },
      ]);
      setAddProductId(null);
      setAddProductQty('');
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not add product.', variant: 'destructive' });
    } finally {
      setAddProductLoading(false);
    }
  };

  return (
    <MainLayout requiredRoles={['admin', 'sales']}>
      <div className="space-y-6">
        {/* Controls in a single row */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          <div className="flex flex-row gap-4 w-full">
            <div className="flex-1 min-w-[200px]">
              <label className="block font-medium mb-1">Select Route</label>
              <select
                className="border rounded px-2 py-1 w-full"
                value={selectedRoute ?? ''}
                onChange={e => setSelectedRoute(Number(e.target.value) || null)}
              >
                <option value="">-- Select Route --</option>
                {routes.map(route => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block font-medium mb-1">Select Date</label>
              <Input
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={e => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                className="w-full"
              />
            </div>
          </div>
        </div>
        {/* Seller search */}
        <div className="flex flex-row items-center gap-2 max-w-md">
          <Input
            placeholder="Search seller by name..."
            value={sellerSearch}
            onChange={e => setSellerSearch(e.target.value)}
            className="w-full"
          />
          <Button variant="outline" onClick={() => setSellerSearch('')}>Clear</Button>
        </div>
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="text-center py-6">Loading sellers and sales orders...</div>
            ) : !selectedRoute || !selectedDate ? (
              <div className="text-center py-6">Select a route and date to view sellers.</div>
            ) : filteredSellers.length === 0 ? (
              <div className="text-center py-6">No sellers found for this route.</div>
            ) : (
              <div className="h-[520px] overflow-y-auto border rounded bg-gray-50 p-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredSellers.map(seller => {
                    const order = getSellerOrder(seller.id);
                    return (
                      <div
                        key={seller.id}
                        className={`p-2 rounded border text-sm cursor-pointer transition-colors flex flex-col items-start ${order ? 'bg-green-100 border-green-400 text-green-800' : 'bg-white hover:bg-gray-100'}`}
                        title={order ? `Sales Order Created (ID: ${order.id})` : 'No Sales Order'}
                        onClick={() => order ? handleSellerClick(seller) : setCreateOrderSeller(seller)}
                      >
                        <div className="font-semibold truncate w-full" title={seller.store_name}>{seller.store_name}</div>
                        <div className="text-xs text-gray-500">{seller.route_name}</div>
                        {order ? (
                          <div className="mt-1 text-xs font-medium">Sales Order: {order.order_number}</div>
                        ) : (
                          <Button size="sm" className="mt-2" variant="outline">Create Sales Order</Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        {/* Sales Order Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={open => { setEditMode(false); if (!open) setSelectedOrder(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sales Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder ? (
              <div className="space-y-2">
                <div className="font-semibold">Order Number: {selectedOrder.order_number}</div>
                <div>Seller: {selectedOrder.seller_name}</div>
                <div>Date: {selectedOrder.delivery_date}</div>
                {selectedOrder.status && <div>Status: {selectedOrder.status}</div>}
                {selectedOrder.total_amount && <div>Total: ₹{selectedOrder.total_amount}</div>}
                {!editMode ? (
                  <>
                    {selectedOrder.items && selectedOrder.items.length > 0 && (
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
                          {selectedOrder.items.map(item => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.unit_price}</TableCell>
                              <TableCell>{item.total_amount}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setEditMode(true)}>Edit</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editOrderItems.map((item, idx) => (
                          <TableRow key={item.id || item.product}>
                            <TableCell>{item.product_name}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantity}
                                onChange={e => handleEditItemQtyChange(idx, e.target.value)}
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>{item.unit_price}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex flex-row items-end gap-2 mt-2">
                      <select
                        className="border rounded px-2 py-1 min-w-[160px]"
                        value={addProductId ?? ''}
                        onChange={e => setAddProductId(Number(e.target.value) || null)}
                      >
                        <option value="">Add Product...</option>
                        {allProducts
                          .filter(p => !editOrderItems.some(i => i.product === p.id))
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </select>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Qty"
                        value={addProductQty}
                        onChange={e => setAddProductQty(e.target.value)}
                        className="w-24"
                        disabled={!addProductId}
                      />
                      <Button onClick={handleAddProductToOrder} disabled={!addProductId || !addProductQty || addProductLoading}>
                        {addProductLoading && <span className="animate-spin mr-2 inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full align-middle"></span>}
                        Add
                      </Button>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setEditMode(false)} disabled={savingEdit}>Cancel</Button>
                      <Button onClick={handleSaveEdit} disabled={savingEdit}>
                        {savingEdit && <span className="animate-spin mr-2 inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full align-middle"></span>}
                        Save
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>Loading...</div>
            )}
          </DialogContent>
        </Dialog>
        {/* Create Sales Order Modal */}
        <Dialog open={!!createOrderSeller} onOpenChange={open => !open && setCreateOrderSeller(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Sales Order for {createOrderSeller?.store_name}</DialogTitle>
            </DialogHeader>
            {productPrices.length === 0 ? (
              <div>Loading price plan...</div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, idx) => (
                      <TableRow key={item.product}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.unit_price}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity}
                            onChange={e => handleItemQtyChange(idx, e.target.value)}
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateOrderSeller(null)} disabled={creatingOrder}>Cancel</Button>
                  <Button onClick={handleCreateOrder} disabled={creatingOrder}>
                    {creatingOrder && <span className="animate-spin mr-2 inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full align-middle"></span>}
                    Create Order
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
} 