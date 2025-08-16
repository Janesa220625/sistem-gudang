/**
 * File ini berisi fungsi-fungsi untuk memproses data mentah dari file unggahan
 * dari berbagai platform (marketplace) menjadi format data yang seragam dan bersih.
 * Setiap platform memiliki fungsi prosesornya sendiri.
 */

// --- PEMETAAN HEADER ---
// Ini adalah bagian penting untuk membuat kode kita kuat.
// Kita petakan semua kemungkinan nama header dari berbagai file ke satu nama kunci yang konsisten.
// Ini membuat fungsi prosesor lebih mudah dibaca dan diubah di masa depan.
const HEADER_MAPPING = {
  // Kunci Konsisten -> Kemungkinan Nama Header di File
  
  // Umum
  orderId: ['order_sn', 'Order ID', 'orderNumber'],
  trackingNumber: ['tracking_number', 'Tracking ID', 'trackingCode'],
  orderDate: ['order_creation_date', 'Created Time', 'createTime'],
  sku: ['Seller SKU', 'sellerSku'],
  variation: ['Variation', 'variation'],
  quantity: ['Quantity'],
  price: ['SKU Subtotal After Discount', 'paidPrice'],
  
  // Spesifik Shopee
  productInfo: ['product_info'], 
};

/**
 * Fungsi pembantu untuk mendapatkan nilai dari sebuah baris (row) menggunakan pemetaan header.
 * Ini akan mencoba semua kemungkinan nama header untuk satu kunci.
 * @param {object} row - Objek baris data.
 * @param {string} key - Kunci konsisten dari HEADER_MAPPING (misal: 'orderId').
 * @returns {*} Nilai dari kolom yang cocok, atau undefined jika tidak ditemukan.
 */
function getValue(row, key) {
    const possibleHeaders = HEADER_MAPPING[key];
    if (!possibleHeaders) return undefined;

    for (const header of possibleHeaders) {
        if (row[header] !== undefined) {
            return row[header];
        }
    }
    return undefined;
}


// --- FUNGSI PEMBANTU (HELPERS) ---

/**
 * Mengekstrak detail produk dari kolom 'product_info' Shopee.
 * @param {string} text - Teks dari kolom 'product_info'.
 * @returns {object} Objek yang berisi sku, variasi, warna, ukuran, harga, dan jumlah.
 */
function extractShopeeProductData(text) {
  if (!text) return { sku: null, variation: null, color: null, size: null, price: null, quantity: null };

  const skuMatch = text.match(/Nomor Referensi SKU:\s*([^;]+)/);
  const varMatch = text.match(/Nama Variasi:\s*([^;]+)/);
  const priceMatch = text.match(/Harga:\s*([^;]+)/);
  const qtyMatch = text.match(/Jumlah:\s*([^;]+)/);

  let variation = varMatch ? varMatch[1].trim() : null;
  let color = null;
  let size = null;

  if (variation && variation.includes(",")) {
    const parts = variation.split(",");
    color = parts[0] ? parts[0].trim() : null;
    size = parts[1] ? parts[1].trim() : null;
  } else if (variation) {
    color = variation;
  }

  return {
    sku: skuMatch ? skuMatch[1].trim() : null,
    variation: variation,
    color: color,
    size: size,
    price: priceMatch ? parseFloat(priceMatch[1].trim().replace(/[^0-9.-]+/g,"")) : null,
    quantity: qtyMatch ? parseInt(qtyMatch[1].trim(), 10) : null
  };
}

/**
 * Memisahkan string variasi menjadi warna dan ukuran.
 * @param {string} variationText - Teks dari kolom variasi.
 * @returns {object} Objek yang berisi color dan size.
 */
function splitVariation(variationText) {
  let color = null;
  let size = null;
  if (!variationText || typeof variationText !== 'string') {
    return { color, size };
  }

  // Logika untuk Lazada: "Warna:Merah,Ukuran:XL"
  if (variationText.includes(':')) {
      const parts = variationText.split(',');
      parts.forEach(part => {
          const [key, value] = part.split(':');
          if (key && value) {
              if (key.trim().toLowerCase() === 'warna') {
                  color = value.trim();
              } else if (key.trim().toLowerCase() === 'size' || key.trim().toLowerCase() === 'ukuran') {
                  size = value.trim();
              }
          }
      });
  } 
  // Logika untuk TikTok & Shopee: "Merah, XL"
  else if (variationText.includes(',')) {
    const parts = variationText.split(",");
    color = parts[0]?.trim() || null;
    size = parts[1]?.trim() || null;
  } 
  // Jika hanya satu nilai
  else {
    color = variationText.trim();
  }
  return { color, size };
}


// --- FUNGSI PROSESOR UTAMA ---

/**
 * Memproses satu baris data dari laporan Shopee.
 */
export function shopeeProcessor(row) {
  const productDetails = extractShopeeProductData(getValue(row, 'productInfo'));

  return {
    platform: 'Shopee',
    storeAccount: null,
    orderId: getValue(row, 'orderId'),
    trackingNumber: getValue(row, 'trackingNumber'),
    orderDate: getValue(row, 'orderDate'),
    sku: productDetails.sku,
    productName: null,
    variation: productDetails.variation,
    color: productDetails.color,
    size: productDetails.size,
    price: productDetails.price,
    quantity: productDetails.quantity,
  };
}

/**
 * Memproses satu baris data dari laporan TikTok.
 */
export function tiktokProcessor(row) {
  const variationText = getValue(row, 'variation');
  const { color, size } = splitVariation(variationText);

  return {
    platform: 'TikTok',
    storeAccount: null,
    orderId: getValue(row, 'orderId'),
    trackingNumber: getValue(row, 'trackingNumber'),
    orderDate: getValue(row, 'orderDate'),
    sku: getValue(row, 'sku'),
    productName: null,
    variation: variationText,
    color: color,
    size: size,
    price: parseFloat(getValue(row, 'price')) || 0,
    quantity: parseInt(getValue(row, 'quantity'), 10) || 0,
  };
}

/**
 * Memproses satu baris data dari laporan Lazada.
 * Diterjemahkan dari logika Python yang Anda berikan.
 */
export function lazadaProcessor(row) {
    const variationText = getValue(row, 'variation');
    const { color, size } = splitVariation(variationText);
    let sku = getValue(row, 'sku');

    // Mengambil bagian pertama dari SKU jika ada tanda '-'
    if (sku && typeof sku === 'string' && sku.includes('-')) {
        sku = sku.split('-')[0];
    }

    return {
        platform: 'Lazada',
        storeAccount: null,
        orderId: getValue(row, 'orderId'),
        trackingNumber: getValue(row, 'trackingNumber'),
        orderDate: getValue(row, 'orderDate'),
        sku: sku,
        productName: null,
        variation: variationText,
        color: color,
        size: size,
        price: parseFloat(getValue(row, 'price')) || 0,
        // Asumsi: Laporan Lazada memiliki 1 baris per item, jadi kuantitasnya adalah 1.
        quantity: 1, 
    };
}
