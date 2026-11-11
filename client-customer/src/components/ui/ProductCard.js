import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MyContext from '../../contexts/MyContext';
import getImageSrc from '../../utils/getImageSrc';
import formatMoney from '../../utils/formatMoney';
import useReveal from '../../hooks/useReveal';
import useCountUp from '../../hooks/useCountUp';
import usePointerLight from '../../hooks/usePointerLight';

function ProductCard({ product, index = 0, rank, sold, featured = false, animateOnUpdate = false }) {
  const context = React.useContext(MyContext);
  const cardRef = useRef(null);
  const resetRef = useRef(0);
  const revealed = useReveal(cardRef);
  const soldCount = useCountUp(sold, cardRef);
  const [added, setAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  usePointerLight(cardRef);

  useEffect(() => () => {
    window.clearTimeout(resetRef.current);
  }, []);

  const addToCart = () => {
    const cart = context.mycart || [];
    const existing = cart.find((entry) => entry.product?._id === product._id);
    context.setMycart(existing
      ? cart.map((entry) => entry.product?._id === product._id
        ? { ...entry, quantity: Number(entry.quantity || 0) + 1 }
        : entry)
      : [...cart, { product, quantity: 1 }]);
    context.showToast(`Đã thêm "${product.name}" vào giỏ hàng.`, 'success');
    setAdded(true);
    window.clearTimeout(resetRef.current);
    resetRef.current = window.setTimeout(() => setAdded(false), 1000);
  };

  return (
    <article
      ref={cardRef}
      className={`product-card${featured ? ' product-card-featured' : ''}${revealed ? ' is-revealed' : ' reveal-pending'}${animateOnUpdate ? ' page-stagger' : ''}`}
      style={{ '--reveal-delay': `${index * 40}ms` }}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget &&
          (event.propertyName === 'opacity' || event.propertyName === 'transform')) {
          event.currentTarget.style.removeProperty('--reveal-delay');
        }
      }}
    >
      {rank && <span className={`product-rank rank-${rank}`}>Hạng {rank}</span>}
      <Link className={`product-card-image${imageLoaded ? ' image-loaded' : ''}`} to={`/product/${product._id}`}>
        {product.image && (
          <img
            loading="lazy"
            src={getImageSrc(product.image)}
            alt={product.name || ''}
            width="300"
            height="300"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        )}
      </Link>
      <span className="product-card-category">{product.category?.name || 'Sản phẩm'}</span>
      <Link className="product-card-name" to={`/product/${product._id}`}>{product.name || ''}</Link>
      <div className="product-card-footer">
        <div>
          <span className="product-price">{formatMoney(product.price)}</span>
          {sold !== undefined && <span className="product-sold">Đã bán {soldCount}</span>}
        </div>
        <button
          type="button"
          className={`iconbtn quick-add${added ? ' is-added' : ''}`}
          aria-label={added ? `Đã thêm ${product.name || 'sản phẩm'} vào giỏ` : `Thêm ${product.name || 'sản phẩm'} vào giỏ`}
          onClick={addToCart}
        >
          {added
            ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
            : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
