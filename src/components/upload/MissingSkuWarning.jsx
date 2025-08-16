import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

const MissingSkuWarning = ({ missingSkus }) => {
  if (missingSkus.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="bg-yellow-500/10 border-yellow-500/30 text-yellow-300">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>SKU Tidak Ditemukan!</AlertTitle>
      <AlertDescription>
        <p>Beberapa produk dalam file Anda tidak ada di Master Produk dan tidak akan diproses. Silakan tambahkan terlebih dahulu:</p>
        <ul className="list-disc pl-5 mt-2 max-h-32 overflow-y-auto">
          {missingSkus.map((sku, index) => (
            <li key={index}>{sku}</li>
          ))}
        </ul>
        <p className="mt-2">
          Anda dapat menambahkan produk baru di halaman{" "}
          <Link to="/master-product" className="font-bold underline hover:text-yellow-200">
            Master Produk
          </Link>.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default MissingSkuWarning;
