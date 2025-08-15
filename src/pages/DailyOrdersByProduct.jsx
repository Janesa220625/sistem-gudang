
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Search, Package, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Helmet } from 'react-helmet';
import Pagination from '@/components/ui/Pagination';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';


function DailyOrdersByProduct() {
  const [orders, setOrders] = useState([]);
  const [storeAccounts, setStoreAccounts] = useState([]);
  const [masterProducts, setMasterProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [platformFilter, setPlatformFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if(!user) return;
    setLoading(true);

    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*, orders(*, daily_uploads(platform, account_name))')
      .eq('orders.user_id', user.id);

    if (orderItemsError) {
      toast({ title: 'Error', description: 'Gagal memuat data item pesanan.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    const { data: accountsData, error: accountsError } = await supabase.from('store_accounts').select('*').eq('user_id', user.id);
    if (!accountsError) setStoreAccounts(accountsData);

    const { data: productsData, error: productsError } = await supabase.from('master_products').select('sku_variant, name').eq('user_id', user.id);
    if (!productsError) setMasterProducts(productsData);

    const masterProductsMap = (productsData || []).reduce((acc, p) => {
        acc[p.sku_variant] = p.name;
        return acc;
    }, {});

    const flattenedOrders = orderItems.map(item => {
        const orderItemCount = orderItems.filter(i => i.order_id === item.order_id).reduce((sum, i) => sum + i.quantity, 0);
        return {
            id: item.id,
            order_creation_date: item.orders.order_creation_date,
            order_sn: item.orders.order_sn,
            product: masterProductsMap[item.product_sku_variant] || item.product_sku_variant,
            sku: item.product_sku_variant,
            quantity: item.quantity,
            total: (item.quantity / orderItemCount) * item.orders.total,
            platform: item.orders.daily_uploads.platform,
            storeAccountName: item.orders.daily_uploads.account_name,
        }
    });

    setOrders(flattenedOrders);
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const filteredOrders = useMemo(() => {
    let data = [...orders];

    if (platformFilter !== 'all') {
      data = data.filter(o => o.platform === platformFilter);
    }
    if (accountFilter !== 'all') {
      data = data.filter(o => o.storeAccountName === accountFilter);
    }
    if (productFilter !== 'all') {
      data = data.filter(o => o.sku === productFilter);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(o => 
        o.order_sn.toLowerCase().includes(lowerSearch) || 
        o.product.toLowerCase().includes(lowerSearch) ||
        o.sku.toLowerCase().includes(lowerSearch)
      );
    }

    data.sort((a, b) => new Date(b.order_creation_date) - new Date(a.order_creation_date));
    return data;
  }, [orders, platformFilter, accountFilter, productFilter, searchTerm]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    return {
      totalOrders: new Set(filteredOrders.map(o => o.order_sn)).size,
      totalItems: filteredOrders.reduce((sum, o) => sum + o.quantity, 0),
      totalRevenue: filteredOrders.reduce((sum, o) => sum + o.total, 0),
    };
  }, [filteredOrders]);

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'shopee': return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      case 'lazada': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'tiktok': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Pesanan Harian per Produk - OrderFlow</title>
        <meta name="description" content="Lihat detail pesanan harian untuk setiap produk." />
      </Helmet>

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Pesanan Harian per Produk</h1>
        <p className="text-gray-400 text-lg">Rincian setiap item yang terjual dari semua pesanan harian.</p>
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Pesanan Unik</CardTitle>
            <ShoppingCart className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalOrders.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Item Terjual</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalItems.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Pendapatan</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">Rp {stats.totalRevenue.toLocaleString('id-ID', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-effect border-white/20">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select value={platformFilter} onValueChange={(value) => { setPlatformFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="glass-effect border-white/30"><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Platform</SelectItem>
                  <SelectItem value="shopee">Shopee</SelectItem>
                  <SelectItem value="lazada">Lazada</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accountFilter} onValueChange={(value) => { setAccountFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="glass-effect border-white/30"><SelectValue placeholder="Akun Toko" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Akun</SelectItem>
                  {storeAccounts.map(account => (
                    <SelectItem key={account.id} value={account.name}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={productFilter} onValueChange={(value) => { setProductFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="glass-effect border-white/30 lg:col-span-2"><SelectValue placeholder="Pilih Produk Varian" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Produk</SelectItem>
                  {masterProducts.map(product => (
                    <SelectItem key={product.sku_variant} value={product.sku_variant}>{product.sku_variant} - {product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Cari No. Pesanan, Produk, atau SKU..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10 glass-effect border-white/30" />
              </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Calendar className="h-5 w-5" />Daftar Pesanan Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Tanggal Pesanan</TableHead>
                    <TableHead className="text-gray-300">No. Pesanan</TableHead>
                    <TableHead className="text-gray-300">Produk / SKU Varian</TableHead>
                    <TableHead className="text-gray-300">Qty</TableHead>
                    <TableHead className="text-gray-300 text-right">Total Harga</TableHead>
                    <TableHead className="text-gray-300">Platform / Toko</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-400">Memuat data...</TableCell></TableRow>
                  ) : paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                       <TableCell className="text-gray-300">
                        {new Date(order.order_creation_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </TableCell>
                      <TableCell className="text-white font-medium">{order.order_sn}</TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{order.product}</div>
                        <div className="text-sm text-cyan-400">{order.sku}</div>
                      </TableCell>
                      <TableCell className="text-white font-bold">{order.quantity}</TableCell>
                      <TableCell className="text-white font-medium text-right">Rp {order.total.toLocaleString('id-ID', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                           <span className={`px-2 py-1 rounded-full text-xs capitalize ${getPlatformColor(order.platform)}`}>{order.platform}</span>
                           <span className="text-sm text-blue-300">{order.storeAccountName}</span>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!loading && paginatedOrders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 font-semibold">Data pesanan tidak ditemukan</p>
                <p className="text-gray-500 text-sm">Coba sesuaikan filter atau upload data pesanan terlebih dahulu.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="w-full" />
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default DailyOrdersByProduct;
