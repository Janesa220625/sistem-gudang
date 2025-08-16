import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function StockStatsCards({ products, stockHistory }) {
  const stats = [
    {
      title: 'Total Produk',
      value: products.length,
      description: 'Produk terdaftar',
      icon: Package,
      color: 'text-blue-400',
      delay: 0.1
    },
    {
      title: 'Transaksi Hari Ini',
      value: stockHistory.filter(h => new Date(h.created_at).toDateString() === new Date().toDateString()).length,
      description: 'Pergerakan stok',
      icon: Plus,
      color: 'text-green-400',
      delay: 0.2
    },
    {
      title: 'Total Riwayat',
      value: stockHistory.length,
      description: 'Semua transaksi',
      icon: History,
      color: 'text-purple-400',
      delay: 0.3
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stat.delay }}
          >
            <Card className="glass-effect border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-gray-400">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

export default StockStatsCards;