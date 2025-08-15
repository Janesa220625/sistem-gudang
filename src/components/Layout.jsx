
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Upload, Package, Plus, History, Menu, X, CalendarCheck, Store, LineChart, Box, FileClock, LogIn, CheckCircle, LogOut, User, Undo2, Truck as TruckOff } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const adminMenu = [
  {
    title: 'Dasbor',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    ],
  },
  {
    title: 'Pesanan',
    items: [
      { icon: Upload, label: 'Upload Pesanan', path: '/upload' },
      { icon: CalendarCheck, label: 'Upload Harian', path: '/daily-uploads' },
      { icon: History, label: 'Riwayat Pesanan', path: '/order-history' },
      { icon: FileClock, label: 'Pesanan Harian Produk', path: '/daily-orders-by-product'},
      { icon: CheckCircle, label: 'Pesanan Diterima', path: '/received-orders' },
      { icon: Undo2, label: 'Pesanan Retur', path: '/returned-orders' },
      { icon: TruckOff, label: 'Gagal Kirim', path: '/failed-delivery' },
    ],
  },
  {
    title: 'Produk & Stok',
    items: [
      { icon: Package, label: 'Master Produk', path: '/master-product' },
      { icon: LogIn, label: 'Input Masuk Produk', path: '/product-inbound' },
      { icon: Plus, label: 'Input Stok Manual', path: '/stock-input' },
      { icon: LineChart, label: 'Analisis Produk', path: '/product-analysis' },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
       { icon: Store, label: 'Akun Toko', path: '/accounts' },
    ]
  }
];

const userMenu = [
  {
    title: 'Dasbor',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    ],
  },
  {
    title: 'Pesanan',
    items: [
      { icon: History, label: 'Riwayat Pesanan', path: '/order-history' },
      { icon: FileClock, label: 'Pesanan Harian Produk', path: '/daily-orders-by-product'},
    ],
  },
  {
    title: 'Produk & Stok',
    items: [
      { icon: LineChart, label: 'Analisis Produk', path: '/product-analysis' },
    ],
  }
];


function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, loading: authLoading } = useAuth();
  
  const menuSections = user?.role === 'admin' ? adminMenu : userMenu;

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
      toast({ title: 'Berhasil Keluar', description: 'Anda telah berhasil logout.' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="glass-effect border-white/30"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 30, stiffness: 220 }}
            className="fixed left-0 top-0 h-full w-64 glass-effect border-r border-white/20 z-40 flex flex-col"
          >
            <div className="p-6 flex-grow flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Box className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">OrderFlow</h1>
                  <p className="text-sm text-gray-400">Manajemen Pesanan</p>
                </div>
              </div>

              <nav className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-hide">
                {menuSections.map(section => (
                  <div key={section.title}>
                    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">{section.title}</h2>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => sidebarOpen && setSidebarOpen(false)}
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                              isActive 
                                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30' 
                                : 'hover:bg-white/10'
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                              {item.label}
                            </span>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>
             <div className="p-4 border-t border-white/10">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                    <p className="text-xs text-green-400 capitalize">{user?.role}</p>
                  </div>
               </div>
                <Button onClick={handleLogout} disabled={authLoading} variant="outline" className="w-full glass-effect border-white/30 hover:bg-red-500/20 hover:text-red-400">
                    <LogOut className="mr-2 h-4 w-4"/>
                    {authLoading ? 'Keluar...' : 'Keluar'}
                </Button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-64 min-h-screen">
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default Layout;
