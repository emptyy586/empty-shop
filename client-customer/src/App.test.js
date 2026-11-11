import { fireEvent, render, screen } from '@testing-library/react';
import ErrorState from './components/ui/ErrorState';

test('customer error state offers a retry action', () => {
  const onRetry = jest.fn();
  render(<ErrorState message="Không thể tải sản phẩm." onRetry={onRetry} />);

  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

  expect(screen.getByRole('alert')).toHaveTextContent('Không thể tải sản phẩm.');
  expect(onRetry).toHaveBeenCalledTimes(1);
});
