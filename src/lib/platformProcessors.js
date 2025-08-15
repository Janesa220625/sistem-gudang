
/**
 * @file This file contains the core logic for processing order files from different e-commerce platforms.
 * The accuracy of this processing is highly dependent on the consistency of the SKU data
 * provided in the uploaded files.
 */

/**
 * Finds a matching product variant from the master product list.
 * This function is crucial for linking order items to your product database.
 * It employs a multi-step matching strategy:
 * 1.  Direct match on `sku_variant` (highest priority). This is the most reliable method.
 * 2.  If no direct match, it attempts to match by base `sku` and `variation_name` text.
 *     This is useful for platforms that provide base SKU and variation details separately.
 * 3.  As a fallback, it searches for a product whose `sku_variant` starts with the base SKU.
 * 4.  If all else fails, it returns the first product found with a matching base SKU.
 * 
 * @param {string} sku - The SKU from the order file (can be base SKU or variant SKU).
 * @param {string | null} variationText - The variation text from the order file (e.g., "Black, XL").
 * @param {Object} masterProductsMap - A map of `sku_variant` to product objects for fast lookups.
 * @returns {Object | null} The matched product object or null if no match is found.
 */
const findMatchingVariant = (sku, variationText, masterProductsMap) => {
    if (!sku) return null;
    const normalizedSku = String(sku).toUpperCase().trim();
    if (!normalizedSku) return null;

    if (masterProductsMap[normalizedSku]) {
        return masterProductsMap[normalizedSku];
    }
    
    const masterProducts = Object.values(masterProductsMap);

    if (variationText && typeof variationText === 'string') {
        const normalizedVariation = String(variationText).toUpperCase().trim();
        
        const potentialMatches = masterProducts.filter(p => p.sku && p.sku.toUpperCase() === normalizedSku);

        if (potentialMatches.length === 0) {
             const fallbackMatch = masterProducts.find(p => p.sku_variant && p.sku_variant.toUpperCase().startsWith(normalizedSku + '-'));
             if (fallbackMatch) return fallbackMatch;
             return null;
        }

        if (potentialMatches.length === 1) {
            return potentialMatches[0];
        }

        for (const p of potentialMatches) {
            if (p.color && p.size && normalizedVariation.includes(p.color.toUpperCase()) && normalizedVariation.includes(p.size.toUpperCase())) {
                return p;
            }
             if (p.sku_variant && p.sku_variant.toUpperCase() === normalizedVariation) {
                return p;
            }
        }
    }
    
    const baseProduct = masterProducts.find(p => p.sku && p.sku.toUpperCase() === normalizedSku);
    return baseProduct || null;
};

const parseDate = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString === 'number') {
    return new Date(Math.round((dateString - 25569) * 86400 * 1000)).toISOString();
  }
  if (/\d{2}-\d{2}-\d{4}/.test(String(dateString))) {
    const parts = String(dateString).split(/[- :]/);
    return new Date(parts[2], parts[1] - 1, parts[0], parts[3] || 0, parts[4] || 0).toISOString();
  }
  const parsedDate = new Date(dateString);
  return isNaN(parsedDate) ? null : parsedDate.toISOString();
};

export const processShopeeOrders = (sheet, masterProductsMap, existingOrderSNs) => {
    const newOrders = [];
    let skippedCount = 0;
    let invalidCount = 0;
    
    const mapping = {
      order_sn: 'no. pesanan',
      tracking_number: 'no. resi',
      order_creation_date: 'waktu pesanan dibuat',
      sku_ref_no: 'nomor referensi sku',
      variation_name: 'nama variasi',
      quantity: 'jumlah',
      price_per_item: 'harga sebelum diskon',
      total_amount: 'total pembayaran',
    };
    
    const ordersGrouped = sheet.reduce((acc, row) => {
        const order_sn = row[mapping.order_sn];
        if (!order_sn) return acc;
        if (!acc[order_sn]) {
            acc[order_sn] = {
                tracking_number: row[mapping.tracking_number],
                order_creation_date: parseDate(row[mapping.order_creation_date]),
                total: parseFloat(row[mapping.total_amount] || 0),
                items: []
            };
        }
        acc[order_sn].items.push(row);
        return acc;
    }, {});

    for (const order_sn in ordersGrouped) {
        if (existingOrderSNs.has(String(order_sn))) {
            skippedCount++;
            continue;
        }

        const orderData = ordersGrouped[order_sn];
        const items = [];
        let validOrder = true;

        for (const row of orderData.items) {
            const baseSku = row[mapping.sku_ref_no];
            const variationText = row[mapping.variation_name];
            
            if (!baseSku) {
                validOrder = false;
                break;
            }
            
            const matchedVariant = findMatchingVariant(baseSku, variationText, masterProductsMap);

            if (!matchedVariant) {
                validOrder = false;
                break;
            }

            const quantity = parseInt(row[mapping.quantity], 10);
            const price = parseFloat(row[mapping.price_per_item]);
            
            if (isNaN(quantity) || isNaN(price) || quantity <= 0) {
                validOrder = false;
                break;
            }

            items.push({
                sku_variant: matchedVariant.sku_variant,
                quantity: quantity,
                price: price
            });
        }

        if (validOrder && items.length > 0) {
            newOrders.push({
                order_sn: String(order_sn),
                tracking_number: orderData.tracking_number,
                order_creation_date: orderData.order_creation_date,
                items: items,
                total: orderData.total
            });
        } else {
            invalidCount++;
        }
    }

    return { newOrders, skippedCount, invalidCount };
};

