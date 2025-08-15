
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle } from 'lucide-react';

function UploadValidationInfo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg h-full">
          <ShieldCheck className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-300">Pencegahan Duplikasi</h3>
            <p className="text-gray-400">Sistem otomatis memeriksa 'No. Pesanan' untuk mencegah data ganda.</p>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg h-full">
          <AlertCircle className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-300">Validasi Data Penting</h3>
            <p className="text-gray-400">Setiap baris divalidasi untuk memastikan data-data kunci ada dan valid.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default UploadValidationInfo;
