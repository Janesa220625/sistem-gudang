import React from 'react';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Store, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function UploadFileDetails({
  file,
  platform,
  setPlatform,
  account,
  setAccount,
  filteredAccounts,
  processing,
  onProcess,
  onCancel,
  disableProcess
}) {
  return (
    <Card className="glass-effect border-white/20">
      <CardContent className="p-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <FileSpreadsheet className="h-5 w-5 text-green-400" />
            <span className="text-white">{file.name}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform" className="text-white flex items-center gap-2 mb-2"><ShoppingBag className="h-4 w-4" />Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform" className="glass-effect border-white/30"><SelectValue placeholder="Pilih Platform" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopee">Shopee</SelectItem>
                  <SelectItem value="lazada">Lazada</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="storeAccount" className="text-white flex items-center gap-2 mb-2"><Store className="h-4 w-4" />Akun Toko</Label>
              <Select value={account} onValueChange={setAccount} disabled={!platform || filteredAccounts.length === 0}>
                <SelectTrigger id="storeAccount" className="glass-effect border-white/30"><SelectValue placeholder="Pilih Akun Toko" /></SelectTrigger>
                <SelectContent>
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)
                  ) : (
                    <div className="p-2 text-sm text-gray-400">Pilih platform dulu atau tambahkan akun baru.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={onProcess} disabled={processing || !account || disableProcess} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex-grow">
              {processing ? 'Memproses...' : 'Proses File'}
            </Button>
            <Button variant="outline" onClick={onCancel}>Batal</Button>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

export default UploadFileDetails;
