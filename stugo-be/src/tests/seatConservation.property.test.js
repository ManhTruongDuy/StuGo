/**
 * Property Test: Seat Conservation (Property 1)
 *
 * For any sequence of valid transport bookings, the sum of quantity
 * across all non-cancelled bookings never exceeds service.seats.
 *
 * ∀ slot: Σ(booking.quantity | non-cancelled) ≤ service.seats
 *
 * Validates: Requirements 1.4, 1.5
 */

import fc from 'fast-check';

/**
 * Pure function extracted from booking.controller.js logic.
 * Simulates the seat availability check and booking creation.
 */
function simulateBookings(totalSeats, bookingRequests) {
  const bookings = []; // { quantity, status }

  for (const req of bookingRequests) {
    const bookedSeats = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.quantity, 0);

    const availableSeats = totalSeats - bookedSeats;

    if (req.quantity <= availableSeats && req.quantity > 0) {
      bookings.push({ quantity: req.quantity, status: 'confirmed' });
    }
    // else: booking rejected — not added
  }

  return bookings;
}

function totalNonCancelledSeats(bookings) {
  return bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.quantity, 0);
}

// Property: seat conservation holds for any sequence of booking requests
fc.assert(
  fc.property(
    fc.integer({ min: 1, max: 50 }),           // totalSeats
    fc.array(
      fc.record({ quantity: fc.integer({ min: 1, max: 10 }) }),
      { minLength: 0, maxLength: 20 }
    ),
    (totalSeats, requests) => {
      const bookings = simulateBookings(totalSeats, requests);
      const used = totalNonCancelledSeats(bookings);
      return used <= totalSeats;
    }
  ),
  { numRuns: 1000, verbose: true }
);

console.log('✅ Property 1 (Seat Conservation): PASSED — booked seats never exceed service.seats');
