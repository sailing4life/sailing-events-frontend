import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ratesForPeople, validRate } from '../src/utils/invitationRates.ts';

const anna = { id: 1, half_day_rate: 150, full_day_rate: 250 };
const bram = { id: 2, half_day_rate: 180, full_day_rate: 300 };

test('request contains only selected people, retaining zero and individual overrides', () => {
  assert.deepEqual(ratesForPeople([anna, bram], 'morning', { 1: 0, 2: 212.5, 3: 999 }), { 1: 0, 2: 212.5 });
  assert.equal(anna.half_day_rate, 150);
});

test('clearing an override restores the default for the current duration', () => {
  assert.deepEqual(ratesForPeople([anna], 'full_day', { 1: undefined }), { 1: 250 });
  for (const duration of ['morning', 'afternoon', 'evening', 'half_day']) {
    assert.deepEqual(ratesForPeople([anna], duration, {}), { 1: 150 });
  }
  assert.deepEqual(ratesForPeople([anna], 'full_day', { 1: 175.25 }), { 1: 175.25 });
});

test('invalid amounts cannot proceed to a send request', () => {
  for (const rate of [-1, Infinity, NaN, 12.345]) assert.equal(validRate(rate), false);
  for (const rate of [undefined, 0, 0.01, 212.5]) assert.equal(validRate(rate), true);
});
