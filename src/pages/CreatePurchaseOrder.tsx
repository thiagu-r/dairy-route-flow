import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';

interface Route {
  id: number;
  name: string;
  code: string;
}

interface DeliveryTeam {
  id: number;
  name: string;
  route: number;
  route_name: string;
  distributor: number;
  distributor_name: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  price: string;
}

interface PurchaseOrderItem {
  product_id: string;
  product_name: string;
  sales_quantity: string;
  extra_quantity: string;
  remaining_quantity: string;
  total_quantity: string;
}

interface AddProductForm {
  product_id: string;
  sales_quantity: string;
  extra_quantity: string;
  remaining_quantity: string;
}

export default function CreatePurchaseOrder() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [teams, setTeams] = useState<DeliveryTeam[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [existingOrder, setExistingOrder] = useState<{ exists: boolean; order_id?: number; items?: PurchaseOrderItem[] }>({ exists: false });
  const [loading, setLoading] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addProductForm, setAddProductForm] = useState<AddProductForm>({ product_id: '', sales_quantity: '', extra_quantity: '', remaining_quantity: '' });

  // Fetch routes, teams, products
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch('https://bharatdairy.pythonanywhere.com/apiapp/routes/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setRoutes);
    fetch('https://bharatdairy.pythonanywhere.com/apiapp/delivery-teams/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setTeams);
    fetch('https://bharatdairy.pythonanywhere.com/api/products/')
      .then(res => res.json())
      .then(data => setProducts(data.products));
  }, []);

  // Check for existing purchase order or fetch items
  useEffect(() => {
    if (selectedRoute && selectedTeam && deliveryDate) {
      setLoading(true);
      const routeId = selectedRoute;
      const teamId = selectedTeam;
      const dateStr = deliveryDate.toISOString().split('T')[0];
      fetch(`https://bharatdairy.pythonanywhere.com/delivery-check-existing-purchase-order/?route=${routeId}&delivery_date=${dateStr}&team=${teamId}`)
        .then(res => res.json())
        .then(data => {
          setExistingOrder(data);
          if (data.exists) {
            setItems(data.items);
            toast({ title: 'Purchase Order Exists', description: 'A purchase order already exists for this route and date. You can edit it below.', variant: 'default' });
          } else {
            // Fetch sales summary for new order
            fetch(`https://bharatdairy.pythonanywhere.com/delivery-get-route-sales-summary/?route=${routeId}&delivery_date=${dateStr}`)
              .then(res => res.json())
              .then(data2 => {
                setItems(data2.items);
              });
          }
        })
        .finally(() => setLoading(false));
    } else {
      setItems([]);
      setExistingOrder({ exists: false });
    }
  }, [selectedRoute, selectedTeam, deliveryDate, toast]);

  // Handle extra quantity change
  const handleExtraQtyChange = (idx: number, value: string) => {
    setItems(prev => prev.map((item, i) =>
      i === idx
        ? {
            ...item,
            extra_quantity: value,
            total_quantity: (parseFloat(item.sales_quantity) + parseFloat(value || '0')).toFixed(3),
          }
        : item
    ));
  };

  // Add new product to items
  const handleAddProduct = () => {
    const prod = products.find(p => p.id === addProductForm.product_id);
    if (!prod) return;
    setItems(prev => [
      ...prev,
      {
        product_id: prod.id,
        product_name: prod.name,
        sales_quantity: addProductForm.sales_quantity || '0.000',
        extra_quantity: addProductForm.extra_quantity || '0.000',
        remaining_quantity: addProductForm.remaining_quantity || '0.000',
        total_quantity: (
          parseFloat(addProductForm.sales_quantity || '0') +
          parseFloat(addProductForm.extra_quantity || '0')
        ).toFixed(3),
      },
    ]);
    setAddProductOpen(false);
    setAddProductForm({ product_id: '', sales_quantity: '', extra_quantity: '', remaining_quantity: '' });
  };

  // Products not in items
  const availableProducts = products.filter(
    p => !items.some(item => item.product_id === p.id)
  );

  // Submit handler
  const handleSubmit = async () => {
    if (!selectedRoute || !selectedTeam || !deliveryDate || !notes.trim() || items.length === 0) {
      toast({ title: 'Missing Fields', description: 'Please fill all required fields and add at least one item.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast({ title: 'Authentication Error', description: 'You are not authenticated. Please login again.', variant: 'destructive' });
      setLoading(false);
      return;
    }
    const payload = {
      route: Number(selectedRoute),
      delivery_team: Number(selectedTeam),
      delivery_date: deliveryDate.toISOString().split('T')[0],
      notes,
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        sales_quantity: item.sales_quantity,
        extra_quantity: item.extra_quantity,
        remaining_quantity: item.remaining_quantity,
        total_quantity: item.total_quantity,
      })),
    };
    try {
      const response = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/orders/purchase/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create purchase order');
      const data = await response.json();
      toast({ title: 'Success', description: `Purchase order ${data.order_number} created.`, variant: 'default' });
      // Reset form
      setSelectedRoute('');
      setSelectedTeam('');
      setDeliveryDate(undefined);
      setNotes('');
      setItems([]);
      setExistingOrder({ exists: false });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create purchase order.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Purchase Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium">Route *</label>
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map(route => (
                      <SelectItem key={route.id} value={route.id.toString()}>{route.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Delivery Team *</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams
                      .filter(team => !selectedRoute || team.route.toString() === selectedRoute)
                      .map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Delivery Date *</label>
                <Input
                  type="date"
                  value={deliveryDate ? deliveryDate.toISOString().split('T')[0] : ''}
                  onChange={e => setDeliveryDate(e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>
            </div>
            <div className="overflow-x-auto mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Sales Qty</TableHead>
                    <TableHead>Extra Qty</TableHead>
                    <TableHead>Remaining Qty</TableHead>
                    <TableHead>Total Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.product_id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.sales_quantity}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.extra_quantity}
                          onChange={e => handleExtraQtyChange(idx, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.remaining_quantity}
                          onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, remaining_quantity: e.target.value } : it))}
                        />
                      </TableCell>
                      <TableCell>{item.total_quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-2">
                <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">+ Add Product</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Product</DialogTitle>
                      <DialogDescription>Select a product and enter quantities.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Select value={addProductForm.product_id} onValueChange={val => setAddProductForm(f => ({ ...f, product_id: val }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map(prod => (
                            <SelectItem key={prod.id} value={prod.id}>{prod.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="Sales Quantity"
                        value={addProductForm.sales_quantity}
                        onChange={e => setAddProductForm(f => ({ ...f, sales_quantity: e.target.value }))}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="Extra Quantity"
                        value={addProductForm.extra_quantity}
                        onChange={e => setAddProductForm(f => ({ ...f, extra_quantity: e.target.value }))}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        placeholder="Remaining Quantity"
                        value={addProductForm.remaining_quantity}
                        onChange={e => setAddProductForm(f => ({ ...f, remaining_quantity: e.target.value }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={handleAddProduct} disabled={!addProductForm.product_id}>Add Product</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="mt-4">
              <label className="block mb-1 font-medium">Notes *</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} required />
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={loading || !selectedRoute || !selectedTeam || !deliveryDate || !notes.trim() || items.length === 0}
                className="min-w-[160px]"
              >
                {loading ? 'Submitting...' : 'Create Purchase Order'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 