import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart2, Search, DollarSign } from "lucide-react";
import {
  Card,
  CardContent,
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
import Pagination from "@/components/ui/Pagination";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";

function ProductAnalysis() {
  const [productData, setProductData] = useState([]);
  const [storeAccounts, setStoreAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [platformFilter, setPlatformFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("quantity");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*, order_items(*), daily_uploads(platform, account_name)")
        .eq("user_id", user.id);

      if (ordersError) throw ordersError;

      const { data: masterProducts, error: productsError } = await supabase
        .from("master_products")
        .select("*")
        .eq("user_id", user.id);

      if (productsError) throw productsError;

      const masterProductsMap = masterProducts.reduce((acc, p) => {
        acc[p.sku_variant] = p;
        return acc;
      }, {});

      const aggregatedData = orders
        .flatMap((order) =>
          order.order_items.map((item) => ({
            ...item,
            order_total: order.total,
            platform: order.daily_uploads.platform,
            account_name: order.daily_uploads.account_name,
          }))
        )
        .reduce((acc, item) => {
          const skuVarian = item.product_sku_variant;
          if (!acc[skuVarian]) {
            const masterProduct = masterProductsMap[skuVarian];
            acc[skuVarian] = {
              sku: skuVarian,
              productName: masterProduct?.name || skuVarian,
              quantity: 0,
              revenue: 0,
              cost: 0,
              profit: 0,
              orderCount: 0,
              platforms: new Set(),
              accounts: new Set(),
            };
          }

          const masterProduct = masterProductsMap[skuVarian];
          const productCost = masterProduct?.cost_price || 0;
          const itemCost = productCost * item.quantity;

          // NOTE: This is a simplified revenue calculation. It proportionally distributes the order total
          // based on the quantity of this item relative to the total items in the order.
          // For more accuracy, future improvements could involve handling discounts, shipping,
          // and other fees at a more granular level.
          const orderItemTotalQuantity = orders
            .find((o) => o.id === item.order_id)
            .order_items.reduce((sum, i) => sum + i.quantity, 0);
          const itemRevenue =
            orderItemTotalQuantity > 0
              ? (item.quantity / orderItemTotalQuantity) * item.order_total
              : 0;

          acc[skuVarian].quantity += item.quantity;
          acc[skuVarian].revenue += itemRevenue;
          acc[skuVarian].cost += itemCost;
          acc[skuVarian].profit += itemRevenue - itemCost;
          acc[skuVarian].orderCount += 1;
          acc[skuVarian].platforms.add(item.platform);
          acc[skuVarian].accounts.add(item.account_name);
          return acc;
        }, {});

      const productArray = Object.values(aggregatedData).map((p) => ({
        ...p,
        platforms: Array.from(p.platforms),
        accounts: Array.from(p.accounts),
      }));

      setProductData(productArray);

      const { data: accountsData, error: accountsError } = await supabase
        .from("store_accounts")
        .select("*")
        .eq("user_id", user.id);
      if (accountsError) throw accountsError;
      setStoreAccounts(accountsData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: `Gagal memuat data analisis: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo(() => {
    let data = [...productData];

    if (platformFilter !== "all") {
      data = data.filter((p) => p.platforms.includes(platformFilter));
    }
    if (accountFilter !== "all") {
      data = data.filter((p) => p.accounts.includes(accountFilter));
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(
        (p) =>
          p.sku.toLowerCase().includes(lowerSearch) ||
          p.productName.toLowerCase().includes(lowerSearch)
      );
    }

    data.sort((a, b) => b[sortBy] - a[sortBy]);

    return data;
  }, [productData, platformFilter, accountFilter, searchTerm, sortBy]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const dataToUse = filteredData;
    return {
      uniqueProducts: dataToUse.length,
      totalItemsSold: dataToUse.reduce((sum, p) => sum + p.quantity, 0),
      totalRevenue: dataToUse.reduce((sum, p) => sum + p.revenue, 0),
      totalProfit: dataToUse.reduce((sum, p) => sum + p.profit, 0),
    };
  }, [filteredData]);

  const getPlatformColor = (platform) => {
    switch (platform) {
      case "shopee":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      case "lazada":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "tiktok":
        return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold gradient-text">Analisis Produk</h1>
        <p className="text-gray-400 text-lg">
          Pahami performa setiap varian produk di semua marketplace
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Pendapatan
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              Rp{" "}
              {stats.totalRevenue.toLocaleString("id-ID", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Estimasi Profit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              Rp{" "}
              {stats.totalProfit.toLocaleString("id-ID", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Varian Unik Terjual
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.uniqueProducts}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-effect border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Total Item Terjual
            </CardTitle>
            <BarChart2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalItemsSold.toLocaleString("id-ID")}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass-effect border-white/20">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari SKU Varian atau Nama Produk..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 glass-effect border-white/30"
                />
              </div>
              <Select
                value={platformFilter}
                onValueChange={(value) => {
                  setPlatformFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="glass-effect border-white/30">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Platform</SelectItem>
                  <SelectItem value="shopee">Shopee</SelectItem>
                  <SelectItem value="lazada">Lazada</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={accountFilter}
                onValueChange={(value) => {
                  setAccountFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="glass-effect border-white/30">
                  <SelectValue placeholder="Akun Toko" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Akun</SelectItem>
                  {storeAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.name}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="glass-effect border-white/30">
                  <SelectValue placeholder="Urutkan Berdasarkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantity">Penjualan Terbanyak</SelectItem>
                  <SelectItem value="revenue">Pendapatan Tertinggi</SelectItem>
                  <SelectItem value="profit">Profit Tertinggi</SelectItem>
                </SelectContent>
              </Select>
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
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Peringkat Produk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Peringkat</TableHead>
                    <TableHead className="text-gray-300">
                      SKU Varian / Produk
                    </TableHead>
                    <TableHead className="text-gray-300 text-right">
                      Terjual
                    </TableHead>
                    <TableHead className="text-gray-300 text-right">
                      Pendapatan
                    </TableHead>
                    <TableHead className="text-gray-300 text-right">
                      Estimasi Profit
                    </TableHead>
                    <TableHead className="text-gray-300">Platform</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan="6"
                        className="text-center text-gray-400 py-10"
                      >
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan="6"
                        className="text-center text-gray-400 py-12"
                      >
                        <BarChart2 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                        <p className="font-semibold">
                          Data produk tidak ditemukan
                        </p>
                        <p className="text-sm text-gray-500">
                          Coba sesuaikan filter atau upload data pesanan
                          terlebih dahulu.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((product, index) => (
                      <TableRow key={product.sku}>
                        <TableCell className="text-lg font-bold text-gray-400">
                          {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-white">
                            {product.productName}
                          </div>
                          <div className="text-sm text-cyan-400">
                            {product.sku}
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-bold text-right">
                          {product.quantity.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-white font-medium text-right">
                          Rp{" "}
                          {product.revenue.toLocaleString("id-ID", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell
                          className={`font-bold text-right ${
                            product.profit >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          Rp{" "}
                          {product.profit.toLocaleString("id-ID", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {product.platforms.map((p) => (
                              <span
                                key={p}
                                className={`px-2 py-1 rounded-full text-xs capitalize ${getPlatformColor(
                                  p
                                )}`}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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

export default ProductAnalysis;
