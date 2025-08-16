import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Search,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
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
import { Helmet } from "react-helmet";
import Pagination from "@/components/ui/Pagination";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/components/ui/use-toast";

function DailyOrdersByProduct() {
  const [orderItems, setOrderItems] = useState([]);
  const [storeAccounts, setStoreAccounts] = useState([]);
  const [masterProductsMap, setMasterProductsMap] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const [platformFilter, setPlatformFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [validationFilter, setValidationFilter] = useState("all"); // Filter baru untuk status validasi
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Mengambil semua item pesanan beserta data pesanan dan unggahan terkait
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*, orders(*, daily_uploads(platform, account_name))")
        .eq("orders.user_id", user.id);

      if (itemsError) throw itemsError;

      // Mengambil data akun toko dan master produk secara bersamaan
      const accountsPromise = supabase
        .from("store_accounts")
        .select("*")
        .eq("user_id", user.id);
      const productsPromise = supabase
        .from("master_products")
        .select("sku_variant, name")
        .eq("user_id", user.id);

      const [
        { data: accountsData, error: accountsError },
        { data: productsData, error: productsError },
      ] = await Promise.all([accountsPromise, productsPromise]);

      if (accountsError) throw accountsError;
      if (productsError) throw productsError;

      setStoreAccounts(accountsData || []);
      const productMap = new Map(
        productsData.map((p) => [p.sku_variant.toUpperCase(), p.name])
      );
      setMasterProductsMap(productMap);

      // Memformat data item pesanan untuk ditampilkan
      const flattenedItems = itemsData.map((item) => ({
        id: item.id,
        order_creation_date: item.orders.order_creation_date,
        order_sn: item.orders.order_sn,
        product_sku_variant: item.product_sku_variant,
        quantity: item.quantity,
        price: item.price,
        platform: item.orders.daily_uploads?.platform,
        storeAccountName: item.orders.daily_uploads?.account_name,
      }));

      setOrderItems(flattenedItems);
    } catch (error) {
      toast({
        title: "Error",
        description: `Gagal memuat data: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    let data = [...orderItems].map((item) => ({
      ...item,
      productName:
        masterProductsMap.get(item.product_sku_variant.toUpperCase()) ||
        "Produk Belum Terdaftar",
      isValidated: masterProductsMap.has(
        item.product_sku_variant.toUpperCase()
      ),
    }));

    if (platformFilter !== "all") {
      data = data.filter((o) => o.platform === platformFilter);
    }
    if (accountFilter !== "all") {
      data = data.filter((o) => o.storeAccountName === accountFilter);
    }
    if (validationFilter !== "all") {
      const isValid = validationFilter === "validated";
      data = data.filter((o) => o.isValidated === isValid);
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(
        (o) =>
          o.order_sn.toLowerCase().includes(lowerSearch) ||
          o.productName.toLowerCase().includes(lowerSearch) ||
          o.product_sku_variant.toLowerCase().includes(lowerSearch)
      );
    }

    data.sort(
      (a, b) =>
        new Date(b.order_creation_date) - new Date(a.order_creation_date)
    );
    return data;
  }, [
    orderItems,
    platformFilter,
    accountFilter,
    validationFilter,
    searchTerm,
    masterProductsMap,
  ]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

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
      <Helmet>
        <title>Pesanan Harian per Produk - OrderFlow</title>
        <meta
          name="description"
          content="Lihat detail dan validasi pesanan harian untuk setiap produk."
        />
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold gradient-text">
          Pesanan Harian Produk
        </h1>
        <p className="text-gray-400 text-lg">
          Validasi setiap item yang terjual terhadap Master Produk.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-effect border-white/20">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Select
                value={validationFilter}
                onValueChange={(value) => {
                  setValidationFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="glass-effect border-white/30">
                  <SelectValue placeholder="Status Validasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="validated">Cocok</SelectItem>
                  <SelectItem value="unvalidated">SKU Baru</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari No. Pesanan, Produk, atau SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 glass-effect border-white/30"
                />
              </div>
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
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daftar Item Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Tanggal</TableHead>
                    <TableHead className="text-gray-300">No. Pesanan</TableHead>
                    <TableHead className="text-gray-300">
                      Produk / SKU Varian
                    </TableHead>
                    <TableHead className="text-gray-300 text-center">
                      Qty
                    </TableHead>
                    <TableHead className="text-gray-300">
                      Platform / Toko
                    </TableHead>
                    <TableHead className="text-gray-300 text-center">
                      Status Validasi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-400"
                      >
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-gray-300">
                          {new Date(item.order_creation_date).toLocaleString(
                            "id-ID",
                            { dateStyle: "medium", timeStyle: "short" }
                          )}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {item.order_sn}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-white">
                            {item.productName}
                          </div>
                          <div className="text-sm text-cyan-400">
                            {item.product_sku_variant}
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-bold text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs capitalize ${getPlatformColor(
                                item.platform
                              )}`}
                            >
                              {item.platform}
                            </span>
                            <span className="text-sm text-blue-300">
                              {item.storeAccountName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isValidated ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                              <CheckCircle size={14} /> Cocok
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full">
                              <AlertTriangle size={14} /> SKU Baru
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {!loading && paginatedItems.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 font-semibold">
                  Data item pesanan tidak ditemukan
                </p>
                <p className="text-gray-500 text-sm">
                  Coba sesuaikan filter atau upload data pesanan terlebih
                  dahulu.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="w-full"
            />
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default DailyOrdersByProduct;
