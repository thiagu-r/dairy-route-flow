import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Seller } from '@/lib/types';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import Categories from '@/pages/Categories';

const API_URL = "https://bharatdairy.pythonanywhere.com/apiapp";

interface SellerFormValues {
  route: number | '';
  store_name: string;
  first_name: string;
  last_name: string;
  mobileno: string;
  store_address: string;
}

interface RouteOption {
  id: number;
  name: string;
  code: string;
}

export default function Sellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  const form = useForm<SellerFormValues>({
    defaultValues: {
      route: '',
      store_name: '',
      first_name: '',
      last_name: '',
      mobileno: '',
      store_address: '',
    },
  });

  // Fetch sellers from API
  useEffect(() => {
    const fetchSellers = async () => {
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
        const response = await axios.get(`${API_URL}/sellers/?page=${page}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSellers(response.data.results);
        setCount(response.data.count);
        setNext(response.data.next);
        setPrevious(response.data.previous);
      } catch (error) {
        toast({
          title: "Failed to fetch sellers",
          description: "There was a problem loading sellers data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, [page, toast]);

  // Fetch routes for dropdown
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const response = await axios.get(`${API_URL}/routes/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoutes(response.data);
      } catch (error) {
        // Optionally show a toast
      }
    };
    fetchRoutes();
  }, []);

  // Delete seller (API integration placeholder)
  const handleDelete = async (id: number) => {
    // TODO: Implement delete API call if available
    setSellers(prev => prev.filter(seller => seller.id !== id));
    toast({
      title: "Seller deleted",
      description: "The seller has been deleted successfully.",
      variant: "destructive",
    });
  };

  // Filter sellers based on search term (search all displayed fields)
  const filteredSellers = sellers.filter(seller => {
    const term = searchTerm.toLowerCase();
    return (
      seller.store_name.toLowerCase().includes(term) ||
      seller.first_name.toLowerCase().includes(term) ||
      seller.last_name.toLowerCase().includes(term) ||
      seller.route_name.toLowerCase().includes(term) ||
      seller.store_address.toLowerCase().includes(term) ||
      seller.id.toString().includes(term)
    );
  });

  // Create seller handler
  const onSubmit = async (data: SellerFormValues) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You are not authenticated. Please login again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      const selectedRoute = routes.find(r => r.id === Number(data.route));
      const payload = {
        ...data,
        route: Number(data.route),
        route_name: selectedRoute ? selectedRoute.name : '',
        lat: null,
        lan: null,
      };
      let response;
      if (editingSeller) {
        // Edit seller
        response = await axios.put(`${API_URL}/sellers/${editingSeller.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSellers(prev => prev.map(s => s.id === editingSeller.id ? response.data : s));
        toast({
          title: "Seller updated",
          description: `Seller '${data.store_name}' has been updated successfully.`,
        });
      } else {
        // Create seller
        response = await axios.post(`${API_URL}/sellers/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSellers(prev => [...prev, response.data]);
        toast({
          title: "Seller created",
          description: `Seller '${data.store_name}' has been created successfully.`,
        });
      }
      setOpenDialog(false);
      setEditingSeller(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Operation failed",
        description: `There was an error ${editingSeller ? 'updating' : 'creating'} the seller.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // When editingSeller changes, prefill the form
  useEffect(() => {
    if (editingSeller) {
      form.setValue('route', editingSeller.route);
      form.setValue('store_name', editingSeller.store_name);
      form.setValue('first_name', editingSeller.first_name);
      form.setValue('last_name', editingSeller.last_name);
      form.setValue('mobileno', editingSeller.mobileno);
      form.setValue('store_address', editingSeller.store_address);
    } else {
      form.reset();
    }
  }, [editingSeller, form]);

  return (
    <MainLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Sellers Management</h1>
            <p className="text-gray-500">Manage vendors and their route assignments</p>
          </div>
          <Button className="bg-blue-700 hover:bg-blue-800" onClick={() => {
            setEditingSeller(null);
            form.reset();
            setOpenDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Seller
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6">Loading sellers...</div>
            ) : (
              <>
                <div className="flex items-center mb-4">
                  <Input
                    placeholder="Search sellers..."
                    className="max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Store Name</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Route Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSellers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6">
                          No sellers found. Create your first seller to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSellers.map((seller) => (
                        <TableRow key={seller.id}>
                          <TableCell>{seller.id}</TableCell>
                          <TableCell>{seller.store_name}</TableCell>
                          <TableCell>{seller.first_name}</TableCell>
                          <TableCell>{seller.last_name}</TableCell>
                          <TableCell>{seller.route_name}</TableCell>
                          <TableCell>{seller.store_address}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingSeller(seller);
                                  setOpenDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleDelete(seller.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <div className="flex justify-end items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={!previous}
                  >
                    Previous
                  </Button>
                  <span>Page {page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!next}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle>{editingSeller ? 'Edit Seller' : 'Add New Seller'}</DialogTitle>
              <DialogDescription>
                {editingSeller 
                  ? 'Update the seller details below.' 
                  : 'Create a new seller and assign to a route.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Route</label>
                <Select
                  value={form.watch('route')?.toString() || ''}
                  onValueChange={val => form.setValue('route', Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a route" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map(route => (
                      <SelectItem key={route.id} value={route.id.toString()}>
                        {route.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Store Name</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Store Name"
                  {...form.register('store_name', { required: true })}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="First Name"
                    {...form.register('first_name', { required: true })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    placeholder="Last Name"
                    {...form.register('last_name', { required: true })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile No</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Mobile No"
                  {...form.register('mobileno', { required: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Store Address</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="Store Address"
                  {...form.register('store_address', { required: true })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setOpenDialog(false);
                  setEditingSeller(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingSeller ? 'Update Seller' : 'Add Seller')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
