
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

const PlatformStats = ({ platformData, loading }) => {
  const platforms = [
    { name: 'Shopee', id: 'shopee', color: 'bg-orange-500', char: 'S' },
    { name: 'Lazada', id: 'lazada', color: 'bg-blue-500', char: 'L' },
    { name: 'TikTok', id: 'tiktok', color: 'bg-purple-500', char: 'T' },
  ];

  return (
    <Card className="glass-effect border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Statistik Platform
        </CardTitle>
        <CardDescription className="text-gray-400">Distribusi pesanan berdasarkan platform</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Memuat statistik...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {platforms.map((platform, index) => {
              const data = platformData[platform.id] || { percentage: 0, totalOrders: 0 };
              return (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-20 h-20 rounded-full ${platform.color} flex items-center justify-center text-3xl font-bold text-white mb-4`}>
                    {platform.char}
                  </div>
                  <p className="text-lg font-semibold text-white">{platform.name}</p>
                  <p className="text-3xl font-bold gradient-text">{data.percentage}%</p>
                  <p className="text-sm text-gray-400">{data.totalOrders.toLocaleString('id-ID')} Total Pesanan</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformStats;
