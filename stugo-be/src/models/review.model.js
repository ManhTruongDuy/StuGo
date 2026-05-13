import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
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
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  images: [{
    type: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  reply: {
    content: String,
    repliedAt: Date,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  status: {
    type: String,
    enum: ['active', 'hidden', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ serviceId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });

// Prevent duplicate reviews - one review per user per service
reviewSchema.index({ userId: 1, serviceId: 1 }, { unique: true, sparse: true });

// Separate index for booking reviews
reviewSchema.index({ userId: 1, bookingId: 1 }, { sparse: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
