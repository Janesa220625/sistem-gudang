
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Store, Plus, Trash2, Edit, Save, X, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

function StoreAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountPlatform, setNewAccountPlatform] = useState('');
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingAccountName, setEditingAccountName] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('store_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: `Gagal memuat akun: ${error.message}`, variant: "destructive" });
    } else {
      setAccounts(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAddAccount = async () => {
    if (!newAccountName || !newAccountPlatform) {
      toast({ title: "Form Belum Lengkap", description: "Nama akun dan platform harus diisi.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('store_accounts')
      .insert({
        name: newAccountName,
        platform: newAccountPlatform,
        user_id: user.id
      });

    if (error) {
      toast({ title: "Gagal Menambah Akun", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Akun Ditambahkan", description: `Akun ${newAccountName} berhasil dibuat.` });
      setNewAccountName('');
      setNewAccountPlatform('');
      setIsAdding(false);
      fetchAccounts();
    }
  };
  
  const handleEditAccount = (account) => {
    setEditingAccountId(account.id);
    setEditingAccountName(account.name);
  };

  const handleSaveEdit = async () => {
    if (!editingAccountName) {
      toast({ title: "Nama Akun Kosong", description: "Nama akun tidak boleh kosong.", variant: "destructive" });
      return;
    }
    
    const { error } = await supabase
      .from('store_accounts')
      .update({ name: editingAccountName })
      .eq('id', editingAccountId);

    if (error) {
      toast({ title: "Gagal Memperbarui", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Akun Diperbarui", description: "Nama akun berhasil diubah." });
      setEditingAccountId(null);
      setEditingAccountName('');
      fetchAccounts();
    }
  };

  const handleDeleteAccount = async (accountId) => {
    const { error } = await supabase.from('store_accounts').delete().eq('id', accountId);
    if (error) {
      toast({ title: "Gagal Menghapus", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Akun Dihapus", description: "Akun toko berhasil dihapus.", variant: "destructive" });
      fetchAccounts();
    }
  };
  
  const getPlatformInfo = (platform) => {
    switch (platform) {
      case 'shopee': return { name: 'Shopee', color: 'bg-orange-500/20 text-orange-400' };
      case 'lazada': return { name: 'Lazada', color: 'bg-blue-500/20 text-blue-400' };
      case 'tiktok': return { name: 'TikTok', color: 'bg-purple-500/20 text-purple-400' };
      default: return { name: 'Unknown', color: 'bg-gray-500/20 text-gray-400' };
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div className="text-left space-y-2">
            <h1 className="text-4xl font-bold gradient-text">Manajemen Akun Toko</h1>
            <p className="text-gray-400 text-lg">Kelola semua akun marketplace Anda di satu tempat</p>
        </div>
        {!isAdding && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
            <Button onClick={() => setIsAdding(true)} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" /> Tambah Akun
            </Button>
          </motion.div>
        )}
      </motion.div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-effect border-white/20">
            <CardHeader><CardTitle className="text-white">Tambah Akun Toko Baru</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Nama Akun Toko (Contoh: Shopee Andrian)" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} className="glass-effect border-white/30" />
                <Select value={newAccountPlatform} onValueChange={setNewAccountPlatform}>
                    <SelectTrigger className="glass-effect border-white/30"><SelectValue placeholder="Pilih Platform" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="shopee">Shopee</SelectItem>
                        <SelectItem value="lazada">Lazada</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Button onClick={handleAddAccount} className="bg-gradient-to-r from-green-500 to-emerald-600">Simpan Akun</Button>
                    <Button variant="outline" onClick={() => setIsAdding(false)}>Batal</Button>
                </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><Store className="h-5 w-5" />Daftar Akun Toko</CardTitle>
            <CardDescription className="text-gray-400">{accounts.length} akun terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-gray-400">Memuat akun...</div>
            ) : accounts.length > 0 ? (
                <div className="space-y-4">
                {accounts.map(account => (
                  <motion.div key={account.id} layout className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getPlatformInfo(account.platform).color}`}>
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div>
                        {editingAccountId === account.id ? (
                            <Input value={editingAccountName} onChange={(e) => setEditingAccountName(e.target.value)} className="glass-effect border-white/30" />
                        ) : (
                            <p className="font-semibold text-white">{account.name}</p>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs ${getPlatformInfo(account.platform).color}`}>{getPlatformInfo(account.platform).name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingAccountId === account.id ? (
                        <>
                          <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="text-green-400 hover:text-green-300"><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingAccountId(null)} className="text-gray-400 hover:text-gray-300"><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <>
                           <Button size="icon" variant="ghost" onClick={() => handleEditAccount(account)} className="text-blue-400 hover:text-blue-300"><Edit className="h-4 w-4" /></Button>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Anda yakin ingin menghapus?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun toko "{account.name}" secara permanen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAccount(account.id)}>Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
                <div className="text-center py-12">
                    <Store className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 font-semibold">Belum ada akun toko</p>
                    <p className="text-gray-500 text-sm">Klik "Tambah Akun" untuk memulai.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default StoreAccounts;
