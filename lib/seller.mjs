export class SellerApplicationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const fields = {
  shopName: ['shop name', 2, 100],
  contactName: ['contact name', 2, 100],
  phone: ['phone number', 7, 25],
  email: ['email address', 3, 254],
  location: ['location', 2, 160],
  categories: ['product categories', 2, 200],
  productName: ['product name', 2, 120],
  productPrice: ['product price', 1, 20],
  productDescription: ['product description', 10, 1000],
};

export function validateSellerApplication(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new SellerApplicationError('Please complete the application form.');
  }

  // The visually hidden field is a low-cost bot trap.
  if (data.website) throw new SellerApplicationError('Application could not be submitted.');

  const clean = {};
  for (const [key, [label, minimum, maximum]] of Object.entries(fields)) {
    if (typeof data[key] !== 'string') throw new SellerApplicationError(`Please enter your ${label}.`);
    clean[key] = data[key].trim();
    if (clean[key].length < minimum || clean[key].length > maximum) {
      throw new SellerApplicationError(`Please check your ${label}.`);
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    throw new SellerApplicationError('Please enter a valid email address.');
  }
  if (!/^(?:\+977[ -]?)?[0-9 -]{7,15}$/.test(clean.phone)) {
    throw new SellerApplicationError('Please enter a valid Nepal phone number.');
  }

  clean.productPrice = Number(clean.productPrice.replace(/,/g, ''));
  if (!Number.isFinite(clean.productPrice) || clean.productPrice < 1 || clean.productPrice > 10000000) {
    throw new SellerApplicationError('Please enter a valid price in Nepalese rupees.');
  }
  clean.productImage = typeof data.productImage === 'string' ? data.productImage.trim() : '';
  if (clean.productImage && (clean.productImage.length > 1000 || !/^https:\/\//i.test(clean.productImage))) {
    throw new SellerApplicationError('Use a secure https image link, or leave it blank and share the photo by email.');
  }
  return clean;
}
