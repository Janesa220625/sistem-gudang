import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import UploadDropzone from "@/components/upload/UploadDropzone";
import UploadPreview from "@/components/upload/UploadPreview";
import {
  shopeeProcessor,
  tiktokProcessor,
  lazadaProcessor,
} from "@/lib/platformProcessors";
import { processUploadedFile } from "@/lib/fileProcessor";
import { supabase } from "@/lib/customSupabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const platformProcessors = {
  shopee: shopeeProcessor,
  tiktok: tiktokProcessor,
  lazada: lazadaProcessor,
};

export default function OrderUpload() {
  const { toast } = useToast();
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [processedData, setProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [file, setFile] = useState(null);

  const storeAccounts = {
    shopee: ["Toko Shopee A", "Toko Shopee B"],
    tiktok: ["Toko TikTok A"],
    lazada: ["Toko Lazada A", "Toko Lazada B"],
  };

  const handleFileDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setProcessedData([]);
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      toast({
        title: "File Belum Dipilih",
        description: "Silakan pilih atau letakkan file terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedPlatform) {
      toast({
        title: "Platform Belum Dipilih",
        description: "Silakan pilih platform marketplace.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProcessedData([]);

    try {
      const processor = platformProcessors[selectedPlatform];
      const data = await processUploadedFile(file, processor);

      const dataWithInitialStatus = data.map((row) => ({
        ...row,
        storeAccount: selectedAccount || "Tidak Dipilih",
        validation: { product: "menunggu", duplicate: "menunggu" },
      }));

      setProcessedData(dataWithInitialStatus);
      toast({
        title: "Proses Berhasil",
        description: `${data.length} baris data berhasil diproses.`,
      });
    } catch (error) {
      toast({
        title: "Proses Gagal",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidation = async () => {
    if (processedData.length === 0) return;
    setIsValidating(true);
    toast({
      title: "Validasi Dimulai",
      description: "Mengecek data produk dan duplikasi...",
    });

    try {
      const uniqueSkus = [
        ...new Set(processedData.map((row) => row.sku).filter(Boolean)),
      ];
      const { data: existingProducts, error: fetchError } = await supabase
        .from("master_products")
        .select("sku")
        .in("sku", uniqueSkus);

      if (fetchError) throw fetchError;
      const existingSkuSet = new Set(existingProducts.map((p) => p.sku));
      const uniqueOrderIdentifierSet = new Set();

      const validatedData = processedData.map((row) => {
        const newValidation = { ...row.validation };
        if (row.sku) {
          newValidation.product = existingSkuSet.has(row.sku) ? "ok" : "baru";
        } else {
          newValidation.product = "tanpa_sku";
        }
        const identifier = `${row.orderId}-${row.sku}-${row.variation}`;
        if (uniqueOrderIdentifierSet.has(identifier)) {
          newValidation.duplicate = "duplikat";
        } else {
          uniqueOrderIdentifierSet.add(identifier);
          newValidation.duplicate = "unik";
        }
        return { ...row, validation: newValidation };
      });

      setProcessedData(validatedData);
      toast({
        title: "Validasi Selesai",
        description: "Hasil validasi telah ditampilkan di tabel.",
      });
    } catch (error) {
      console.error("Validation error:", error);
      toast({
        title: "Validasi Gagal",
        description: "Tidak dapat terhubung ke database untuk validasi.",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    toast({
      title: "Menyimpan Data...",
      description: "Harap tunggu sebentar.",
    });

    const dataToSave = processedData.filter(
      (row) =>
        row.validation.product === "ok" && row.validation.duplicate === "unik"
    );

    if (dataToSave.length === 0) {
      toast({
        title: "Tidak Ada Data untuk Disimpan",
        description: "Pastikan ada data yang valid (produk OK dan unik).",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const payload = dataToSave.map((row) => ({
      order_id: row.orderId,
      tracking_number: row.trackingNumber,
      order_date: row.orderDate,
      sku: row.sku,
      variation: row.variation,
      color: row.color,
      size: row.size,
      price: row.price,
      quantity: row.quantity,
      platform: row.platform,
      store_account: row.storeAccount,
      status: "diproses",
    }));

    try {
      const { error } = await supabase.from("daily_orders").insert(payload);
      if (error) {
        // Jika ada error dari Supabase, lempar error tersebut agar ditangkap oleh blok catch
        throw error;
      }

      toast({
        title: "Sukses!",
        description: `${payload.length} baris data berhasil disimpan ke database.`,
      });
      setProcessedData([]);
      setFile(null);
    } catch (error) {
      // --- PERBAIKAN DI SINI ---
      // Menampilkan pesan error yang lebih spesifik dari Supabase
      console.error("Save error:", error);
      const errorMessage =
        error.message || "Terjadi kesalahan yang tidak diketahui.";
      toast({
        title: "Gagal Menyimpan Data",
        description: `Detail: ${errorMessage}. Silakan periksa konsol browser untuk info lengkap.`,
        variant: "destructive",
        duration: 9000, // Durasi lebih lama agar pesan bisa dibaca
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validRowCount = processedData.filter(
    (row) =>
      row.validation?.product === "ok" && row.validation?.duplicate === "unik"
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Pesanan Harian</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Unggah file pesanan dari marketplace dan jalankan validasi sebelum menyimpan ke database.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atur Sumber & Proses</CardTitle>
          <CardDescription>Pilih platform, akun toko, lalu proses dan validasi file upload.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>1. Pilih Platform</Label>
              <Select onValueChange={setSelectedPlatform} value={selectedPlatform}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopee">Shopee</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="lazada">Lazada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>2. Pilih Akun Toko</Label>
              <Select
                onValueChange={setSelectedAccount}
                value={selectedAccount}
                disabled={!selectedPlatform}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Akun Toko" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPlatform && storeAccounts[selectedPlatform] ? (
                    storeAccounts[selectedPlatform].map((acc) => (
                      <SelectItem key={acc} value={acc}>
                        {acc}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">Pilih platform dulu</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>3. Proses File</Label>
              <Button className="w-full" onClick={handleProcessFile} disabled={isLoading || !file}>
                {isLoading ? "Memproses..." : "Proses File"}
              </Button>
            </div>

            <div>
              <Label>4. Validasi</Label>
              <Button className="w-full" onClick={handleValidation} disabled={isValidating || processedData.length === 0}>
                {isValidating ? "Memvalidasi..." : "Jalankan Validasi"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <UploadDropzone onFileDrop={handleFileDrop} file={file} />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">File</p>
                <p className="font-medium">{file ? file.name : "Belum ada file dipilih"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Platform</p>
                <p className="font-medium">{selectedPlatform || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Akun</p>
                <p className="font-medium">{selectedAccount || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setFile(null);
                  setProcessedData([]);
                }}
              >
                Reset
              </Button>
              <Button onClick={handleProcessFile} disabled={!file}>
                Proses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {processedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pratinjau & Simpan Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadPreview data={processedData} />
            <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">
                <span className="text-green-600 font-bold">{validRowCount}</span> dari {processedData.length} baris data siap untuk disimpan.
              </p>
              <Button onClick={handleSaveData} disabled={isSaving || validRowCount === 0}>
                {isSaving ? "Menyimpan..." : `Simpan ${validRowCount} Data Valid`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