export const processLazadaOrders = (sheet, masterProductsMap, existingOrderSNs) => {
    const newOrders = [];
    let skippedCount = 0;
    let invalidCount = 0;
    
    const mapping = {
      order_sn: 'ordernumber',
      tracking_number: 'trackingcode',
      order_creation_date: 'createtime',
      sku: 'sellersku',
      price: 'paidprice',
      total_amount: 'totalamount'
    };

    const ordersGrouped = sheet.reduce((acc, row) => {
        const order_sn = row[mapping.order_sn];
        if (!order_sn) return acc;
        if (!acc[order_sn]) {
            acc[order_sn] = {
                tracking_number: row[mapping.tracking_number],
                order_creation_date: parseDate(row[mapping.order_creation_date]),
                total: parseFloat(row[mapping.total_amount] || row[mapping.price] || 0),
                items: []
            };
        }
        acc[order_sn].items.push(row);
        return acc;
    }, {});
    
    for (const order_sn in ordersGrouped) {
        if (existingOrderSNs.has(String(order_sn))) {
            skippedCount++;
            continue;
        }
        
        const orderData = ordersGrouped[order_sn];
        const items = [];
        let validOrder = true;
        
        for (const row of orderData.items) {
            const baseSku = row[mapping.sku];
            if(!baseSku) {
                validOrder = false;
                break;
            }
            const matchedVariant = findMatchingVariant(baseSku, null, masterProductsMap);
            if(!matchedVariant) {
                validOrder = false;
                break;
            }
            const price = parseFloat(row[mapping.price] || 0);
            
            items.push({
                sku_variant: matchedVariant.sku_variant,
                quantity: 1,
                price: price
            });
        }
        
        if(validOrder && items.length > 0) {
             newOrders.push({
                order_sn: String(order_sn),
                tracking_number: orderData.tracking_number,
                order_creation_date: orderData.order_creation_date,
                items: items,
                total: orderData.total
            });
        } else {
            invalidCount++;
        }
    }
    
    return { newOrders, skippedCount, invalidCount };
};

export const processTiktokOrders = (sheet, masterProductsMap, existingOrderSNs) => {
    const newOrders = [];
    let skippedCount = 0;
    let invalidCount = 0;

    const mapping = {
      order_sn: 'order id',
      tracking_number: 'tracking id',
      order_creation_date: 'order time',
      sku: 'seller sku',
      quantity: 'quantity',
      price: 'sku price',
      total_amount: 'order subtotal',
    };
  
    const ordersGrouped = sheet.reduce((acc, row) => {
        const order_sn = row[mapping.order_sn];
        if (!order_sn) return acc;
        if (!acc[order_sn]) {
            acc[order_sn] = {
                tracking_number: row[mapping.tracking_number],
                order_creation_date: parseDate(row[mapping.order_creation_date]),
                total: parseFloat(String(row[mapping.total_amount] || "0").replace(/[^0-9.-]+/g,"")),
                items: [],
            };
        }
        acc[order_sn].items.push(row);
        return acc;
    }, {});

    for (const order_sn in ordersGrouped) {
        if (existingOrderSNs.has(String(order_sn))) {
            skippedCount++;
            continue;
        }

        const orderData = ordersGrouped[order_sn];
        const items = [];
        let validOrder = true;

        for (const row of orderData.items) {
            const baseSku = row[mapping.sku];
            if (!baseSku) {
                validOrder = false;
                break;
            }
            
            const matchedVariant = findMatchingVariant(baseSku, null, masterProductsMap);
            if (!matchedVariant) {
                validOrder = false;
                break;
            }

            const quantity = parseInt(row[mapping.quantity], 10);
            const price = parseFloat(String(row[mapping.price] || "0").replace(/[^0-9.-]+/g,""));
            
            if (isNaN(quantity) || isNaN(price) || quantity <= 0) {
                validOrder = false;
                break;
            }

            items.push({
                sku_variant: matchedVariant.sku_variant,
                quantity: quantity,
                price: price
            });
        }

        if (validOrder && items.length > 0) {
            newOrders.push({
                order_sn: String(order_sn),
                tracking_number: orderData.tracking_number,
                order_creation_date: orderData.order_creation_date,
                items: items,
                total: orderData.total
            });
        } else {
            invalidCount++;
        }
    }
  
    return { newOrders, skippedCount, invalidCount };
};
