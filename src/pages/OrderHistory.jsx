
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { History, Search, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Pagination from '@/components/ui/Pagination';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeAccounts, setStoreAccounts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const ITEMS_PER_PAGE = 10;

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          daily_uploads ( platform, account_name )
        `)
        .eq('user_id', user.id);

      const { data, error } = await query;
      if (error) throw error;

      const formattedData = data.map(d => ({
        ...d,
        platform: d.daily_uploads?.platform,
        storeAccountName: d.daily_uploads?.account_name,
      }));
      setOrders(formattedData);
    } catch (error) {
      toast({ title: 'Gagal memuat pesanan', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchStoreAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('store_accounts').select('*').eq('user_id', user.id);
      if (error) throw error;
      setStoreAccounts(data);
    } catch (error) {
       toast({ title: 'Gagal memuat akun toko', description: error.message, variant: 'destructive' });
    }
  }, [user, toast]);

  useEffect(() => {
    fetchOrders();
    fetchStoreAccounts();
  }, [fetchOrders, fetchStoreAccounts]);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_sn?.toLowerCase().includes(lowerCaseSearch) ||
        order.tracking_number?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    if (platformFilter !== 'all') {
      filtered = filtered.filter(order => order.platform === platformFilter);
    }

    if (accountFilter !== 'all') {
      filtered = filtered.filter(order => order.storeAccountName === accountFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    filtered.sort((a, b) => new Date(b.order_creation_date) - new Date(a.order_creation_date));
    return filtered;
  }, [orders, searchTerm, platformFilter, statusFilter, accountFilter]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  const deleteOrder = async (orderId) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      toast({ title: "Pesanan Dihapus", description: "Pesanan berhasil dihapus.", variant: "destructive" });
      fetchOrders();
    } catch (error) {
      toast({ title: 'Gagal menghapus pesanan', description: error.message, variant: 'destructive' });
    }
  };

  const viewOrderDetails = (order) => {
    toast({
      title: "🚧 Fitur ini belum diimplementasikan—tapi jangan khawatir! Anda bisa memintanya di prompt berikutnya! 🚀"
    });
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'shopee': return 'bg-orange-500/20 text-orange-400';
      case 'lazada': return 'bg-blue-500/20 text-blue-400';
      case 'tiktok': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPlatformName = (platform) => {
    switch (platform) {
      case 'shopee': return 'Shopee';
      case 'lazada': return 'Lazada';
      case 'tiktok': return 'TikTok';
      default: return 'Unknown';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'processed': return 'Diproses';
      case 'delivered': return 'Selesai';
      case 'returned': return 'Retur';
      case 'failed_delivery': return 'Gagal Kirim';
      default: return 'Lainnya';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed': return 'bg-blue-500/20 text-blue-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'returned': return 'bg-yellow-500/20 text-yellow-400';
      case 'failed_delivery': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Riwayat Pesanan</h1>
        <p className="text-gray-400 text-lg">Kelola dan pantau semua pesanan yang telah diterima</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-effect border-white/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative md:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Cari No. Pesanan/Resi..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10 glass-effect border-white/30" />
              </div>
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
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="glass-effect border-white/30"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="processed">Diproses</SelectItem>
                  <SelectItem value="delivered">Selesai</SelectItem>
                  <SelectItem value="returned">Retur</SelectItem>
                  <SelectItem value="failed_delivery">Gagal Kirim</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><History className="h-5 w-5" />Daftar Pesanan</CardTitle>
            <CardDescription className="text-gray-400">{filteredOrders.length} dari {orders.length} pesanan ditampilkan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">No. Pesanan</TableHead>
                    <TableHead className="text-gray-300">Akun Toko</TableHead>
                    <TableHead className="text-gray-300">Total</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Tanggal</TableHead>
                    <TableHead className="text-gray-300 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan="6" className="text-center text-gray-400 py-10">Memuat data pesanan...</TableCell></TableRow>
                  ) : paginatedOrders.length > 0 ? paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-white font-medium">{order.order_sn}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getPlatformColor(order.platform)}`}>{getPlatformName(order.platform)}</span>
                          <span className="text-gray-300">{order.storeAccountName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-green-400 font-medium">Rp {order.total?.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">{new Date(order.order_creation_date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex space-x-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => viewOrderDetails(order)} className="glass-effect border-white/30"><Eye className="h-3 w-3" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button size="sm" variant="destructive"><Trash2 className="h-3 w-3" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                    <AlertDialogDescription>Tindakan ini akan menghapus pesanan secara permanen. Data tidak bisa dikembalikan.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteOrder(order.id)}>Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow><TableCell colSpan="6" className="text-center text-gray-400 py-10">{orders.length === 0 ? 'Belum ada pesanan' : 'Tidak ada pesanan cocok'}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          {totalPages > 1 && (
            <CardFooter>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="w-full" />
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

export default OrderHistory;
