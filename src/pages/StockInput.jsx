import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import StockInputForm from '@/components/stock/StockInputForm';
import StockHistoryTable from '@/components/stock/StockHistoryTable';
import StockStatsCards from '@/components/stock/StockStatsCards';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

function StockInput() {
  const [products, setProducts] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if(!user) return;
    setLoading(true);

    try {
        const productsPromise = supabase
          .from('master_products')
          .select('*')
          .eq('user_id', user.id);

        const historyPromise = supabase
          .from('stock_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { descending: true });
          
        const [{ data: productsData, error: productsError }, { data: historyData, error: historyError }] = await Promise.all([productsPromise, historyPromise]);

        if (productsError) throw productsError;
        if (historyError) throw historyError;
        
        setProducts(productsData || []);
        setStockHistory(historyData || []);

    } catch (error) {
        toast({ title: "Error", description: `Gagal memuat data: ${error.message}`, variant: "destructive"});
    } finally {
        setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStockUpdate = async (formData) => {
    const product = products.find(p => p.sku_variant === formData.productSkuVarian);
    if (!product) {
      toast({ title: "Error", description: "Produk varian tidak ditemukan", variant: "destructive" });
      return false;
    }

    const quantity = parseInt(formData.quantity, 10);
    if(isNaN(quantity) || quantity <= 0) {
      toast({ title: "Error", description: "Jumlah harus berupa angka positif", variant: "destructive" });
      return false;
    }

    const currentStock = product.stock || 0;
    const newStock = formData.type === 'in' ? currentStock + quantity : currentStock - quantity;

    if (newStock < 0) {
      toast({ title: "Error", description: "Stok tidak boleh kurang dari 0", variant: "destructive" });
      return false;
    }

    try {
        const { error: updateError } = await supabase
          .from('master_products')
          .update({ stock: newStock })
          .eq('id', product.id);

        if (updateError) throw updateError;
        
        const historyEntry = {
          user_id: user.id,
          product_sku_variant: formData.productSkuVarian,
          product_name: product.name,
          type: formData.type,
          quantity: quantity,
          previous_stock: currentStock,
          new_stock: newStock,
          reason: formData.reason,
          notes: formData.notes,
        };
        
        const { error: historyError } = await supabase
            .from('stock_history')
            .insert(historyEntry);
            
        if (historyError) throw historyError;

        fetchData();

        toast({
          title: "Stok Berhasil Diperbarui",
          description: `Stok ${product.name} (${product.sku_variant}) ${formData.type === 'in' ? 'ditambah' : 'dikurangi'} sebanyak ${quantity}`
        });
        return true;
        
    } catch(error) {
        toast({ title: "Error", description: `Gagal memperbarui stok: ${error.message}`, variant: "destructive" });
        return false;
    }
  };
  
  const filteredHistory = useMemo(() => stockHistory.filter(entry =>
    entry.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.product_sku_variant.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reason.toLowerCase().includes(searchTerm.toLowerCase())
  ), [stockHistory, searchTerm]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Input Stok Produk</h1>
        <p className="text-gray-400 text-lg">Kelola pergerakan stok masuk dan keluar untuk setiap varian produk</p>
      </motion.div>

      <StockStatsCards products={products} stockHistory={stockHistory} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5" /> Input Pergerakan Stok
            </CardTitle>
            <CardDescription className="text-gray-400">Pilih produk varian untuk menambah atau mengurangi stok</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-center text-gray-400">Memuat produk...</p> : <StockInputForm products={products} onSubmit={handleStockUpdate} />}
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="glass-effect border-white/20">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari riwayat berdasarkan produk, SKU, atau alasan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-effect border-white/30"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <StockHistoryTable history={filteredHistory} loading={loading} />
      </motion.div>
    </div>
  );
}

export default StockInput;