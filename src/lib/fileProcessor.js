import * as XLSX from 'xlsx';

/**
 * Memproses file spreadsheet yang diunggah.
 * Fungsi ini membaca file, mengubahnya menjadi JSON, dan kemudian
 * menerapkan fungsi prosesor spesifik platform ke setiap baris.
 *
 * @param {File} file - Objek File yang didapat dari input atau dropzone.
 * @param {Function} processor - Fungsi prosesor spesifik platform (misal: shopeeProcessor).
 * @returns {Promise<Array<object>>} Promise yang akan resolve dengan array objek data yang sudah diproses.
 */
export const processUploadedFile = (file, processor) => {
  return new Promise((resolve, reject) => {
    // Validasi dasar
    if (!file) {
      return reject(new Error("Tidak ada file yang disediakan."));
    }
    if (typeof processor !== 'function') {
      return reject(new Error("Fungsi prosesor tidak valid."));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Mengubah sheet menjadi JSON. defval: "" memastikan sel kosong menjadi string kosong.
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          return reject(new Error("File kosong atau format tidak didukung."));
        }

        // Menerapkan fungsi prosesor ke setiap baris data JSON
        const processedData = jsonData.map(processor);

        resolve(processedData);
      } catch (error) {
        console.error("Gagal memproses file:", error);
        reject(new Error("Terjadi kesalahan saat membaca atau memproses file. Pastikan format file benar."));
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error("Gagal membaca file."));
    };

    reader.readAsArrayBuffer(file);
  });
};
