import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PricePlan, Seller } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { useRef } from 'react';

interface ProductTemplate {
  code: string;
  name: string;
}

interface FormValues {
  name: string;
  valid_from: string;
  valid_to: string;
  is_general: boolean;
  seller_id: string;
  excel_file: File | null;
}

export default function PricePlans() {
  const [pricePlans, setPricePlans] = useState<PricePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'seller'>('general');
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const [openDialog, setOpenDialog] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      name: '',
      valid_from: '',
      valid_to: '',
      is_general: false,
      seller_id: '',
      excel_file: null,
    },
  });

  // Download Excel template handler
  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "You are not authenticated. Please login again.",
          variant: "destructive",
        });
        setDownloading(false);
        return;
      }
      const response = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/products/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      const products: ProductTemplate[] = await response.json();
      const templateData = products.map((p) => ({ product_code: p.code, price: '' }));
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'PricePlanTemplate');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'price_plan_template.xlsx');
    } catch (error) {
      toast({
        title: "Failed to download template",
        description: "There was a problem generating the template.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const fetchPricePlans = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          toast({
            title: "Authentication Error",
            description: "You are not authenticated. Please login again.",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/price-plans/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPricePlans(data);
      } catch (error) {
        console.error('Failed to fetch price plans:', error);
        toast({
          title: "Error",
          description: "Failed to load price plans. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPricePlans();
  }, [toast]);

  // Group plans
  const generalPlans = pricePlans.filter((plan) => plan.is_general);
  const sellerPlans = pricePlans.filter((plan) => !plan.is_general);

  // Filter by search
  const filterPlans = (plans: PricePlan[]) =>
    plans.filter((plan) => {
      const planName = plan.name.toLowerCase();
      const sellerName = (plan.seller_name || '').toLowerCase();
      const productNames = plan.product_prices.map((p) => p.product_name.toLowerCase()).join(' ');
      return (
        planName.includes(searchTerm.toLowerCase()) ||
        sellerName.includes(searchTerm.toLowerCase()) ||
        productNames.includes(searchTerm.toLowerCase())
      );
    });

  const fetchAllSellers = async () => {
    setSellerLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      let page = 1;
      let allSellers: Seller[] = [];
      let hasNext = true;
      while (hasNext) {
        const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/sellers/?page=${page}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) break;
        const data = await res.json();
        allSellers = allSellers.concat(data.results);
        hasNext = !!data.next;
        page++;
      }
      setSellers(allSellers);
    } finally {
      setSellerLoading(false);
    }
  };

  const handleDialogOpen = (open: boolean) => {
    setOpenDialog(open);
    if (open && sellers.length === 0) fetchAllSellers();
  };

  const handleFormSubmit = async (values: FormValues) => {
    setFormSubmitting(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast({ title: 'Authentication Error', description: 'You are not authenticated. Please login again.', variant: 'destructive' });
        setFormSubmitting(false);
        return;
      }
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('valid_from', values.valid_from);
      formData.append('valid_to', values.valid_to);
      formData.append('is_general', values.is_general ? 'true' : 'false');
      if (!values.is_general) formData.append('seller_id', values.seller_id);
      if (values.excel_file) formData.append('excel_file', values.excel_file);
      const response = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/price-plans/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create price plan');
      toast({ title: 'Success', description: 'Price plan created successfully.' });
      setOpenDialog(false);
      form.reset();
      // Refresh price plans
      const refreshed = await fetch('https://bharatdairy.pythonanywhere.com/apiapp/price-plans/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (refreshed.ok) setPricePlans(await refreshed.json());
    } catch (error) {
      toast({ title: 'Failed', description: 'Could not create price plan.', variant: 'destructive' });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <MainLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-1">Price Plans</h1>
            <p className="text-gray-500">View all general and seller-specific price plans</p>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Search plans, sellers, or products..."
              className="max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button onClick={handleDownloadTemplate} variant="outline" disabled={downloading}>
              {downloading ? 'Generating...' : 'Download Excel Template'}
            </Button>
            <Dialog open={openDialog} onOpenChange={handleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-700 hover:bg-blue-800">Create Price Plan</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[475px]">
                <DialogHeader>
                  <DialogTitle>Create Price Plan</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                    <FormField name="name" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input {...field} required /></FormControl>
                      </FormItem>
                    )} />
                    <div className="flex gap-2">
                      <FormField name="valid_from" control={form.control} render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Valid From</FormLabel>
                          <FormControl><Input type="date" {...field} required /></FormControl>
                        </FormItem>
                      )} />
                      <FormField name="valid_to" control={form.control} render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Valid To</FormLabel>
                          <FormControl><Input type="date" {...field} required /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField name="is_general" control={form.control} render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="mb-0">Is General Price Plan</FormLabel>
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    {!form.watch('is_general') && (
                      <FormField name="seller_id" control={form.control} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seller</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange} disabled={sellerLoading}>
                              <SelectTrigger><SelectValue placeholder="Select seller" /></SelectTrigger>
                              <SelectContent>
                                {sellers.map(seller => (
                                  <SelectItem key={seller.id} value={seller.id.toString()}>{seller.store_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )} />
                    )}
                    <FormField name="excel_file" control={form.control} render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excel File</FormLabel>
                        <FormControl>
                          <Input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={e => field.onChange(e.target.files?.[0] || null)} required />
                        </FormControl>
                      </FormItem>
                    )} />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                      <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={formSubmitting}>{formSubmitting ? 'Creating...' : 'Create'}</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'general' | 'seller')}>
          <TabsList>
            <TabsTrigger value="general">General Price Plans</TabsTrigger>
            <TabsTrigger value="seller">Seller-Specific Price Plans</TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-6">
            {loading ? (
              <div className="text-center py-6">Loading price plans...</div>
            ) : (
              filterPlans(generalPlans).length === 0 ? (
                <Card><CardContent className="py-6 text-center">No general price plans found.</CardContent></Card>
              ) : (
                filterPlans(generalPlans).map((plan) => (
                  <Card key={plan.id} className="mb-6">
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="text-sm text-gray-500">
                        Valid: {plan.valid_from} to {plan.valid_to} | {plan.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {plan.product_prices.map((pp) => (
                            <TableRow key={pp.id}>
                              <TableCell>{pp.product_name}</TableCell>
                              <TableCell>{pp.price}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              )
            )}
          </TabsContent>
          <TabsContent value="seller" className="mt-6">
            {loading ? (
              <div className="text-center py-6">Loading price plans...</div>
            ) : (
              filterPlans(sellerPlans).length === 0 ? (
                <Card><CardContent className="py-6 text-center">No seller-specific price plans found.</CardContent></Card>
              ) : (
                filterPlans(sellerPlans).map((plan) => (
                  <Card key={plan.id} className="mb-6">
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <div className="text-sm text-gray-500">
                        Seller: {plan.seller_name || plan.seller} | Valid: {plan.valid_from} to {plan.valid_to} | {plan.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {plan.product_prices.map((pp) => (
                            <TableRow key={pp.id}>
                              <TableCell>{pp.product_name}</TableCell>
                              <TableCell>{pp.price}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
