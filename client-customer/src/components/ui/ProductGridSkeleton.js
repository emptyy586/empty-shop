import React from 'react';

export default function ProductGridSkeleton({ count = 12 }) {
  return (
    <div className="product-list product-grid-skeleton" aria-label="Đang tải sản phẩm" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div className="skeleton-product" key={index}>
          <span className="skeleton-image" />
          <span className="skeleton-line skeleton-line-short" />
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-line-price" />
        </div>
      ))}
    </div>
  );
}
