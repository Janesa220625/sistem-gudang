import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadDropzone from '../UploadDropzone';

describe('UploadDropzone', () => {
  it('renders empty state and accepts file selection', async () => {
  const onFileDrop = vi.fn();
    render(<UploadDropzone onFileDrop={onFileDrop} file={null} />);

    expect(screen.getByText(/Letakkan file di sini/i)).toBeInTheDocument();

  const input = screen.getByTestId('file-input') as HTMLInputElement;
  const file = new File(['hello'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  // Simulate file upload using userEvent
  const user = userEvent.setup();
  await user.upload(input, file);

  // onFileDrop should be called via the dropzone onDrop handler
  expect(onFileDrop).toHaveBeenCalled();
  });
});
