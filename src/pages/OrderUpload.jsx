
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import UploadDropzone from '@/components/upload/UploadDropzone';
import UploadFileDetails from '@/components/upload/UploadFileDetails';
import UploadValidationInfo from '@/components/upload/UploadValidationInfo';
import { processFileAndSave } from '@/lib/fileProcessor';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


function OrderUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [storeAccounts, setStoreAccounts] = useState([]);
  const [masterProductsCount, setMasterProductsCount] = useState(0);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    if(!user) return;
    setLoading(true);

    const accountsPromise = supabase
      .from('store_accounts')
      .select('*')
      .eq('user_id', user.id);
      
    const productsCountPromise = supabase
      .from('master_products')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const [
        { data: accountsData, error: accountsError },
        { count: productsCount, error: productsError }
    ] = await Promise.all([accountsPromise, productsCountPromise]);
    
    if (accountsError) {
        toast({ title: "Error", description: "Gagal memuat akun toko.", variant: "destructive" });
    } else {
        setStoreAccounts(accountsData || []);
    }

    if(productsError) {
        toast({ title: "Error", description: "Gagal memeriksa Master Produk.", variant: "destructive" });
    } else {
        setMasterProductsCount(productsCount || 0);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedPlatform) {
      setFilteredAccounts(storeAccounts.filter(acc => acc.platform === selectedPlatform));
      setSelectedAccount('');
    } else {
      setFilteredAccounts([]);
    }
  }, [selectedPlatform, storeAccounts]);

  const detectPlatform = (filename) => {
    const name = filename.toLowerCase();
    if (name.includes('shopee')) return 'shopee';
    if (name.includes('lazada')) return 'lazada';
    if (name.includes('tiktok')) return 'tiktok';
    return '';
  };
  
  const handleFileSelect = (file) => {
    if (masterProductsCount === 0) {
      toast({
        title: "Master Produk Kosong",
        description: "Harap isi Master Produk terlebih dahulu sebelum mengunggah file pesanan.",
        variant: "destructive"
      });
      return;
    }
    setSelectedFile(file);
    const platform = detectPlatform(file.name);
    if (platform) {
      setSelectedPlatform(platform);
    }
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setSelectedPlatform('');
    setSelectedAccount('');
    setProcessing(false);
  };

  const handleProcessFile = async () => {
    if (!selectedFile || !selectedPlatform || !selectedAccount) {
      toast({ 
        title: "Informasi Tidak Lengkap", 
        description: "Pastikan Anda telah memilih file, platform, dan akun toko.",
        variant: "destructive" 
      });
      return;
    }
    
    setProcessing(true);
    
    const storeAccount = storeAccounts.find(acc => acc.id === selectedAccount);
    
    try {
      const result = await processFileAndSave(selectedFile, selectedPlatform, storeAccount, user);
      toast({
        title: "Proses Selesai!",
        description: `${result.newOrdersCount} pesanan baru ditambahkan. ${result.skippedCount} duplikat & ${result.invalidCount} data tidak valid dilewati.`,
      });
      resetUploadState();
      navigate('/daily-uploads');
    } catch (error) {
      console.error("File processing error:", error);
      toast({ 
        title: "Gagal Memproses File", 
        description: error.message || "Terjadi kesalahan. Pastikan format file dan platform sesuai.", 
        variant: "destructive" 
      });
      setProcessing(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h1 className="text-4xl font-bold gradient-text">Upload Pesanan</h1>
        <p className="text-gray-400 text-lg">Upload file pesanan dari marketplace Anda dengan validasi canggih</p>
      </motion.div>
      
      {loading ? (
         <div className="text-center text-gray-400">Memeriksa Master Produk...</div>
      ) : masterProductsCount === 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/30 text-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Master Produk Kosong!</AlertTitle>
            <AlertDescription>
              Anda belum memiliki produk di database. Silakan{" "}
              <Link to="/master-product" className="font-bold underline hover:text-red-200">
                tambahkan produk
              </Link>{" "}
              terlebih dahulu sebelum mengunggah file pesanan.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <UploadValidationInfo />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {!selectedFile ? (
            <UploadDropzone onFileSelect={handleFileSelect} />
        ) : (
            <UploadFileDetails
                file={selectedFile}
                platform={selectedPlatform}
                setPlatform={setSelectedPlatform}
                account={selectedAccount}
                setAccount={setSelectedAccount}
                filteredAccounts={filteredAccounts}
                processing={processing}
                onProcess={handleProcessFile}
                onCancel={resetUploadState}
            />
        )}
      </motion.div>
    </div>
  );
}

export default OrderUpload;
