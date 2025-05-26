import { useEffect, useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Route {
  id: number;
  name: string;
  code: string;
}

export default function DeliverySummaryReport() {
  const { toast } = useToast();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // Fetch routes
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch('https://bharatdairy.pythonanywhere.com/apiapp/routes/', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setRoutes)
      .catch(() => setError('Failed to load routes'));
  }, []);

  // Fetch report
  const fetchReport = () => {
    if (!selectedRoute || !deliveryDate) return;
    setLoading(true);
    setError(null);
    setReport(null);
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetch(`https://bharatdairy.pythonanywhere.com/apiapp/delivery-reports/?delivery_date=${deliveryDate}&route=${selectedRoute}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch report');
        return res.json();
      })
      .then(setReport)
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false));
  };

  // Handlers
  const handleRouteChange = (val: string) => {
    setSelectedRoute(val);
    setReport(null);
  };
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDeliveryDate(e.target.value);
    setReport(null);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pageWidth;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`delivery-summary-${report?.route?.name || ''}-${report?.delivery_date || ''}.pdf`);
  };

  return (
    <MainLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Summary Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="block mb-1 font-medium">Route *</label>
                <Select value={selectedRoute} onValueChange={handleRouteChange}>
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
                <label className="block mb-1 font-medium">Delivery Date *</label>
                <Input type="date" value={deliveryDate} onChange={handleDateChange} />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchReport} disabled={!selectedRoute || !deliveryDate || loading}>
                  {loading ? 'Loading...' : 'View Report'}
                </Button>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleExportPDF} disabled={!report}>Export as PDF</Button>
              </div>
            </div>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {report && (
              <div className="space-y-8" ref={reportRef}>
                {/* Loading Order Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Loading Order Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                      <div><b>Route:</b> {report.route?.name}</div>
                      <div><b>Date:</b> {report.delivery_date}</div>
                      <div><b>Crates Loaded:</b> {report.loading_orders?.[0]?.crates_loaded ?? '-'}</div>
                      <div><b>Loading Time:</b> {report.loading_orders?.[0]?.loading_time ?? '-'}</div>
                      <div><b>Delivery Team:</b> {report.delivery_orders?.[0]?.route_name ?? '-'}</div>
                      <div><b>Total Quantities:</b> {report.loading_orders?.[0]?.items?.reduce((sum: number, i: any) => sum + parseFloat(i.loaded_quantity), 0) ?? '-'}</div>
                    </div>
                  </CardContent>
                </Card>
                {/* Delivery Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store Name</TableHead>
                          {report.loading_orders?.[0]?.items?.map((p: any) => (
                            <TableHead key={p.product}>{p.product_name} (Qty)</TableHead>
                          ))}
                          <TableHead>Opening Balance</TableHead>
                          <TableHead>Total Price</TableHead>
                          <TableHead>Amount Collected</TableHead>
                          <TableHead>Balance Amount</TableHead>
                          <TableHead>Payment Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.delivery_orders?.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.seller_name}</TableCell>
                            {report.loading_orders?.[0]?.items?.map((p: any) => {
                              const item = order.items.find((i: any) => i.product === p.product);
                              return <TableCell key={p.product}>{item?.delivered_quantity ?? '-'}</TableCell>;
                            })}
                            <TableCell>{order.opening_balance}</TableCell>
                            <TableCell>{order.total_price}</TableCell>
                            <TableCell>{order.amount_collected}</TableCell>
                            <TableCell>{order.balance_amount}</TableCell>
                            <TableCell>{order.payment_method}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                {/* Returned Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Returned Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store Name</TableHead>
                          {report.loading_orders?.[0]?.items?.map((p: any) => (
                            <TableHead key={p.product}>{p.product_name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.returned_orders?.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.route_name}</TableCell>
                            {report.loading_orders?.[0]?.items?.map((p: any) => {
                              const item = order.items.find((i: any) => i.product === p.product);
                              return <TableCell key={p.product}>{item?.quantity ?? '-'}</TableCell>;
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                {/* Broken Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle>Broken Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store Name</TableHead>
                          {report.loading_orders?.[0]?.items?.map((p: any) => (
                            <TableHead key={p.product}>{p.product_name}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.broken_orders?.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.route_name}</TableCell>
                            {report.loading_orders?.[0]?.items?.map((p: any) => {
                              const item = order.items.find((i: any) => i.product === p.product);
                              return <TableCell key={p.product}>{item?.broken_quantity ?? '-'}</TableCell>;
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                {/* Expenses */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Expense Type</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.delivery_expenses?.map((exp: any) => (
                          <TableRow key={exp.id}>
                            <TableCell>{exp.expense_type}</TableCell>
                            <TableCell>{exp.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                {/* Denominations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Denominations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Denomination</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.cash_denominations?.map((den: any) => (
                          <TableRow key={den.id}>
                            <TableCell>{den.denomination}</TableCell>
                            <TableCell>{den.count}</TableCell>
                            <TableCell>{den.total_amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                {/* Public Sales */}
                <Card>
                  <CardHeader>
                    <CardTitle>Public Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sale Number</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total Price</TableHead>
                          <TableHead>Amount Collected</TableHead>
                          <TableHead>Payment Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.public_sales?.map((sale: any) => (
                          sale.items.map((item: any, idx: number) => (
                            <TableRow key={sale.id + '-' + item.id}>
                              <TableCell>{idx === 0 ? sale.sale_number : ''}</TableCell>
                              <TableCell>{item.product_name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.unit_price}</TableCell>
                              <TableCell>{item.total_price}</TableCell>
                              <TableCell>{sale.amount_collected}</TableCell>
                              <TableCell>{sale.payment_method}</TableCell>
                            </TableRow>
                          ))
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 