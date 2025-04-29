import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Route as RouteType } from '@/lib/types';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = "https://bharatdairy.pythonanywhere.com/apiapp";

interface RouteFormData {
  name: string;
  code: string;
}

export default function Routes() {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  const form = useForm<RouteFormData>({
    defaultValues: {
      name: '',
      code: '',
    },
  });
  
  const { user } = useAuth();
  
  const fetchRoutes = async () => {
    setLoading(true);
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
      
      const response = await axios.get(`${API_URL}/routes/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setRoutes(response.data);
    } catch (error) {
      console.error('Error fetching routes:', error);
      toast({
        title: "Failed to fetch routes",
        description: "There was a problem loading routes data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRoutes();
  }, []);
  
  useEffect(() => {
    if (editingRoute) {
      form.setValue('name', editingRoute.name);
      form.setValue('code', editingRoute.code);
    } else {
      form.reset();
    }
  }, [editingRoute, form]);
  
  const onSubmit = async (data: RouteFormData) => {
    setIsSubmitting(true);
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
      
      if (editingRoute) {
        // Update existing route
        const response = await axios.put(`${API_URL}/routes/${editingRoute.id}/`, data, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Update the routes array with the updated route
        setRoutes(prev => 
          prev.map(route => 
            route.id === editingRoute.id ? response.data : route
          )
        );
        
        toast({
          title: "Route updated",
          description: `Route '${data.name}' has been updated successfully.`,
        });
      } else {
        // Create new route
        const response = await axios.post(`${API_URL}/routes/`, data, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Add the new route to the routes array
        setRoutes(prev => [...prev, response.data]);
        
        toast({
          title: "Route created",
          description: `Route '${data.name}' has been created successfully.`,
        });
      }
      
      setOpenDialog(false);
      setEditingRoute(null);
      form.reset();
    } catch (error) {
      console.error('Error submitting route:', error);
      toast({
        title: "Operation failed",
        description: "There was an error processing your request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (id: number) => {
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
      
      await axios.delete(`${API_URL}/routes/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setRoutes(prev => prev.filter(route => route.id !== id));
      
      toast({
        title: "Route deleted",
        description: "The route has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting route:', error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the route.",
        variant: "destructive",
      });
    }
  };
  
  // Filter routes based on search term
  const filteredRoutes = routes.filter(route => 
    route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Routes Management</h1>
            <p className="text-gray-500">Manage delivery route areas</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button 
                className="bg-blue-700 hover:bg-blue-800"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
                <DialogDescription>
                  {editingRoute 
                    ? 'Update the route details below.' 
                    : 'Create a new route area for delivery planning.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter route name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter route code (e.g., KKDI)" {...field} maxLength={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setOpenDialog(false);
                      setEditingRoute(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-700 hover:bg-blue-800"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingRoute ? 'Update Route' : 'Add Route'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>All Routes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
              </div>
            ) : (
              <>
                <div className="flex items-center mb-4">
                  <Input
                    placeholder="Search routes..."
                    className="max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Route Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoutes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          {searchTerm ? 'No routes found matching your search.' : 'No routes found. Create your first route to get started.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoutes.map((route) => (
                        <TableRow key={route.id}>
                          <TableCell className="font-medium">{route.id}</TableCell>
                          <TableCell>{route.name}</TableCell>
                          <TableCell>{route.code}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingRoute(route);
                                  setOpenDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleDelete(route.id)}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
