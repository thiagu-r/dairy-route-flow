import { useState, useEffect } from 'react';
import { ChartContainer } from '@/components/ui/chart';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface SellerDelivery {
  seller_id: number;
  seller_name: string;
  total_quantity: number;
  total_value: number;
  delivery_breakdown: {
    quantity: Record<string, number>;
    value: Record<string, number>;
  };
}

interface TopSellersResponse {
  period: string;
  sellers: SellerDelivery[];
}

interface TopSellersProps {
  chartOnly?: boolean;
  tableOnly?: boolean;
}

// Color palette for bars
const COLORS = [
  '#2563eb', '#10b981', '#f59e42', '#ef4444', '#a21caf', '#eab308', '#0ea5e9', '#14b8a6', '#f43f5e', '#6366f1',
];

export default function TopSellers({ chartOnly = false, tableOnly = false }: TopSellersProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<TopSellersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yType, setYType] = useState<'quantity' | 'value'>('quantity');

  useEffect(() => {
    const fetchTopSellers = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`https://bharatdairy.pythonanywhere.com/apiapp/admin/top-sellers/?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch top sellers');
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load top sellers');
      } finally {
        setLoading(false);
      }
    };
    fetchTopSellers();
  }, [period]);

  // Collect all unique period keys for columns
  const allPeriods = Array.from(
    new Set(
      data?.sellers.flatMap(s => [
        ...Object.keys(s.delivery_breakdown.quantity),
        ...Object.keys(s.delivery_breakdown.value)
      ]) || []
    )
  ).sort();

  // Prepare chart data
  const chartData = (data?.sellers || []).map(s => ({
    name: s.seller_name,
    quantity: s.total_quantity,
    value: s.total_value,
  }));

  // For multi-color bars: one bar per seller for 'quantity', single bar for 'value'
  const isQuantity = yType === 'quantity';

  // For quantity: group by period, each seller is a bar
  let chartDataTransformed: { name: string; quantity: number; value: number }[] | { period: string; [seller: string]: number | string }[] = chartData;
  if (isQuantity && data) {
    // Build data: [{ period: '2025-20', SellerA: 10, SellerB: 20, ... }, ...]
    const periodSet = new Set<string>();
    data.sellers.forEach(s => Object.keys(s.delivery_breakdown.quantity).forEach(period => periodSet.add(period)));
    const periods = Array.from(periodSet).sort();
    chartDataTransformed = periods.map(period => {
      const entry: { period: string; [seller: string]: number | string } = { period };
      data.sellers.forEach(s => {
        entry[s.seller_name] = s.delivery_breakdown.quantity[period] ?? 0;
      });
      return entry;
    });
  }

  return (
    <div className="mt-8">
      <div className="flex items-center mb-2 gap-4">
        <h2 className="text-lg font-semibold">Top Sellers</h2>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={period}
          onChange={e => setPeriod(e.target.value as 'week' | 'month')}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button
            className={`px-3 py-1 rounded border text-sm ${yType === 'quantity' ? 'bg-blue-600 text-white' : 'bg-white'}`}
            onClick={() => setYType('quantity')}
          >
            Quantity
          </button>
          <button
            className={`px-3 py-1 rounded border text-sm ${yType === 'value' ? 'bg-blue-600 text-white' : 'bg-white'}`}
            onClick={() => setYType('value')}
          >
            Value
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center p-6">Loading top sellers...</div>
      ) : error ? (
        <div className="text-center p-6 text-red-500">{error}</div>
      ) : !data || !data.sellers.length ? (
        <div className="text-center p-6">No top sellers data available</div>
      ) : (
        <>
          {/* Bar Chart */}
          {!tableOnly && (
            <div className="w-full h-80 mb-6">
              <ChartContainer config={{}}>
                <ReBarChart data={chartDataTransformed} margin={{ top: 16, right: 24, left: 0, bottom: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  {isQuantity ? (
                    <XAxis dataKey="period" />
                  ) : (
                    <XAxis dataKey="name" />
                  )}
                  <YAxis />
                  <Tooltip formatter={(value: number) => yType === 'value' ? `₹${Number(value).toLocaleString()}` : value} />
                  <Legend />
                  {isQuantity && data
                    ? data.sellers.map((s, idx) => (
                        <Bar
                          key={s.seller_id}
                          dataKey={s.seller_name}
                          name={s.seller_name}
                          fill={COLORS[idx % COLORS.length]}
                          isAnimationActive={false}
                        />
                      ))
                    : <Bar dataKey={yType} fill="#2563eb" name={yType === 'quantity' ? 'Quantity' : 'Value'} />
                  }
                </ReBarChart>
              </ChartContainer>
            </div>
          )}
          {/* Table */}
          {!chartOnly && (
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Seller</th>
                    <th className="border px-2 py-1">Total Qty</th>
                    <th className="border px-2 py-1">Total Value</th>
                    {allPeriods.map(periodKey => (
                      <th key={periodKey + '-qty'} className="border px-2 py-1">Qty {periodKey}</th>
                    ))}
                    {allPeriods.map(periodKey => (
                      <th key={periodKey + '-val'} className="border px-2 py-1">Value {periodKey}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sellers.map(seller => (
                    <tr key={seller.seller_id}>
                      <td className="border px-2 py-1 font-medium">{seller.seller_name}</td>
                      <td className="border px-2 py-1 text-right">{seller.total_quantity}</td>
                      <td className="border px-2 py-1 text-right">₹{seller.total_value.toLocaleString()}</td>
                      {allPeriods.map(periodKey => (
                        <td key={periodKey + '-qty'} className="border px-2 py-1 text-right">
                          {seller.delivery_breakdown.quantity[periodKey] !== undefined ? seller.delivery_breakdown.quantity[periodKey] : '-'}
                        </td>
                      ))}
                      {allPeriods.map(periodKey => (
                        <td key={periodKey + '-val'} className="border px-2 py-1 text-right">
                          {seller.delivery_breakdown.value[periodKey] !== undefined ? `₹${seller.delivery_breakdown.value[periodKey].toLocaleString()}` : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
} 