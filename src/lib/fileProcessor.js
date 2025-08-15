
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/customSupabaseClient';
import { processShopeeOrders, processLazadaOrders, processTiktokOrders } from '@/lib/platformProcessors';

const normalizeHeaders = (headers) => {
    return headers.map(h => typeof h === 'string' ? h.trim().toLowerCase() : h);
};

const updateStock = async (orderItems, user_id) => {
    if (orderItems.length === 0) return;

    const stockUpdates = orderItems.reduce((acc, item) => {
        if (item.sku_variant) {
            acc[item.sku_variant] = (acc[item.sku_variant] || 0) + item.quantity;
        }
        return acc;
    }, {});

    const skuVariants = Object.keys(stockUpdates);

    const { data: products, error: fetchError } = await supabase
        .from('master_products')
        .select('sku_variant, stock')
        .in('sku_variant', skuVariants)
        .eq('user_id', user_id);

    if (fetchError) {
        console.error("Error fetching products for stock update:", fetchError);
        throw new Error("Gagal mengambil data produk untuk pembaruan stok.");
    }

    const updatePromises = products.map(product => {
        const soldQuantity = stockUpdates[product.sku_variant];
        const newStock = (product.stock || 0) - soldQuantity;
        return supabase
            .from('master_products')
            .update({ stock: newStock })
            .eq('sku_variant', product.sku_variant)
            .eq('user_id', user_id);
    });

    const results = await Promise.all(updatePromises);
    const updateErrors = results.filter(res => res.error);

    if (updateErrors.length > 0) {
        console.error("Errors during stock update:", updateErrors.map(e => e.error));
        throw new Error("Terjadi kesalahan saat memperbarui beberapa stok produk.");
    }
};


export const processFileAndSave = async (file, platform, storeAccount, user) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
    });

    if (json.length < 2) {
        throw new Error("File tidak memiliki data atau header yang valid.");
    }

    const headers = normalizeHeaders(json[0]);
    const rows = json.slice(1);

    const formattedJson = rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            if (header) {
                obj[header] = row[index];
            }
        });
        return obj;
    });

    const { data: masterProducts, error: productsError } = await supabase.from('master_products').select('*').eq('user_id', user.id);
    if (productsError) throw new Error("Gagal mengambil data Master Produk dari database.");
    if (!masterProducts || masterProducts.length === 0) {
      throw new Error("Proses gagal: Master Produk Anda kosong. Harap tambahkan produk terlebih dahulu sebelum mengunggah pesanan.");
    }


    const { data: existingOrdersRaw, error: ordersError } = await supabase.from('orders').select('order_sn').eq('user_id', user.id);
    if (ordersError) throw ordersError;

    const masterProductsMap = masterProducts.reduce((acc, p) => {
        if (p.sku_variant) acc[p.sku_variant.toUpperCase()] = p;
        return acc;
    }, {});
    
    const existingOrderSNs = new Set(existingOrdersRaw.map(o => String(o.order_sn)));

    let processedData;
    switch (platform) {
        case 'shopee':
            processedData = processShopeeOrders(formattedJson, masterProductsMap, existingOrderSNs);
            break;
        case 'lazada':
            processedData = processLazadaOrders(formattedJson, masterProductsMap, existingOrderSNs);
            break;
        case 'tiktok':
            processedData = processTiktokOrders(formattedJson, masterProductsMap, existingOrderSNs);
            break;
        default:
            throw new Error("Platform tidak didukung atau logika pemrosesan belum tersedia.");
    }

    const { newOrders, skippedCount, invalidCount } = processedData;
    let newOrdersCount = 0;

    if (newOrders.length > 0) {
        const totalRevenueFromNewOrders = newOrders.reduce((sum, order) => sum + (order.total || 0), 0);

        const { data: dailyUpload, error: uploadError } = await supabase.from('daily_uploads').insert({
            user_id: user.id,
            file_name: file.name,
            platform: platform,
            account_id: storeAccount.id,
            account_name: storeAccount.name,
            upload_date: new Date().toISOString().split('T')[0],
            total_orders: newOrders.length,
            total_revenue: totalRevenueFromNewOrders,
        }).select().single();

        if (uploadError) throw uploadError;

        const ordersToInsert = newOrders.map(order => ({
            user_id: user.id,
            daily_upload_id: dailyUpload.id,
            order_sn: String(order.order_sn),
            tracking_number: order.tracking_number,
            order_creation_date: order.order_creation_date,
            status: 'processed',
            total: order.total
        }));

        const { data: insertedOrders, error: insertOrdersError } = await supabase.from('orders').insert(ordersToInsert).select();
        if (insertOrdersError) throw insertOrdersError;

        const orderSnToIdMap = insertedOrders.reduce((acc, o) => {
            acc[o.order_sn] = o.id;
            return acc;
        }, {});

        const allOrderItems = [];
        const orderItemsToInsert = newOrders.flatMap(order => {
            const orderId = orderSnToIdMap[String(order.order_sn)];
            if (!orderId) return [];
            const items = order.items.map(item => ({
                order_id: orderId,
                product_sku_variant: item.sku_variant,
                quantity: item.quantity,
                price: item.price,
            }));
            allOrderItems.push(...items);
            return items;
        });

        if (orderItemsToInsert.length > 0) {
            const { error: insertItemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
            if (insertItemsError) throw insertItemsError;
        }
        
        await updateStock(allOrderItems, user.id);

        newOrdersCount = insertedOrders.length;
    }

    return { newOrdersCount, skippedCount, invalidCount };
};
