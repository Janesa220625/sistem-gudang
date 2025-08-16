import React from 'react';
import { render, screen } from '@testing-library/react';
import UploadPreview from '../UploadPreview';

describe('UploadPreview', () => {
  it('renders empty state when no data', () => {
    render(<UploadPreview data={[]} />);
    expect(screen.getByText(/Tidak ada data untuk ditampilkan/i)).toBeInTheDocument();
  });

  it('renders rows when data provided', () => {
    const data = [
      { orderId: 'ORD-1', sku: 'SKU1', variation: 'Red', quantity: 1, price: 10000, storeAccount: 'Toko A', validation: { product: 'ok', duplicate: 'unik' } },
    ];
    render(<UploadPreview data={data} />);
  expect(screen.getByText('ORD-1')).toBeInTheDocument();
  const okBadges = screen.getAllByText(/^OK$/i);
  expect(okBadges.length).toBeGreaterThan(0);
  });
});
