import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceName: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    enum: ['transport', 'accommodation', 'restaurant'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: function() {
      // Only required for transport and restaurant reservation
      return this.serviceType === 'transport' || 
             (this.serviceType === 'restaurant' && this.bookingType === 'reservation');
    }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  depositAmount: {
    type: Number,
    required: true,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'deposit_paid', 'fully_paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['vietqr', 'bank_transfer', 'ewallet', 'cash'],
    default: 'vietqr'
  },
  customerInfo: {
    name: String,
    phone: String,
    email: String,
    note: String
  },
  cancelReason: String,
  cancelledAt: Date,
  refundAmount: {
    type: Number,
    default: 0
  },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup', 'dine_in']
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  confirmedAt: Date,
  completedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ serviceId: 1, date: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });

// Pre-save hook to calculate remaining amount
bookingSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.depositAmount;
  next();
});

// Virtual for booking code
bookingSchema.virtual('bookingCode').get(function() {
  return `STG${this._id.toString().slice(-8).toUpperCase()}`;
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
