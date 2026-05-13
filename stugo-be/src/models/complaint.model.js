import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  images: [{
    type: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['service_quality', 'payment', 'booking', 'behavior', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed', 'rejected'],
    default: 'pending'
  },
  response: {
    content: String,
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  resolution: {
    type: String,
    enum: ['refund', 'compensation', 'apology', 'warning', 'ban', 'other'],
  },
  resolutionNote: String,
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
complaintSchema.index({ status: 1, priority: -1, createdAt: -1 });
complaintSchema.index({ userId: 1 });
complaintSchema.index({ serviceId: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
