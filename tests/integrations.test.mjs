import test from 'node:test';
import assert from 'node:assert/strict';
import { findHeaderRow, findSavedOrder, HEADERS } from '../lib/integrations.mjs';

test('finds the order table below the sheet title and subtitle', () => {
  const rows = [[''], ['SastoKinBech Orders'], ['Cash on delivery orders'], [''], HEADERS];
  assert.equal(findHeaderRow(rows), 4);
});

test('resumes email delivery from the correct columns in the styled order sheet', () => {
  const orderRow = [];
  orderRow[0] = 'SKB-TEST';
  orderRow[16] = 'Sent';
  orderRow[17] = 'Pending';
  orderRow[18] = 'fingerprint-123';
  const rows = [[''], ['SastoKinBech Orders'], ['Cash on delivery orders'], [''], HEADERS, orderRow];

  assert.deepEqual(findSavedOrder(rows, 'SKB-TEST'), {
    id: 'SKB-TEST',
    row: 6,
    fingerprint: 'fingerprint-123',
    businessSent: true,
    customerSent: false,
  });
});

test('rejects a missing or incompatible order table header', () => {
  assert.equal(findHeaderRow([['Order ID'], ['old layout']]), -1);
  assert.throws(() => findSavedOrder([['Order ID']], 'SKB-TEST'), /columns do not match/);
});
