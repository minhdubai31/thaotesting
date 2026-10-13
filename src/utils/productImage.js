// Uploaded product photos are stored in the database as base64 WebP (or JPEG/PNG) data URLs.
// API responses never send that data. They send a URL to the image endpoint instead.
const IMAGE_DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_LENGTH = 700000;

// Links to outside images are returned unchanged.
function publicImageUrl(product) {
  const value = product?.imageUrl;

  if (!value || !value.startsWith("data:")) {
    return value ?? null;
  }

  const version = product.updatedAt ? `?v=${new Date(product.updatedAt).getTime()}` : "";
  return `/api/products/${product.id}/image${version}`;
}

// Returns a copy of the product whose imageUrl is safe to send to the browser.
function withPublicImage(product) {
  if (!product || !("imageUrl" in product)) {
    return product;
  }

  return { ...product, imageUrl: publicImageUrl(product) };
}

module.exports = {
  IMAGE_DATA_URL,
  MAX_IMAGE_LENGTH,
  publicImageUrl,
  withPublicImage
};
