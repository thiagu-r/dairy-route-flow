import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';

const API_URL = "https://bharatdairy.pythonanywhere.com/apiapp";

interface Category {
  id: number;
  name: string;
  code: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<{ name: string; code: string }>({
    defaultValues: { name: '', code: '' },
  });

  useEffect(() => {
    const fetchCategories = async () => {
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
        const response = await axios.get(`${API_URL}/categories/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(response.data);
      } catch (error) {
        toast({
          title: "Failed to fetch categories",
          description: "There was a problem loading categories data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [toast]);

  // When editingCategory changes, prefill the form
  useEffect(() => {
    if (editingCategory) {
      form.setValue('name', editingCategory.name);
      form.setValue('code', editingCategory.code);
    } else {
      form.reset();
    }
  }, [editingCategory, form]);

  const onSubmit = async (data: { name: string; code: string }) => {
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
      let response;
      if (editingCategory) {
        // Edit category
        response = await axios.put(`${API_URL}/categories/${editingCategory.id}/`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(prev => prev.map(cat => cat.id === editingCategory.id ? response.data : cat));
        toast({
          title: "Category updated",
          description: `Category '${data.name}' has been updated successfully.`,
        });
      } else {
        // Create category
        response = await axios.post(`${API_URL}/categories/`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(prev => [...prev, response.data]);
        toast({
          title: "Category created",
          description: `Category '${data.name}' has been created successfully.`,
        });
      }
      setOpenDialog(false);
      setEditingCategory(null);
      form.reset();
    } catch (error) {
      toast({
        title: "Operation failed",
        description: `There was an error ${editingCategory ? 'updating' : 'creating'} the category.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Categories</h1>
            <p className="text-gray-500">List of product categories</p>
          </div>
          <Button className="bg-blue-700 hover:bg-blue-800" onClick={() => {
            setEditingCategory(null);
            form.reset();
            setOpenDialog(true);
          }}>
            Add Category
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-6">Loading categories...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        No categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell>{cat.id}</TableCell>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>{cat.code}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(cat);
                              setOpenDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Update the category details below.' : 'Create a new category.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  placeholder="Category Name"
                  {...form.register('name', { required: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Code</label>
                <Input
                  placeholder="Category Code"
                  maxLength={4}
                  {...form.register('code', { required: true })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setOpenDialog(false);
                  setEditingCategory(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
} 