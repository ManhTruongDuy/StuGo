import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderCode: {
    type: Number,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'expired'],
    default: 'pending'
  },
  payosTransactionId: {
    type: String
  },
  payosPaymentLinkId: {
    type: String
  },
  checkoutUrl: {
    type: String
  },
  qrCode: {
    type: String
  },
  paidAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1, status: 1 });


const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
