import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 1. Update Product type for API response
interface Product {
  id: number;
  code: string;
  name: string;
  category: number;
  category_name: string;
  is_liquid: boolean;
  unit_size: string;
  is_active: boolean;
}

interface Category {
  id: number;
  name: string;
  code: string;
}

interface FormValues {
  code: string;
  name: string;
  category: number | '';
  is_liquid: boolean;
  unit: string;
  is_active: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    defaultValues: {
      code: '',
      name: '',
      category: '',
      is_liquid: false,
      unit: '',
      is_active: true,
    },
  });
  
  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "You are not authenticated. Please login again.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const response = await fetch(
          `https://bharatdairy.pythonanywhere.com/apiapp/products/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        toast({
          title: "Failed to fetch products",
          description: "There was a problem loading products data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [toast]);
  
  // Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const response = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/categories/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        // Optionally show a toast
      }
    };
    fetchCategories();
  }, []);
  
  useEffect(() => {
    if (editingProduct) {
      form.setValue('code', editingProduct.code);
      form.setValue('name', editingProduct.name);
      form.setValue('category', editingProduct.category);
      form.setValue('is_liquid', editingProduct.is_liquid);
      form.setValue('unit', editingProduct.unit_size);
      form.setValue('is_active', editingProduct.is_active);
    } else {
      form.reset();
    }
  }, [editingProduct, form]);
  
  const onSubmit = async (data: FormValues) => {
    const selectedCategory = categories.find(c => c.id === Number(data.category));
    const payload = {
      code: data.code,
      name: data.name,
      category: Number(data.category),
      category_name: selectedCategory ? selectedCategory.name : '',
      is_liquid: data.is_liquid,
      unit_size: data.unit,
      is_active: data.is_active,
    };
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You are not authenticated. Please login again.",
          variant: "destructive",
        });
        return;
      }
      let response;
      if (editingProduct) {
        response = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/products/${editingProduct.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/products/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }
      if (!response.ok) throw new Error('Failed to save product');
      toast({
        title: `Product ${editingProduct ? 'updated' : 'created'}`,
        description: `Product '${data.name}' has been ${editingProduct ? 'updated' : 'created'} successfully.`,
      });
      setOpenDialog(false);
      setEditingProduct(null);
      form.reset();
      // Refresh products
      const refreshed = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/products/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshed.ok) setProducts(await refreshed.json());
    } catch (error) {
      toast({
        title: "Operation failed",
        description: `There was an error ${editingProduct ? 'updating' : 'creating'} the product.`,
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = (id: number) => {
    setProducts(prev => prev.filter(product => product.id !== id));
    
    toast({
      title: "Product deleted",
      description: "The product has been deleted successfully.",
      variant: "destructive",
    });
  };
  
  // Group products by category_name
  const groupedProducts = products.reduce<Record<string, Product[]>>((acc, product) => {
    if (!acc[product.category_name]) acc[product.category_name] = [];
    acc[product.category_name].push(product);
    return acc;
  }, {});

  // Filter products by search term (across all categories)
  const filteredGroupedProducts = Object.entries(groupedProducts).reduce(
    (acc, [category, prods]) => {
      const filtered = prods.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.unit_size.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) acc[category] = filtered;
      return acc;
    }, {} as Record<string, Product[]>
  );
  
  return (
    <MainLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Products by Category</h1>
            <p className="text-gray-500">Browse all products grouped by their categories</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-700 hover:bg-blue-800">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[475px]">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                <DialogDescription>
                  {editingProduct 
                    ? 'Update the product details below.' 
                    : 'Create a new product for the dairy factory.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product code (e.g., FM1000)" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name (e.g., Full Milk 1L)" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          value={field.value?.toString() || ''}
                          onValueChange={val => field.onChange(Number(val))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id.toString()}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_liquid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Is Liquid?</FormLabel>
                        <Select
                          value={field.value ? 'true' : 'false'}
                          onValueChange={val => field.onChange(val === 'true')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Size</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter unit size (e.g., 1, 0.5, 2)" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Active?</FormLabel>
                        <Select
                          value={field.value ? 'true' : 'false'}
                          onValueChange={val => field.onChange(val === 'true')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setOpenDialog(false);
                        setEditingProduct(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-blue-700 hover:bg-blue-800"
                    >
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex items-center mb-4">
          <Input
            placeholder="Search products..."
            className="max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="text-center py-6">Loading products...</div>
        ) : (
          Object.keys(filteredGroupedProducts).length === 0 ? (
            <div className="text-center py-6">No products found.</div>
          ) : (
            Object.entries(filteredGroupedProducts).map(([category, prods]) => (
              <Card key={category} className="mb-6">
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Unit Size</TableHead>
                        <TableHead>Is Liquid</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prods.map(product => (
                        <TableRow key={product.id}>
                          <TableCell>{product.id}</TableCell>
                          <TableCell>{product.code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.unit_size}</TableCell>
                          <TableCell>{product.is_liquid ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{product.is_active ? 'Yes' : 'No'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setOpenDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>
    </MainLayout>
  );
}
