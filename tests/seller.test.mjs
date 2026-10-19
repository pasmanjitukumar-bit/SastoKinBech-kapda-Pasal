import test from 'node:test';
import assert from 'node:assert/strict';
import { SellerApplicationError, validateSellerApplication } from '../lib/seller.mjs';

const valid = {
  shopName: 'Himal Fashion',
  contactName: 'Asha Rai',
  phone: '+977 9800000000',
  email: 'asha@example.com',
  location: 'Pokhara',
  categories: 'Sarees and kurtis',
  productName: 'Floral cotton saree',
  productPrice: '2,499',
  productDescription: 'Lightweight floral saree available in several colors and sizes.',
  productImage: 'https://example.com/saree.jpg',
};

test('validates and normalizes seller and first-product details', () => {
  const application = validateSellerApplication(valid);
  assert.equal(application.productPrice, 2499);
  assert.equal(application.shopName, valid.shopName);
  assert.equal(application.productImage, valid.productImage);
});

test('rejects invalid email and phone details', () => {
  assert.throws(() => validateSellerApplication({ ...valid, email: 'not-an-email' }), SellerApplicationError);
  assert.throws(() => validateSellerApplication({ ...valid, phone: '555' }), SellerApplicationError);
});

test('rejects bad prices, unsafe image URLs, and honeypot submissions', () => {
  assert.throws(() => validateSellerApplication({ ...valid, productPrice: '-2' }), SellerApplicationError);
  assert.throws(() => validateSellerApplication({ ...valid, productImage: 'javascript:alert(1)' }), SellerApplicationError);
  assert.throws(() => validateSellerApplication({ ...valid, website: 'bot' }), SellerApplicationError);
});
