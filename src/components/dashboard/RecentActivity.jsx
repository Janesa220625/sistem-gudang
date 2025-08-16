
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Upload, Package, Edit } from 'lucide-react';

const RecentActivity = ({ activities, loading }) => {
  
  const getActivityIcon = (type) => {
    switch (type) {
      case 'Upload pesanan baru':
        return <Upload className="h-4 w-4 text-blue-400" />;
      case 'Produk baru ditambahkan':
        return <Package className="h-4 w-4 text-green-400" />;
      case 'Stok diperbarui':
        return <Edit className="h-4 w-4 text-yellow-400" />;
      default:
        return <History className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " tahun lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " bulan lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " hari lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " jam lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " menit lalu";
    return "Baru saja";
  };


  return (
    <Card className="glass-effect border-white/20 h-full">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <History className="h-5 w-5" /> Aktivitas Terbaru
        </CardTitle>
        <CardDescription className="text-gray-400">Aktivitas sistem terbaru</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
            <div className="text-center py-8 text-gray-400">Memuat aktivitas...</div>
        ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.slice(0, 5).map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-medium text-white">{activity.type}</p>
                    <p className="text-xs text-gray-400">{activity.description}</p>
                  </div>
                  <p className="text-xs text-gray-500 flex-shrink-0">{timeSince(activity.timestamp)}</p>
                </motion.div>
              ))}
            </div>
        ) : (
            <div className="text-center py-8 text-gray-400">Belum ada aktivitas.</div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
