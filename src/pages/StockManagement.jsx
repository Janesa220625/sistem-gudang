
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, TrendingUp, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function StockManagement() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const savedProducts = JSON.parse(localStorage.getItem('products') || '[]');
    setProducts(savedProducts);
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return 'out-of-stock';
    if (product.stock <= product.minStock) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusLabel = (status) => {
    switch (status) {
      case 'out-of-stock': return 'Habis';
      case 'low-stock': return 'Menipis';
      case 'in-stock': return 'Tersedia';
      default: return 'Unknown';
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out-of-stock': return 'bg-red-500/20 text-red-400';
      case 'low-stock': return 'bg-orange-500/20 text-orange-400';
      case 'in-stock': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    const status = getStockStatus(product);
    return matchesSearch && status === filterStatus;
  });

  const stockStats = {
    total: products.length,
    inStock: products.filter(p => getStockStatus(p) === 'in-stock').length,
    lowStock: products.filter(p => getStockStatus(p) === 'low-stock').length,
    outOfStock: products.filter(p => getStockStatus(p) === 'out-of-stock').length,
    totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0)
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold gradient-text">Manajemen Stok</h1>
        <p className="text-gray-400 text-lg">
          Monitor dan kelola stok produk secara real-time
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stockStats.total}</div>
              <p className="text-xs text-gray-400">Produk terdaftar</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Stok Tersedia</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stockStats.inStock}</div>
              <p className="text-xs text-gray-400">Produk tersedia</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Stok Menipis</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{stockStats.lowStock}</div>
              <p className="text-xs text-gray-400">Perlu restok</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-effect border-white/20 card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Nilai Stok</CardTitle>
              <Package className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                Rp {stockStats.totalValue.toLocaleString('id-ID')}
              </div>
              <p className="text-xs text-gray-400">Total nilai inventori</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass-effect border-white/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari produk berdasarkan nama atau SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 glass-effect border-white/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48 glass-effect border-white/30">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="in-stock">Tersedia</SelectItem>
                    <SelectItem value="low-stock">Stok Menipis</SelectItem>
                    <SelectItem value="out-of-stock">Habis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stock Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Status Stok Produk</CardTitle>
            <CardDescription className="text-gray-400">
              {filteredProducts.length} dari {products.length} produk ditampilkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Produk</TableHead>
                    <TableHead className="text-gray-300">SKU</TableHead>
                    <TableHead className="text-gray-300">Kategori</TableHead>
                    <TableHead className="text-gray-300">Stok Saat Ini</TableHead>
                    <TableHead className="text-gray-300">Min. Stok</TableHead>
                    <TableHead className="text-gray-300">Harga Satuan</TableHead>
                    <TableHead className="text-gray-300">Nilai Stok</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    const stockValue = product.price * product.stock;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="text-white font-medium">{product.name}</TableCell>
                        <TableCell className="text-gray-300">{product.sku}</TableCell>
                        <TableCell className="text-gray-300">{product.category || '-'}</TableCell>
                        <TableCell className="text-gray-300 font-medium">{product.stock}</TableCell>
                        <TableCell className="text-gray-300">{product.minStock}</TableCell>
                        <TableCell className="text-gray-300">
                          Rp {product.price.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          Rp {stockValue.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStockStatusColor(status)}`}>
                            {getStockStatusLabel(status)}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Tidak ada produk yang sesuai dengan filter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Low Stock Alert */}
      {stockStats.lowStock > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-effect border-orange-500/30 bg-orange-500/10">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Peringatan Stok Menipis
              </CardTitle>
              <CardDescription className="text-orange-300">
                {stockStats.lowStock} produk memerlukan restok segera
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {products
                  .filter(p => getStockStatus(p) === 'low-stock' || getStockStatus(p) === 'out-of-stock')
                  .slice(0, 5)
                  .map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-2 rounded bg-orange-500/10">
                      <span className="text-white">{product.name}</span>
                      <span className="text-orange-400 font-medium">
                        {product.stock} / {product.minStock}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default StockManagement;
