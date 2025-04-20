
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import SalesDashboard from '@/components/dashboards/SalesDashboard';
import DeliveryDashboard from '@/components/dashboards/DeliveryDashboard';

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  
  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {hasRole('admin') && <AdminDashboard />}
        {hasRole('sales') && <SalesDashboard />}
        {hasRole('delivery') && <DeliveryDashboard />}
      </div>
    </MainLayout>
  );
}
