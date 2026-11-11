import { fireEvent, render, screen } from '@testing-library/react';
import ErrorState from './components/ui/ErrorState';

test('admin error state offers a retry action', () => {
  const onRetry = jest.fn();
  render(<ErrorState message="Không thể tải danh sách." onRetry={onRetry} />);

  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

  expect(screen.getByRole('alert')).toHaveTextContent('Không thể tải danh sách.');
  expect(onRetry).toHaveBeenCalledTimes(1);
});
