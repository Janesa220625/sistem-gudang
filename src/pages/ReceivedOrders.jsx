
import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Info, Upload, Download, FileSpreadsheet } from 'lucide-react';
import UploadDropzone from '@/components/upload/UploadDropzone';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const ReceivedOrders = () => {
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
    const templateData = [
      {'No. Pesanan': 'SHP123456789', 'Penghasilan Pesanan': 150000},
      {'No. Pesanan': 'LZD987654321', 'Penghasilan Pesanan': 250000}
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Konfirmasi');
    XLSX.writeFile(workbook, 'Template_Konfirmasi_Pesanan.xlsx');
    toast({ title: 'Template Diunduh', description: 'Isi No. Pesanan dan Penghasilan (opsional).' });
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
        const revenueHeaderRaw = headers.find(h => h.includes('pendapatan') || h.includes('penghasilan'));
        
        const orderSnHeader = Object.keys(jsonData[0]).find(h => String(h).toLowerCase() === orderSnHeaderRaw);

        if (!orderSnHeader) {
            throw new Error("Kolom 'No. Pesanan' tidak ditemukan di file.");
        }

        const ordersToUpdate = jsonData.map(row => ({
          order_sn: String(row[orderSnHeader]),
          revenue: revenueHeaderRaw && row[Object.keys(row).find(k => String(k).toLowerCase() === revenueHeaderRaw)] ? parseFloat(row[Object.keys(row).find(k => String(k).toLowerCase() === revenueHeaderRaw)]) : null
        })).filter(o => o.order_sn);

        const orderSnList = ordersToUpdate.map(o => o.order_sn);
        
        const { data: existingOrders, error: fetchError } = await supabase
          .from('orders')
          .select('id, order_sn')
          .in('order_sn', orderSnList)
          .eq('user_id', user.id);

        if (fetchError) throw fetchError;

        let updatedCount = 0;
        const updatePromises = [];

        existingOrders.forEach(dbOrder => {
          const updateInfo = ordersToUpdate.find(u => u.order_sn === dbOrder.order_sn);
          if (updateInfo) {
            const updatePayload = { status: 'delivered' };
            if (updateInfo.revenue !== null && !isNaN(updateInfo.revenue)) {
              updatePayload.total = updateInfo.revenue;
            }
            updatePromises.push(
              supabase.from('orders').update(updatePayload).eq('id', dbOrder.id)
            );
            updatedCount++;
          }
        });

        await Promise.all(updatePromises);
        
        toast({
          title: 'Proses Selesai',
          description: `${updatedCount} pesanan ditandai selesai. ${orderSnList.length - updatedCount} pesanan tidak ditemukan.`,
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
        <h1 className="text-4xl font-bold gradient-text">Konfirmasi Pesanan Diterima</h1>
        <p className="text-gray-400 text-lg">Upload laporan dari marketplace untuk menandai pesanan sebagai 'Selesai'.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-effect border-white/20 h-full">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Upload className="h-5 w-5" /> Unggah Laporan</CardTitle>
                </CardHeader>
                <CardContent>
                    {file ? (
                        <div className="space-y-4 text-center">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                <FileSpreadsheet className="h-5 w-5 text-green-400" />
                                <span className="text-white">{file.name}</span>
                            </div>
                            <Button onClick={processFile} disabled={processing} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {processing ? 'Memproses...' : 'Konfirmasi Pesanan'}
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
                    <CardTitle className="text-white flex items-center gap-2"><Download className="h-5 w-5"/> Template Konfirmasi</CardTitle>
                    <CardDescription className="text-gray-400">Gunakan template ini untuk menghindari kesalahan.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                    <FileSpreadsheet className="h-16 w-16 text-green-400" />
                    <p className="text-gray-300">Unduh template, isi data, lalu unggah kembali.</p>
                    <Button onClick={downloadTemplate}>
                        Unduh Template
                    </Button>
                </CardContent>
            </Card>
             <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <Info className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-blue-300">Penting</h3>
                    <p className="text-gray-400">Pastikan file Excel Anda memiliki kolom header yang mengandung kata <span className="font-bold text-cyan-300">"Pesanan"</span> dan <span className="font-bold text-cyan-300">"Penghasilan"</span> (opsional) agar dapat diproses dengan benar.</p>
                </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReceivedOrders;
