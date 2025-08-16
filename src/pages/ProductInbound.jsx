
import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { Download, Upload, Info, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UploadDropzone from '@/components/upload/UploadDropzone';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ProductInbound = () => {
  const [products, setProducts] = useState([]);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    if(!user) return;
    const { data, error } = await supabase.from('master_products').select('*').eq('user_id', user.id);
    if(error) {
        toast({ title: "Error", description: "Gagal memuat produk", variant: "destructive" });
    } else {
        setProducts(data);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const downloadTemplate = () => {
    const templateData = products.map(p => ({
      'SKU Varian': p.sku_variant,
      'Nama Produk': p.name,
      'Stok Saat Ini': p.stock || 0,
      'Stok Masuk (isi di sini)': '',
      'Harga Modal Baru (opsional)': p.cost_price || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Update Stok');
    XLSX.writeFile(workbook, 'Template_Update_Stok.xlsx');
    toast({ title: 'Template Diunduh', description: 'Silakan isi file template dan unggah kembali.' });
  };

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };

  const processFile = () => {
    if (!file) {
      toast({ title: 'File tidak ditemukan', description: 'Silakan pilih file untuk diunggah.', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let updatedCount = 0;
        let errorCount = 0;
        
        const updates = [];

        for (const row of jsonData) {
          const skuVarian = row['SKU Varian'];
          const stockIn = parseInt(row['Stok Masuk (isi di sini)']);
          const newCostPrice = parseFloat(row['Harga Modal Baru (opsional)']);
          
          const product = products.find(p => p.sku_variant === skuVarian);

          if (product) {
            const updatePayload = {};
            let hasUpdate = false;
            if (!isNaN(stockIn) && stockIn > 0) {
              updatePayload.stock = (product.stock || 0) + stockIn;
              hasUpdate = true;
            }
            if (!isNaN(newCostPrice) && newCostPrice > 0) {
              updatePayload.cost_price = newCostPrice;
              hasUpdate = true;
            }

            if (hasUpdate) {
              updates.push(supabase.from('master_products').update(updatePayload).eq('id', product.id));
              updatedCount++;
            }
          } else {
            errorCount++;
          }
        }
        
        if (updates.length > 0) {
            await Promise.all(updates);
        }

        toast({
          title: 'Proses Selesai',
          description: `${updatedCount} produk berhasil diperbarui, ${errorCount} baris diabaikan.`,
        });
        fetchProducts();
      } catch (error) {
        toast({ title: 'Gagal Memproses File', description: 'Pastikan format file benar.', variant: 'destructive' });
      } finally {
        setProcessing(false);
        setFile(null);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Input Masuk Produk (Massal)</h1>
        <p className="text-gray-400 text-lg">Update stok dan harga modal produk secara massal menggunakan file Excel.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-effect border-white/20 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Download className="h-5 w-5" /> Langkah 1: Unduh Template</CardTitle>
              <CardDescription className="text-gray-400">Dapatkan template Excel dengan semua produk Anda.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <FileSpreadsheet className="h-16 w-16 text-green-400" />
              <p className="text-gray-300">Template berisi semua varian produk Anda yang terdaftar.</p>
              <Button onClick={downloadTemplate} disabled={products.length === 0}>
                Unduh Template .xlsx
              </Button>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-effect border-white/20 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Upload className="h-5 w-5" /> Langkah 2: Unggah & Proses</CardTitle>
              <CardDescription className="text-gray-400">Unggah file template yang sudah Anda isi.</CardDescription>
            </CardHeader>
            <CardContent>
              {file ? (
                <div className="space-y-4 text-center">
                   <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <FileSpreadsheet className="h-5 w-5 text-green-400" />
                    <span className="text-white">{file.name}</span>
                  </div>
                  <Button onClick={processFile} disabled={processing} className="w-full">
                    {processing ? 'Memproses...' : 'Proses File'}
                  </Button>
                  <Button variant="outline" onClick={() => setFile(null)} className="w-full">Pilih File Lain</Button>
                </div>
              ) : (
                <UploadDropzone onFileSelect={handleFileSelect} />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <Info className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-300">Cara Menggunakan</h3>
            <ul className="list-disc pl-5 text-gray-400 space-y-1 mt-2">
              <li>Unduh template yang sudah disediakan.</li>
              <li>Isi kolom 'Stok Masuk (isi di sini)' dengan jumlah stok baru yang ingin ditambahkan.</li>
              <li>Jika ada perubahan harga modal, isi kolom 'Harga Modal Baru (opsional)'.</li>
              <li>Simpan file Anda, lalu unggah di sini untuk diproses.</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProductInbound;
