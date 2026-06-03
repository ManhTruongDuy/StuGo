import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  targetRole: {
    type: String,
    enum: ['user', 'partner', 'all'],
    default: 'all'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  durationDays: {
    type: Number,
    required: true,
    min: 1
  },
  features: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;
