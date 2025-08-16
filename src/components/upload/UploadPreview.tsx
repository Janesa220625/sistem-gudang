import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, HelpCircle, PlusCircle } from "lucide-react";

type Row = {
  orderId?: string;
  sku?: string;
  variation?: string;
  quantity?: number;
  price?: number;
  storeAccount?: string;
  validation?: { product?: string; duplicate?: string };
};

type UploadPreviewProps = {
  data: Row[];
};

export default function UploadPreview({ data }: UploadPreviewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-card text-center">
        <p className="text-muted-foreground">Tidak ada data untuk ditampilkan.</p>
      </div>
    );
  }

  const formatCurrency = (value: any) => {
    if (typeof value !== "number") return value;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const ProductValidationBadge = ({ status }: { status?: string }) => {
    switch (status) {
      case "ok":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="mr-1 h-3 w-3" /> OK
          </Badge>
        );
      case "baru":
        return (
          <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700">
            <PlusCircle className="mr-1 h-3 w-3" /> Perlu Dibuat
          </Badge>
        );
      case "tanpa_sku":
        return (
          <Badge variant="outline">
            <HelpCircle className="mr-1 h-3 w-3" /> Tanpa SKU
          </Badge>
        );
      default:
        return <Badge variant="outline">Menunggu</Badge>;
    }
  };

  const DuplicateValidationBadge = ({ status }: { status?: string }) => {
    switch (status) {
      case "unik":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Unik
          </Badge>
        );
      case "duplikat":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" /> Duplikat
          </Badge>
        );
      default:
        return <Badge variant="outline">Menunggu</Badge>;
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border bg-card">
      <div className="overflow-auto">
        <Table>
          <TableHeader className="bg-muted/30 sticky top-0">
            <TableRow>
              <TableHead className="w-[160px]">No. Pesanan</TableHead>
              <TableHead className="w-[140px]">SKU</TableHead>
              <TableHead className="w-[160px]">Variasi</TableHead>
              <TableHead className="text-center w-[80px]">Jml</TableHead>
              <TableHead className="text-right w-[120px]">Harga</TableHead>
              <TableHead className="w-[180px]">Akun Toko</TableHead>
              <TableHead className="text-center w-[160px]">Validasi Produk</TableHead>
              <TableHead className="text-center w-[160px]">Validasi Duplikat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={`${row.orderId}-${index}`}
                className={`transition-colors ${index % 2 === 0 ? "bg-background/50" : ""} ${
                  row.validation?.duplicate === "duplikat" ? "bg-red-500/10" : ""
                }`}
              >
                <TableCell className="font-medium">{row.orderId}</TableCell>
                <TableCell className="truncate">{row.sku || "-"}</TableCell>
                <TableCell className="truncate">{row.variation || "-"}</TableCell>
                <TableCell className="text-center">{row.quantity}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.price)}</TableCell>
                <TableCell className="truncate">{row.storeAccount}</TableCell>
                <TableCell className="text-center">
                  <ProductValidationBadge status={row.validation?.product} />
                </TableCell>
                <TableCell className="text-center">
                  <DuplicateValidationBadge status={row.validation?.duplicate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
