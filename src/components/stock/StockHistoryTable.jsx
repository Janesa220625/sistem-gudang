import React, { useState, useMemo } from 'react';
import { History } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Pagination from '@/components/ui/Pagination';

function StockHistoryTable({ history, loading }) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return history.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [history, currentPage]);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);

  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <History className="h-5 w-5" />
          Riwayat Pergerakan Stok
        </CardTitle>
        <CardDescription className="text-gray-400">
          Menampilkan {paginatedHistory.length} dari {history.length} transaksi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-300">Tanggal</TableHead>
                <TableHead className="text-gray-300">Produk</TableHead>
                <TableHead className="text-gray-300">SKU</TableHead>
                <TableHead className="text-gray-300">Jenis</TableHead>
                <TableHead className="text-gray-300">Jumlah</TableHead>
                <TableHead className="text-gray-300">Stok Sebelum</TableHead>
                <TableHead className="text-gray-300">Stok Sesudah</TableHead>
                <TableHead className="text-gray-300">Alasan</TableHead>
                <TableHead className="text-gray-300">Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan="9" className="text-center text-gray-400 py-10">Memuat riwayat stok...</TableCell></TableRow>
              ) : paginatedHistory.length > 0 ? (
                paginatedHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-gray-300">
                      {new Date(entry.created_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-white font-medium">{entry.product_name}</TableCell>
                    <TableCell className="text-gray-300">{entry.product_sku_variant}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        entry.type === 'in'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {entry.type === 'in' ? 'Masuk' : 'Keluar'}
                      </span>
                    </TableCell>
                    <TableCell className={`font-medium ${
                      entry.type === 'in' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {entry.type === 'in' ? '+' : '-'}{entry.quantity}
                    </TableCell>
                    <TableCell className="text-gray-300">{entry.previous_stock}</TableCell>
                    <TableCell className="text-gray-300">{entry.new_stock}</TableCell>
                    <TableCell className="text-gray-300">{entry.reason}</TableCell>
                    <TableCell className="text-gray-300">{entry.notes || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="9" className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Belum ada riwayat pergerakan stok</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
       {totalPages > 1 && (
         <CardFooter>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="w-full" />
          </CardFooter>
       )}
    </Card>
  );
}

export default StockHistoryTable;