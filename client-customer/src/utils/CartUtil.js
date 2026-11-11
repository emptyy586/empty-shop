const getTotal = (mycart) =>
  mycart.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

export { getTotal };
