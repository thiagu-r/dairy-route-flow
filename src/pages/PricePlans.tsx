
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { PricePlan, Product, Seller } from '@/lib/types';

// Mock data
const mockProducts: Product[] = [
  { id: '1', name: 'Milk (1L)', unit: 'bottle' },
  { id: '2', name: 'Yogurt (500g)', unit: 'cup' },
  { id: '3', name: 'Cheese (250g)', unit: 'pack' },
  { id: '4', name: 'Butter (100g)', unit: 'pack' },
  { id: '5', name: 'Cream (200ml)', unit: 'bottle' },
];

const mockSellers: Seller[] = [
  { id: '1', name: 'Metro Grocery', route_id: '1', is_public: true },
  { id: '2', name: 'City Mart', route_id: '2', is_public: false },
  { id: '3', name: 'Daily Fresh', route_id: '3', is_public: true },
  { id: '4', name: 'Green Valley', route_id: '1', is_public: false },
  { id: '5', name: 'Corner Shop', route_id: '4', is_public: true },
];

const mockGeneralPricePlans: PricePlan[] = [
  { id: '1', seller_id: null, product_id: '1', price: 2.50 },
  { id: '2', seller_id: null, product_id: '2', price: 1.75 },
  { id: '3', seller_id: null, product_id: '3', price: 3.25 },
  { id: '4', seller_id: null, product_id: '4', price: 1.20 },
  { id: '5', seller_id: null, product_id: '5', price: 1.80 },
];

const mockSellerPricePlans: PricePlan[] = [
  { id: '6', seller_id: '1', product_id: '1', price: 2.35 },
  { id: '7', seller_id: '1', product_id: '3', price: 3.10 },
  { id: '8', seller_id: '2', product_id: '1', price: 2.40 },
  { id: '9', seller_id: '3', product_id: '2', price: 1.65 },
  { id: '10', seller_id: '5', product_id: '4', price: 1.15 },
];

interface FormValues {
  seller_id: string | null;
  product_id: string;
  price: string;
}

