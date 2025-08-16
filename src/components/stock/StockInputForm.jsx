
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const stockMovementReasons = {
  in: [
    'Pembelian Baru',
    'Return dari Customer',
    'Koreksi Stok',
    'Transfer Masuk',
    'Produksi'
  ],
  out: [
    'Penjualan (Otomatis)',
    'Rusak/Cacat',
    'Hilang',
    'Return ke Supplier',
    'Transfer Keluar',
    'Koreksi Stok'
  ]
};

function StockInputForm({ products, onSubmit }) {
  const [formData, setFormData] = useState({
    productSkuVarian: '',
    type: 'in',
    quantity: '',
    reason: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onSubmit(formData);
    if (success) {
      setFormData({
        productSkuVarian: '',
        type: 'in',
        quantity: '',
        reason: '',
        notes: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="product" className="text-white">Pilih Produk Varian *</Label>
          <Select value={formData.productSkuVarian} onValueChange={(value) => setFormData({...formData, productSkuVarian: value})}>
            <SelectTrigger className="glass-effect border-white/30">
              <SelectValue placeholder="Pilih produk varian" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.skuVarian} value={product.skuVarian}>
                  {product.name} ({product.skuVarian}) - Stok: {product.stock || 0}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="text-white">Jenis Transaksi *</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value, reason: ''})}>
            <SelectTrigger className="glass-effect border-white/30">
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">Stok Masuk (+)</SelectItem>
              <SelectItem value="out">Stok Keluar (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-white">Jumlah *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            className="glass-effect border-white/30"
            placeholder="Masukkan jumlah"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reason" className="text-white">Alasan *</Label>
          <Select value={formData.reason} onValueChange={(value) => setFormData({...formData, reason: value})} required>
            <SelectTrigger className="glass-effect border-white/30">
              <SelectValue placeholder="Pilih alasan" />
            </SelectTrigger>
            <SelectContent>
              {stockMovementReasons[formData.type].map((reason) => (
                <SelectItem key={reason} value={reason}>
                  {reason}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-white">Catatan</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          className="glass-effect border-white/30"
          placeholder="Catatan tambahan (opsional)"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
      >
        Simpan Pergerakan Stok
      </Button>
    </form>
  );
}

export default StockInputForm;
