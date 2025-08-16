import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, Filter, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Pagination from '@/components/ui/Pagination';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

function DailyUploads() {
  const [uploads, setUploads] = useState([]);
  const [storeAccounts, setStoreAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const ITEMS_PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    if(!user) return;
    setLoading(true);

    try {
      const uploadsPromise = supabase
        .from('daily_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      const accountsPromise = supabase
        .from('store_accounts')
        .select('*')
        .eq('user_id', user.id);

      const [{ data: uploadsData, error: uploadsError }, { data: accountsData, error: accountsError }] = await Promise.all([uploadsPromise, accountsPromise]);

      if (uploadsError) throw uploadsError;
      if (accountsError) throw accountsError;

      setUploads(uploadsData || []);
      setStoreAccounts(accountsData || []);

    } catch (error) {
       toast({ title: 'Error', description: `Gagal memuat data: ${error.message}`, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUploads = useMemo(() => {
    let filtered = [...uploads];
    if (platformFilter !== 'all') {
      filtered = filtered.filter(upload => upload.platform === platformFilter);
    }
    if (accountFilter !== 'all') {
      filtered = filtered.filter(upload => upload.account_name === accountFilter);
    }
    return filtered;
  }, [uploads, platformFilter, accountFilter]);

  const paginatedUploads = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUploads.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUploads, currentPage]);

  const totalPages = Math.ceil(filteredUploads.length / ITEMS_PER_PAGE);

  const getPlatformName = (platform) => {
    switch (platform) {
      case 'shopee': return 'Shopee';
      case 'lazada': return 'Lazada';
      case 'tiktok': return 'TikTok';
      default: return 'Unknown';
    }
  };
  
  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'shopee': return 'bg-orange-500/20 text-orange-400';
      case 'lazada': return 'bg-blue-500/20 text-blue-400';
      case 'tiktok': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Rekap Upload Harian</h1>
        <p className="text-gray-400 text-lg">
          Lacak semua file pesanan yang telah Anda unggah
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <Select value={platformFilter} onValueChange={(value) => { setPlatformFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="glass-effect border-white/30">
                  <SelectValue placeholder="Pilih Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Platform</SelectItem>
                  <SelectItem value="shopee">Shopee</SelectItem>
                  <SelectItem value="lazada">Lazada</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full">
              <Select value={accountFilter} onValueChange={(value) => { setAccountFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="glass-effect border-white/30">
                  <SelectValue placeholder="Pilih Akun Toko" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Akun</SelectItem>
                  {storeAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.name}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Riwayat Unggahan
            </CardTitle>
            <CardDescription className="text-gray-400">
              Menampilkan {paginatedUploads.length} dari {filteredUploads.length} file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Tanggal Upload</TableHead>
                    <TableHead className="text-gray-300">Nama File</TableHead>
                    <TableHead className="text-gray-300">Platform</TableHead>
                    <TableHead className="text-gray-300">Akun Toko</TableHead>
                    <TableHead className="text-gray-300 text-right">Jumlah Pesanan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-10">Memuat data...</TableCell></TableRow>
                  ) : paginatedUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="text-gray-300">
                        {new Date(upload.upload_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-white font-medium flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        {upload.file_name}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPlatformColor(upload.platform)}`}>
                          {getPlatformName(upload.platform)}
                        </span>
                      </TableCell>
                      <TableCell className="text-blue-400 font-semibold">{upload.account_name}</TableCell>
                      <TableCell className="text-white font-bold text-right">{upload.total_orders}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!loading && paginatedUploads.length === 0 && (
              <div className="text-center py-12">
                <CalendarCheck className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 font-semibold">Belum ada riwayat unggahan</p>
                <p className="text-gray-500 text-sm">Silakan upload file pesanan pertama Anda.</p>
              </div>
            )}
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

export default DailyUploads;