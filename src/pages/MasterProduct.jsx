import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import Pagination from '@/components/ui/Pagination';

// Komponen Form untuk menambah/mengedit produk. Tidak ada input stok di sini.
const ProductForm = ({ product, onSave, onCancel, existingSkus }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    color: '',
    size: '',
    cost_price: '',
    category: '',
  });

  const [skuError, setSkuError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        color: product.color || '',
        size: product.size || '',
        cost_price: product.cost_price || '',
        category: product.category || '',
      });
    } else {
      setFormData({ sku: '', name: '', color: '', size: '', cost_price: '', category: '' });
    }
  }, [product]);

  const generatedSkuVariant = useMemo(() => {
    return `${formData.sku}-${formData.color}-${formData.size}`.toUpperCase().replace(/\s+/g, '-');
  }, [formData.sku, formData.color, formData.size]);

  useEffect(() => {
      if(existingSkus.includes(generatedSkuVariant) && (!product || generatedSkuVariant !== product.sku_variant)) {
        setSkuError('SKU Varian ini sudah ada. Mohon gunakan kombinasi unik.');
      } else {
        setSkuError('');
      }
  }, [generatedSkuVariant, existingSkus, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if(skuError) {
        toast({ title: "Error", description: skuError, variant: "destructive" });
        return;
    }
    onSave({ ...formData, sku_variant: generatedSkuVariant, cost_price: parseFloat(formData.cost_price) || 0, id: product?.id });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="text-white">{product ? 'Edit Produk Varian' : 'Tambah Produk Varian Baru'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="sku" value={formData.sku} onChange={handleChange} placeholder="SKU Induk (cth: SEPATU-01)" required className="glass-effect border-white/30" />
              <Input name="name" value={formData.name} onChange={handleChange} placeholder="Nama Produk" required className="glass-effect border-white/30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="color" value={formData.color} onChange={handleChange} placeholder="Warna (cth: HITAM)" required className="glass-effect border-white/30" />
              <Input name="size" value={formData.size} onChange={handleChange} placeholder="Ukuran (cth: 42)" required className="glass-effect border-white/30" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="cost_price" type="number" value={formData.cost_price} onChange={e => setFormData(prev => ({ ...prev, cost_price: e.target.value }))} placeholder="Harga Modal (Rp)" required className="glass-effect border-white/30" />
              <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                <SelectTrigger className="glass-effect border-white/30"><SelectValue placeholder="Pilih Kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEPATU">SEPATU</SelectItem>
                  <SelectItem value="SANDAL">SANDAL</SelectItem>
                  <SelectItem value="KAOS">KAOS</SelectItem>
                  <SelectItem value="AKSESORIS">AKSESORIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2 text-center text-gray-400 text-sm">
              SKU Varian: <span className="font-bold text-white">{generatedSkuVariant}</span>
              {skuError && <p className="text-red-400 text-xs mt-1">{skuError}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
              <Button type="submit" disabled={!!skuError}>{product ? 'Simpan Perubahan' : 'Tambah Produk'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MasterProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const ITEMS_PER_PAGE = 10;

  const existingSkus = useMemo(() => products.map(p => p.sku_variant), [products]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('master_products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Gagal memuat produk: " + error.message, variant: "destructive" });
    } else {
      setProducts(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = products.filter(p =>
        p.sku.toLowerCase().includes(lowerSearch) ||
        p.name.toLowerCase().includes(lowerSearch) ||
        p.sku_variant.toLowerCase().includes(lowerSearch) ||
        (p.category && p.category.toLowerCase().includes(lowerSearch))
      );
    }
    return filtered;
  }, [products, searchTerm]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const handleSaveProduct = async (productData) => {
    if (editingProduct) {
      // Logika untuk mengedit produk. Tidak menyertakan field 'stock'.
      const { error } = await supabase
        .from('master_products')
        .update({
          sku: productData.sku,
          name: productData.name,
          color: productData.color,
          size: productData.size,
          sku_variant: productData.sku_variant,
          cost_price: productData.cost_price,
          category: productData.category
        })
        .eq('id', editingProduct.id);
      
      if (error) {
        toast({ title: "Error", description: `Gagal memperbarui produk: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Sukses!", description: "Produk berhasil diperbarui." });
        fetchProducts();
      }
    } else {
      // Logika untuk menambah produk baru. Stok diinisialisasi menjadi 0.
      const { error } = await supabase
        .from('master_products')
        .insert({
          ...productData,
          user_id: user.id,
          stock: 0, // Stok awal selalu 0
        });
      
      if (error) {
        toast({ title: "Error", description: `Gagal menambah produk: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Sukses!", description: "Produk baru berhasil ditambahkan." });
        fetchProducts();
      }
    }
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    const { error } = await supabase.from('master_products').delete().eq('id', productId);
    if (error) {
      toast({ title: "Error", description: `Gagal menghapus produk: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "Dihapus!", description: "Produk telah dihapus.", variant: "destructive" });
      fetchProducts();
    }
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Master Produk - OrderFlow</title>
        <meta name="description" content="Kelola semua varian produk Anda di satu tempat." />
      </Helmet>

      {isFormOpen && <ProductForm product={editingProduct} onSave={handleSaveProduct} onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }} existingSkus={existingSkus} />}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Master Produk</h1>
          <p className="text-gray-400 text-lg">Pusat data untuk semua varian produk Anda.</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Tambah Varian
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5" /> Daftar Produk
            </CardTitle>
            <CardDescription className="text-gray-400">
                Total {filteredProducts.length} produk ditemukan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari SKU, Nama, Varian, atau Kategori..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 glass-effect border-white/30"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Nama Produk</TableHead>
                    <TableHead className="text-gray-300">SKU Varian</TableHead>
                    <TableHead className="text-gray-300">Kategori</TableHead>
                    <TableHead className="text-gray-300">Modal</TableHead>
                    {/* Kolom Stok dihapus dari sini */}
                    <TableHead className="text-gray-300 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-10">Memuat data...</TableCell></TableRow>
                  ) : paginatedProducts.map(product => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-white">{product.name}</TableCell>
                      <TableCell className="text-cyan-400">{product.sku_variant}</TableCell>
                      <TableCell className="text-gray-300">{product.category}</TableCell>
                      <TableCell className="text-green-400">Rp {(product.cost_price || 0).toLocaleString('id-ID')}</TableCell>
                      {/* Sel untuk Stok dihapus dari sini */}
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                           <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setIsFormOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Ini akan menghapus varian produk secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Hapus</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!loading && paginatedProducts.length === 0 && (
                <div className="text-center py-16">
                    <Package className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white">Produk tidak ditemukan</h3>
                    <p className="text-gray-400">Coba kata kunci lain atau <a href="#" onClick={(e) => { e.preventDefault(); setEditingProduct(null); setIsFormOpen(true); }} className="text-blue-400 hover:underline">tambahkan produk baru</a>.</p>
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
};

export default MasterProduct;