export default function PricePlans() {
  const [generalPricePlans, setGeneralPricePlans] = useState<PricePlan[]>([]);
  const [sellerPricePlans, setSellerPricePlans] = useState<PricePlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPricePlan, setEditingPricePlan] = useState<PricePlan | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'seller'>('general');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    defaultValues: {
      seller_id: null,
      product_id: '',
      price: '',
    },
  });
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setGeneralPricePlans(mockGeneralPricePlans);
      setSellerPricePlans(mockSellerPricePlans);
      setProducts(mockProducts);
      setSellers(mockSellers);
      setLoading(false);
    }, 1000);
  }, []);
  
  useEffect(() => {
    if (editingPricePlan) {
      form.setValue('product_id', editingPricePlan.product_id);
      form.setValue('seller_id', editingPricePlan.seller_id);
      form.setValue('price', editingPricePlan.price.toString());
    } else {
      form.reset();
      // Set seller_id based on active tab
      form.setValue('seller_id', activeTab === 'general' ? null : '');
    }
  }, [editingPricePlan, form, activeTab]);
  
  const onSubmit = (data: FormValues) => {
    const price = parseFloat(data.price);
    
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price greater than zero.",
        variant: "destructive",
      });
      return;
    }
    
    const newPricePlan: PricePlan = {
      id: editingPricePlan ? editingPricePlan.id : Date.now().toString(),
      seller_id: data.seller_id,
      product_id: data.product_id,
      price: price,
    };
    
    if (editingPricePlan) {
      // Update existing price plan
      if (editingPricePlan.seller_id === null) {
        setGeneralPricePlans(prev => 
          prev.map(plan => plan.id === editingPricePlan.id ? newPricePlan : plan)
        );
      } else {
        setSellerPricePlans(prev => 
          prev.map(plan => plan.id === editingPricePlan.id ? newPricePlan : plan)
        );
      }
      
      toast({
        title: "Price plan updated",
        description: "The price plan has been updated successfully.",
      });
    } else {
      // Create new price plan
      if (data.seller_id === null) {
        // Check if product already has a general price plan
        const exists = generalPricePlans.some(plan => plan.product_id === data.product_id);
        if (exists) {
          toast({
            title: "Product already has a price plan",
            description: "This product already has a general price plan. Please edit the existing one.",
            variant: "destructive",
          });
          return;
        }
        
        setGeneralPricePlans(prev => [...prev, newPricePlan]);
      } else {
        // Check if seller and product combination already exists
        const exists = sellerPricePlans.some(
          plan => plan.seller_id === data.seller_id && plan.product_id === data.product_id
        );
        if (exists) {
          toast({
            title: "Price plan already exists",
            description: "This seller already has a price plan for this product. Please edit the existing one.",
            variant: "destructive",
          });
          return;
        }
        
        setSellerPricePlans(prev => [...prev, newPricePlan]);
      }
      
      toast({
        title: "Price plan created",
        description: "The price plan has been created successfully.",
      });
    }
    
    setOpenDialog(false);
    setEditingPricePlan(null);
    form.reset();
  };
  
  const handleDelete = (plan: PricePlan) => {
    if (plan.seller_id === null) {
      setGeneralPricePlans(prev => prev.filter(p => p.id !== plan.id));
    } else {
      setSellerPricePlans(prev => prev.filter(p => p.id !== plan.id));
    }
    
    toast({
      title: "Price plan deleted",
      description: "The price plan has been deleted successfully.",
      variant: "destructive",
    });
  };
  
  // Get product and seller names
  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };
  
  const getSellerName = (sellerId: string | null) => {
    if (sellerId === null) return 'General Price Plan';
    const seller = sellers.find(s => s.id === sellerId);
    return seller ? seller.name : 'Unknown Seller';
  };
  
  // Filter plans based on search term
  const filteredGeneralPlans = generalPricePlans.filter(plan => 
    getProductName(plan.product_id).toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSellerPlans = sellerPricePlans.filter(plan => 
    getProductName(plan.product_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.seller_id && getSellerName(plan.seller_id).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <MainLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Price Plans</h1>
            <p className="text-gray-500">Manage product pricing for general and seller-specific plans</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-700 hover:bg-blue-800">
                <Plus className="h-4 w-4 mr-2" />
                Add Price Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[475px]">
              <DialogHeader>
                <DialogTitle>{editingPricePlan ? 'Edit Price Plan' : 'Add New Price Plan'}</DialogTitle>
                <DialogDescription>
                  {editingPricePlan 
                    ? 'Update the price plan details below.' 
                    : 'Create a new price plan for a product.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {activeTab === 'seller' && !editingPricePlan && (
                  <FormField
                    control={form.control}
                    name="seller_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value as string || undefined}
                          value={field.value as string || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a seller" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sellers.map((seller) => (
                              <SelectItem key={seller.id} value={seller.id}>
                                {seller.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the seller for this specific price plan
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01" 
                          min="0.01"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the price in dollars (e.g., 2.50)
                      </FormDescription>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setOpenDialog(false);
                      setEditingPricePlan(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-700 hover:bg-blue-800"
                  >
                    {editingPricePlan ? 'Update Price Plan' : 'Add Price Plan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs 
          defaultValue="general" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'general' | 'seller')}
        >
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="general">General Price Plans</TabsTrigger>
              <TabsTrigger value="seller">Seller-Specific Pricing</TabsTrigger>
            </TabsList>
            
            <Input
              placeholder="Search products or sellers..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Price Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-6">Loading price plans...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Price ($)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGeneralPlans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-6">
                            No general price plans found. Create your first price plan to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredGeneralPlans.map((plan) => {
                          const product = products.find(p => p.id === plan.product_id);
                          
                          return (
                            <TableRow key={plan.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <Tag className="h-4 w-4 mr-2 text-blue-600" />
                                  {getProductName(plan.product_id)}
                                </div>
                              </TableCell>
                              <TableCell>{product?.unit || 'N/A'}</TableCell>
                              <TableCell>${plan.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingPricePlan(plan);
                                      setActiveTab('general');
                                      setOpenDialog(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => handleDelete(plan)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="seller" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Seller-Specific Price Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-6">Loading price plans...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Seller</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Price ($)</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSellerPlans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            No seller-specific price plans found. Create one to override general pricing.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSellerPlans.map((plan) => {
                          const generalPlan = generalPricePlans.find(p => p.product_id === plan.product_id);
                          const discount = generalPlan 
                            ? ((generalPlan.price - plan.price) / generalPlan.price * 100).toFixed(1)
                            : '0.0';
                          const discountClass = parseFloat(discount) > 0 
                            ? 'text-green-600' 
                            : (parseFloat(discount) < 0 ? 'text-red-600' : 'text-gray-500');
                          
                          return (
                            <TableRow key={plan.id}>
                              <TableCell>{getSellerName(plan.seller_id)}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <Tag className="h-4 w-4 mr-2 text-blue-600" />
                                  {getProductName(plan.product_id)}
                                </div>
                              </TableCell>
                              <TableCell>${plan.price.toFixed(2)}</TableCell>
                              <TableCell className={discountClass}>
                                {parseFloat(discount) === 0 
                                  ? '—' 
                                  : `${parseFloat(discount) > 0 ? discount + '%' : `+${Math.abs(parseFloat(discount))}%`}`}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingPricePlan(plan);
                                      setActiveTab('seller');
                                      setOpenDialog(true);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                    onClick={() => handleDelete(plan)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
