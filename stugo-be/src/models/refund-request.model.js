import mongoose from 'mongoose';

const refundRequestSchema = new mongoose.Schema({
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
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  refundPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  refundAmount: {
    type: Number,
    required: true,
    min: 0
  },
  departureDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminReason: {
    type: String
  },
  userReason: {
    type: String
  },
  bankInfo: {
    bankName: { type: String, required: true },
    bankAccount: { type: String, required: true },
    bankAccountName: { type: String, required: true }
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

refundRequestSchema.index({ status: 1 });
refundRequestSchema.index({ bookingId: 1 });
refundRequestSchema.index({ userId: 1 });

const RefundRequest = mongoose.model('RefundRequest', refundRequestSchema);

export default RefundRequest;
