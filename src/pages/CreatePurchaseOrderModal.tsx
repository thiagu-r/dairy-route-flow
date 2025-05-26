import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
  id?: number;
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

interface PurchaseOrderItemEdit {
  id: number;
  product: number;
  product_name: string;
  sales_order_quantity: string;
  extra_quantity: string;
  remaining_quantity: string;
  total_quantity: string;
}

interface PurchaseOrderEdit {
  id: number;
  order_number: string;
  route: number;
  delivery_team: number;
  delivery_date: string;
  notes: string;
  status: string;
  items: PurchaseOrderItemEdit[];
}

interface CreatePurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOrder?: PurchaseOrderEdit | null;
}

export default function CreatePurchaseOrderModal({ open, onClose, onSuccess, editingOrder }: CreatePurchaseOrderModalProps) {
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
    if (!open) return;
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
  }, [open]);

  // Check for existing purchase order or fetch items (only when creating)
  useEffect(() => {
    if (!open || editingOrder) return;
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
  }, [selectedRoute, selectedTeam, deliveryDate, toast, open, editingOrder]);

  // Initialize form for editing
  useEffect(() => {
    if (editingOrder && open) {
      setSelectedRoute(editingOrder.route.toString());
      setSelectedTeam(editingOrder.delivery_team.toString());
      setDeliveryDate(new Date(editingOrder.delivery_date));
      setNotes(editingOrder.notes);
      setItems(
        editingOrder.items.map(item => ({
          product_id: item.product.toString(),
          product_name: item.product_name,
          sales_quantity: item.sales_order_quantity,
          extra_quantity: item.extra_quantity,
          remaining_quantity: item.remaining_quantity,
          total_quantity: item.total_quantity,
          id: item.id,
        }))
      );
    }
  }, [editingOrder, open]);

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
    let payload;
    let url;
    let method;
    if (editingOrder) {
      // Edit mode: PUT
      payload = {
        id: editingOrder.id,
        order_number: editingOrder.order_number,
        route: editingOrder.route,
        delivery_team: Number(selectedTeam),
        delivery_date: editingOrder.delivery_date,
        notes,
        status: editingOrder.status,
        items: items.map(item => ({
          id: item.id,
          product: Number(item.product_id),
          product_name: item.product_name,
          sales_order_quantity: item.sales_quantity,
          extra_quantity: item.extra_quantity,
          remaining_quantity: item.remaining_quantity,
          total_quantity: item.total_quantity,
        })),
      };
      url = `https://bharatdairy.pythonanywhere.com/apiapp/orders/purchase/${editingOrder.id}/`;
      method = 'PUT';
    } else {
      // Create mode: POST
      payload = {
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
      url = 'https://bharatdairy.pythonanywhere.com/apiapp/orders/purchase/';
      method = 'POST';
    }
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(editingOrder ? 'Failed to update purchase order' : 'Failed to create purchase order');
      const data = await response.json();
      toast({ title: 'Success', description: `Purchase order ${data.order_number} ${editingOrder ? 'updated' : 'created'}.`, variant: 'default' });
      // Reset form
      setSelectedRoute('');
      setSelectedTeam('');
      setDeliveryDate(undefined);
      setNotes('');
      setItems([]);
      setExistingOrder({ exists: false });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: editingOrder ? 'Failed to update purchase order.' : 'Failed to create purchase order.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedRoute('');
      setSelectedTeam('');
      setDeliveryDate(undefined);
      setNotes('');
      setItems([]);
      setExistingOrder({ exists: false });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingOrder ? 'Update Purchase Order' : 'Create Purchase Order'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Route *</label>
            <Select value={selectedRoute} onValueChange={setSelectedRoute} disabled={!!editingOrder}>
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
              disabled={!!editingOrder}
            />
          </div>
        </div>
        <div className="overflow-x-auto mt-4">
          <div className="max-h-64 overflow-y-auto border rounded">
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
          </div>
          <div className="mt-2">
            <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
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
            {loading
              ? (editingOrder ? 'Updating...' : 'Submitting...')
              : (editingOrder ? 'Update Purchase Order' : 'Create Purchase Order')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 