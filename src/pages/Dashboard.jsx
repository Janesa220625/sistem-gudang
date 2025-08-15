
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  DollarSign,
  BarChart3,
  Calendar,
  Upload,
  Store
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import PlatformStats from '@/components/dashboard/PlatformStats';
import RecentActivity from '@/components/dashboard/RecentActivity';

function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalProducts: 0,
    lowStock: 0,
    revenue: 0,
  });
  const [platformData, setPlatformData] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const ordersPromise = supabase
        .from('orders')
        .select('total', { count: 'exact' })
        .eq('user_id', user.id);

      const productsPromise = supabase
        .from('master_products')
        .select('stock', { count: 'exact' })
        .eq('user_id', user.id);

      const uploadsPromise = supabase
        .from('daily_uploads')
        .select('platform, total_orders, created_at')
        .eq('user_id', user.id);
        
      const stockHistoryPromise = supabase
        .from('stock_history')
        .select('created_at, product_name, type, quantity, reason')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const [
        { count: totalOrders, data: revenueData, error: ordersError },
        { count: totalProducts, data: productsData, error: productsError },
        { data: uploadsData, error: uploadsError },
        { data: stockHistoryData, error: stockHistoryError },
      ] = await Promise.all([ordersPromise, productsPromise, uploadsPromise, stockHistoryPromise]);

      if (ordersError || productsError || uploadsError || stockHistoryError) {
        throw ordersError || productsError || uploadsError || stockHistoryError;
      }

      const totalRevenue = revenueData.reduce((sum, order) => sum + (order.total || 0), 0);
      const lowStockCount = productsData.filter(p => p.stock < 10).length;

      setStats({
        totalOrders: totalOrders || 0,
        totalProducts: totalProducts || 0,
        lowStock: lowStockCount || 0,
        revenue: totalRevenue || 0,
      });

      const platformCounts = uploadsData.reduce((acc, upload) => {
        acc[upload.platform] = (acc[upload.platform] || 0) + (upload.total_orders || 0);
        return acc;
      }, {});

      const totalPlatformOrders = Object.values(platformCounts).reduce((sum, count) => sum + count, 0);
      
      const platformPercentages = {};
      for (const platform in platformCounts) {
        platformPercentages[platform] = {
            totalOrders: platformCounts[platform],
            percentage: totalPlatformOrders > 0 ? Math.round((platformCounts[platform] / totalPlatformOrders) * 100) : 0,
        }
      }
      setPlatformData(platformPercentages);

      const masterProductsAdded = (productsData || []).map(p => ({
          type: 'Produk baru ditambahkan',
          description: p.name,
          timestamp: p.created_at,
      }));
      
      const uploadsActivities = (uploadsData || []).map(u => ({
          type: 'Upload pesanan baru',
          description: `${u.total_orders} pesanan dari ${u.platform}`,
          timestamp: u.created_at,
      }));
      
      const stockActivities = (stockHistoryData || []).map(s => ({
          type: 'Stok diperbarui',
          description: `${s.product_name} (${s.type === 'in' ? '+' : '-'}${s.quantity}) - ${s.reason}`,
          timestamp: s.created_at,
      }));

      const allActivities = [...uploadsActivities, ...masterProductsAdded, ...stockActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
      setRecentActivities(allActivities);


    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  const statCards = [
    {
      title: 'Total Pesanan',
      value: stats.totalOrders.toLocaleString('id-ID'),
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      description: 'Dari semua platform'
    },
    {
      title: 'Total Produk',
      value: stats.totalProducts.toLocaleString('id-ID'),
      icon: Package,
      color: 'from-green-500 to-emerald-500',
      description: 'Varian produk terdaftar'
    },
    {
      title: 'Stok Menipis',
      value: stats.lowStock.toLocaleString('id-ID'),
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
      description: 'Kurang dari 10 item'
    },
    {
      title: 'Total Pendapatan',
      value: `Rp ${stats.revenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'from-purple-500 to-pink-500',
      description: 'Pendapatan kotor'
    }
  ];

  const quickActions = [
    { label: 'Upload Pesanan', icon: Upload, color: 'blue', path: '/upload' },
    { label: 'Kelola Produk', icon: Package, color: 'green', path: '/master-product' },
    { label: 'Kelola Akun Toko', icon: Store, color: 'orange', path: '/accounts' },
    { label: 'Riwayat Pesanan', icon: Calendar, color: 'purple', path: '/order-history' },
  ];

  if (loading && stats.totalOrders === 0) {
    return <div className="flex justify-center items-center h-full text-white text-lg">Memuat data dasbor...</div>;
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Dashboard Manajemen Pesanan</h1>
        <p className="text-gray-400 text-lg">Kelola pesanan dari semua marketplace Anda dalam satu platform</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="glass-effect border-white/20 card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
       <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-effect border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><BarChart3 className="h-5 w-5" />Aksi Cepat</CardTitle>
              <CardDescription className="text-gray-400">Akses fitur utama dengan cepat</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <Link to={action.path} key={action.label}>
                      <motion.div 
                        whileHover={{ scale: 1.05 }} 
                        className={`p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 cursor-pointer text-center flex flex-col items-center justify-center space-y-2 h-full`}
                      >
                        <Icon className={`h-8 w-8 text-blue-400 mb-2 mx-auto`} />
                        <p className="text-sm font-medium text-white">{action.label}</p>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
           <PlatformStats platformData={platformData} loading={loading} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity activities={recentActivities} loading={loading} />
        </div>
      </motion.div>

    </div>
  );
}

export default Dashboard;
