const getImageSrc = (image) => {
  if (!image) return '';
  if (/^data:image\/[^;,]+;base64,/i.test(image)) return image;
  return 'data:image/jpg;base64,' + image;
};

export default getImageSrc;
