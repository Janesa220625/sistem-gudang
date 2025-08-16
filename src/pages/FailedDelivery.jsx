import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, Info, Upload, Download, FileSpreadsheet } from 'lucide-react';
import UploadDropzone from '@/components/upload/UploadDropzone';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const FailedDelivery = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
  };
  
  const resetState = () => {
    setFile(null);
    setProcessing(false);
  };

  const downloadTemplate = () => {
    const templateData = [{'No. Pesanan': 'SHP123456789'}];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Gagal Kirim');
    XLSX.writeFile(workbook, 'Template_Gagal_Kirim.xlsx');
    toast({ title: 'Template Diunduh', description: 'Isi dengan No. Pesanan yang gagal dikirim.' });
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

        const headers = Object.keys(jsonData[0] || {}).map(h => String(h).toLowerCase());
        const orderSnHeaderRaw = headers.find(h => h.includes('pesanan'));
        const orderSnHeader = Object.keys(jsonData[0]).find(h => String(h).toLowerCase() === orderSnHeaderRaw);

        if (!orderSnHeader) {
            throw new Error("Kolom 'No. Pesanan' tidak ditemukan di file.");
        }

        const orderSnList = jsonData.map(row => String(row[orderSnHeader])).filter(Boolean);

        const { data: updatedOrders, error } = await supabase
          .from('orders')
          .update({ status: 'failed_delivery' })
          .in('order_sn', orderSnList)
          .eq('user_id', user.id)
          .select();

        if (error) throw error;
        
        const updatedCount = updatedOrders ? updatedOrders.length : 0;

        toast({
          title: 'Proses Selesai',
          description: `${updatedCount} pesanan telah ditandai sebagai 'Gagal Kirim'. ${orderSnList.length - updatedCount} pesanan tidak ditemukan.`,
        });
        resetState();
      } catch (error) {
        console.error("File processing error:", error);
        toast({ title: 'Gagal Memproses File', description: error.message || 'Pastikan format file benar.', variant: 'destructive' });
        setProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Update Pesanan Gagal Kirim</h1>
        <p className="text-gray-400 text-lg">Upload daftar No. Pesanan untuk menandainya sebagai 'Gagal Kirim'.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-effect border-white/20 h-full">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Upload className="h-5 w-5" /> Unggah Laporan Gagal Kirim</CardTitle>
                </CardHeader>
                <CardContent>
                    {file ? (
                        <div className="space-y-4 text-center">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                <FileSpreadsheet className="h-5 w-5 text-red-400" />
                                <span className="text-white">{file.name}</span>
                            </div>
                            <Button onClick={processFile} disabled={processing} className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700">
                                <Truck className="mr-2 h-4 w-4" />
                                {processing ? 'Memproses...' : 'Update Status Gagal Kirim'}
                            </Button>
                            <Button variant="outline" onClick={resetState} className="w-full">Pilih File Lain</Button>
                        </div>
                    ) : (
                        <UploadDropzone onFileSelect={handleFileSelect} />
                    )}
                </CardContent>
            </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="space-y-8">
            <Card className="glass-effect border-white/20">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Download className="h-5 w-5"/> Template Gagal Kirim</CardTitle>
                    <CardDescription className="text-gray-400">Gunakan template ini untuk menghindari kesalahan.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                    <FileSpreadsheet className="h-16 w-16 text-green-400" />
                    <p className="text-gray-300">Cukup isi kolom 'No. Pesanan' dengan data gagal kirim.</p>
                    <Button onClick={downloadTemplate}>
                        Unduh Template
                    </Button>
                </CardContent>
            </Card>
             <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Info className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-blue-300">Penting</h3>
                    <p className="text-gray-400">Sistem akan menandai semua No. Pesanan yang valid di dalam file sebagai 'Gagal Kirim'.</p>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FailedDelivery;
