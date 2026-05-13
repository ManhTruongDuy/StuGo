/**
 * Property Test: Refund Rate Binary (Property 3)
 *
 * For any elapsed time since booking creation, refundRate is always
 * exactly 1.0 or 0.15 — never any other value.
 *
 * elapsedMinutes ≤ 30 ⟹ refundRate = 1.0
 * elapsedMinutes > 30 ⟹ refundRate = 0.15
 *
 * Validates: Requirements 2.2, 2.3
 */

import fc from 'fast-check';

/**
 * Pure refund calculation extracted from booking.controller.js cancelBooking.
 */
function calculateFairPlayRefund(booking) {
  const elapsedMs = Date.now() - new Date(booking.createdAt).getTime();
  const elapsedMinutes = elapsedMs / 60000;

  const amountPaid =
    booking.paymentStatus === 'fully_paid'
      ? booking.depositAmount + booking.remainingAmount
      : booking.depositAmount;

  const refundRate = elapsedMinutes <= 30 ? 1.0 : 0.15;
  const refundAmount = Math.round(amountPaid * refundRate);

  return { refundRate, refundAmount, elapsedMinutes };
}

// Property 1: refundRate is always exactly 1.0 or 0.15
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 120 }),          // elapsedMinutes
    fc.integer({ min: 0, max: 10_000_000 }),   // depositAmount (VND)
    fc.integer({ min: 0, max: 10_000_000 }),   // remainingAmount (VND)
    fc.constantFrom('deposit_paid', 'fully_paid'),
    (elapsedMinutes, depositAmount, remainingAmount, paymentStatus) => {
      const createdAt = new Date(Date.now() - elapsedMinutes * 60 * 1000);
      const booking = { createdAt, depositAmount, remainingAmount, paymentStatus };
      const { refundRate } = calculateFairPlayRefund(booking);
      return refundRate === 1.0 || refundRate === 0.15;
    }
  ),
  { numRuns: 1000 }
);

// Property 2: grace period boundary — ≤30 min → 1.0, >30 min → 0.15
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 30 }),           // within grace period
    fc.integer({ min: 0, max: 1_000_000 }),
    (elapsedMinutes, depositAmount) => {
      const createdAt = new Date(Date.now() - elapsedMinutes * 60 * 1000);
      const booking = { createdAt, depositAmount, remainingAmount: 0, paymentStatus: 'deposit_paid' };
      const { refundRate } = calculateFairPlayRefund(booking);
      return refundRate === 1.0;
    }
  ),
  { numRuns: 500 }
);

fc.assert(
  fc.property(
    fc.integer({ min: 31, max: 10000 }),       // after grace period
    fc.integer({ min: 0, max: 1_000_000 }),
    (elapsedMinutes, depositAmount) => {
      const createdAt = new Date(Date.now() - elapsedMinutes * 60 * 1000);
      const booking = { createdAt, depositAmount, remainingAmount: 0, paymentStatus: 'deposit_paid' };
      const { refundRate } = calculateFairPlayRefund(booking);
      return refundRate === 0.15;
    }
  ),
  { numRuns: 500 }
);

console.log('✅ Property 3 (Refund Rate Binary): PASSED — refundRate is always 1.0 or 0.15');
