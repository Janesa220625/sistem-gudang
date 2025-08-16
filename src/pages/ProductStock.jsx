import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";
import Pagination from "@/components/ui/Pagination";
import { Helmet } from "react-helmet";

function ProductStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const ITEMS_PER_PAGE = 10;

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("master_products")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: `Gagal memuat stok produk: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getStockStatus = (product) => {
    const stock = product.stock || 0;
    if (stock === 0) return "out-of-stock";
    // Anggap minStock adalah 10 jika tidak diset
    if (stock <= 10) return "low-stock";
    return "in-stock";
  };

  const getStockStatusLabel = (status) => {
    switch (status) {
      case "out-of-stock":
        return "Habis";
      case "low-stock":
        return "Menipis";
      case "in-stock":
        return "Tersedia";
      default:
        return "Unknown";
    }
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case "out-of-stock":
        return "bg-red-500/20 text-red-400";
      case "low-stock":
        return "bg-orange-500/20 text-orange-400";
      case "in-stock":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku_variant.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterStatus === "all") return matchesSearch;

      const status = getStockStatus(product);
      return matchesSearch && status === filterStatus;
    });
    return filtered;
  }, [products, searchTerm, filterStatus]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const stockStats = useMemo(
    () => ({
      totalVariants: products.length,
      inStock: products.filter((p) => getStockStatus(p) === "in-stock").length,
      lowStock: products.filter((p) => getStockStatus(p) === "low-stock")
        .length,
      outOfStock: products.filter((p) => getStockStatus(p) === "out-of-stock")
        .length,
      totalValue: products.reduce(
        (sum, p) => sum + (p.cost_price || 0) * (p.stock || 0),
        0
      ),
    }),
    [products]
  );

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Stok Produk - OrderFlow</title>
        <meta
          name="description"
          content="Monitor dan kelola stok produk secara real-time"
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold gradient-text">
          Manajemen Stok Produk
        </h1>
        <p className="text-gray-400 text-lg">
          Monitor dan kelola stok produk secara real-time
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <Card className="glass-effect border-white/20 card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Varian
            </CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stockStats.totalVariants}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-white/20 card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Stok Menipis
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-400">
              {stockStats.lowStock}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-white/20 card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Stok Habis
            </CardTitle>
            <Package className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {stockStats.outOfStock}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-white/20 card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Nilai Stok
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              Rp {stockStats.totalValue.toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
      </div>

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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Status Stok Produk</CardTitle>
            <CardDescription className="text-gray-400">
              {filteredProducts.length} dari {products.length} produk
              ditampilkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Produk</TableHead>
                    <TableHead className="text-gray-300">SKU Varian</TableHead>
                    <TableHead className="text-gray-300">Kategori</TableHead>
                    <TableHead className="text-gray-300">
                      Stok Saat Ini
                    </TableHead>
                    <TableHead className="text-gray-300">Nilai Stok</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-400 py-10"
                      >
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProducts.map((product) => {
                      const status = getStockStatus(product);
                      const stockValue =
                        (product.cost_price || 0) * (product.stock || 0);
                      return (
                        <TableRow key={product.id}>
                          <TableCell className="text-white font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-cyan-400">
                            {product.sku_variant}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {product.category || "-"}
                          </TableCell>
                          <TableCell className="text-white font-bold">
                            {product.stock || 0}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            Rp {stockValue.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${getStockStatusColor(
                                status
                              )}`}
                            >
                              {getStockStatusLabel(status)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {!loading && paginatedProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">
                  Tidak ada produk yang sesuai dengan filter
                </p>
              </div>
            )}
          </CardContent>
          {totalPages > 1 && (
            <CardFooter>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="w-full"
              />
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

export default ProductStock;
