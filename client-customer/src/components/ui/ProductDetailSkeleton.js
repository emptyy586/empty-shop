import React from 'react';

export default function ProductDetailSkeleton() {
  return (
    <main className="customer-content">
      <div className="product-details product-details-skeleton" role="status" aria-label="Đang tải sản phẩm">
        <div className="skeleton-image" />
        <div className="skeleton-copy">
          <span className="skeleton-line" />
          <span className="skeleton-line" />
          <span className="skeleton-line skeleton-line-short" />
          <span className="skeleton-line skeleton-line-price" />
        </div>
      </div>
    </main>
  );
}
