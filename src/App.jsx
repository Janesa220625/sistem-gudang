import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import OrderUpload from '@/pages/OrderUpload';
import DailyUploads from '@/pages/DailyUploads';
import MasterProduct from '@/pages/MasterProduct';
import StockInput from '@/pages/StockInput';
import OrderHistory from '@/pages/OrderHistory';
import StoreAccounts from '@/pages/StoreAccounts';
import ProductAnalysis from '@/pages/ProductAnalysis';
import DailyOrdersByProduct from '@/pages/DailyOrdersByProduct';
import ProductInbound from '@/pages/ProductInbound';
import ReceivedOrders from '@/pages/ReceivedOrders';
import ReturnedOrders from '@/pages/ReturnedOrders';
import FailedDelivery from '@/pages/FailedDelivery';
import Login from '@/pages/Login';
import ProductStock from '@/pages/ProductStock'; // Import komponen baru
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const NotImplemented = ({ pageName }) => {
    const { toast } = useToast();
    React.useEffect(() => {
        toast({
            title: 'Halaman Belum Tersedia',
            description: `🚧 Halaman ${pageName} belum diimplementasikan. Anda bisa memintanya di prompt berikutnya! 🚀`,
            variant: 'destructive',
        });
    }, [pageName, toast]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl font-bold gradient-text">Segera Hadir</h1>
            <p className="text-lg text-gray-400 mt-2">Halaman {pageName} sedang dalam pengembangan.</p>
        </div>
    );
};

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950">
            <div className="text-white text-2xl">Memuat Sesi...</div>
        </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950">
                <div className="text-white text-2xl">Memuat Sesi...</div>
            </div>
        );
    }
    
    if (session) {
        return <Navigate to="/" replace />;
    }

    return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route 
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                
                <Route path="/upload" element={<OrderUpload />} />
                <Route path="/daily-uploads" element={<DailyUploads />} />
                <Route path="/order-history" element={<OrderHistory />} />
                <Route path="/daily-orders-by-product" element={<DailyOrdersByProduct />} />
                <Route path="/received-orders" element={<ReceivedOrders />} />
                <Route path="/returned-orders" element={<ReturnedOrders />} />
                <Route path="/failed-delivery" element={<FailedDelivery />} />

                <Route path="/master-product" element={<MasterProduct />} />
                <Route path="/stock-input" element={<StockInput />} />
                <Route path="/product-inbound" element={<ProductInbound />} />
                <Route path="/product-analysis" element={<ProductAnalysis />} />
                <Route path="/product-stock" element={<ProductStock />} /> {/* Rute diperbarui */}
                
                <Route path="/accounts" element={<StoreAccounts />} />

                <Route path="/order-calculation" element={<NotImplemented pageName="Perhitungan Pesanan" />} />
                <Route path="/reports" element={<NotImplemented pageName="Laporan" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
