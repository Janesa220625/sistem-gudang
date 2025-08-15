
    import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Package, Inbox, ShoppingCart, FileText, BarChart2, History, UploadCloud } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const navLinks = [
  { to: "/", icon: Home, text: "Dasbor" },
  { to: "/master-product", icon: Package, text: "Master Produk" },
  { to: "/product-stock", icon: Inbox, text: "Stok Produk" },
  { to: "/product-inbound", icon: UploadCloud, text: "Input Masuk Produk" },
  { to: "/order-calculation", icon: ShoppingCart, text: "Perhitungan Pesanan" },
  { to: "/received-orders", icon: FileText, text: "Data Pesanan Diterima" },
  { to: "/order-history", icon: History, text: "Riwayat Pesanan" },
  { to: "/reports", icon: BarChart2, text: "Laporan" },
];

const Sidebar = () => {
  const { toast } = useToast();

  const handleNotImplemented = (e, path) => {
    if (path !== '/') {
      e.preventDefault();
      toast({
        title: "Fitur Belum Tersedia",
        description: "🚧 Fitur ini belum diimplementasikan—tapi jangan khawatir! Anda dapat memintanya di prompt berikutnya! 🚀",
        variant: "destructive",
      });
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col">
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400">OrderFlow</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manajemen Pesanan</p>
      </div>
      <nav className="flex-1 px-4 py-2">
        <ul>
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                onClick={(e) => handleNotImplemented(e, link.to)}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 my-1 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <link.icon className="w-5 h-5 mr-3" />
                <span>{link.text}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          © 2025 OrderFlow. Dibuat dengan ❤️ oleh Horizons.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
  