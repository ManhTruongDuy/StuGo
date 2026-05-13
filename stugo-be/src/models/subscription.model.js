import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'pending'],
        default: 'pending'
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    autoRenew: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for quick lookup of active subscriptions
subscriptionSchema.index({ userId: 1, status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
