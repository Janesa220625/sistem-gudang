
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';

function UploadDropzone({ onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'text/csv' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.csv')
    ) {
      onFileSelect(file);
    } else {
      toast({
        title: "Format File Tidak Valid",
        description: "Hanya file Excel (.xlsx) dan CSV yang diperbolehkan",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="glass-effect border-white/20">
      <CardContent className="p-8">
        <div 
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${dragActive ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}`} 
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        >
          <input type="file" accept=".xlsx,.csv" onChange={handleFileInput} className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="cursor-pointer">
            <motion.div animate={{ scale: dragActive ? 1.1 : 1 }} className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop atau Klik untuk Upload</h3>
                <p className="text-gray-400">Mendukung file Excel (.xlsx) dan CSV</p>
              </div>
            </motion.div>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

export default UploadDropzone;
