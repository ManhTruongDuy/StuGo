import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    select: false // Don't include in queries by default
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    trim: true
  },
  ward: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  bankAccount: {
    type: String,
    trim: true
  },
  googleId: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    enum: ['user', 'partner', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'banned', 'pending'],
    default: 'active'
  },
  activeSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },
  plan: {
    type: String,
    default: 'free'
  },
  contracts: {
    type: [String],
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for search
userSchema.index({ email: 'text', fullName: 'text' });

// Virtual for avatar URL
userSchema.virtual('avatarUrl').get(function () {
  if (this.avatar) return this.avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.fullName)}&background=0ea5e9&color=fff`;
});

// Virtual for checking if user is Pro
userSchema.virtual('isPro').get(function () {
  return this.plan && this.plan !== 'free';
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Tạm thời vô hiệu hóa việc băm mật khẩu
  // if (!this.isModified('password') || !this.password) {
  //   return next();
  // }

  // try {
  //   const salt = await bcrypt.genSalt(10);
  //   this.password = await bcrypt.hash(this.password, salt);
  //   next();
  // } catch (error) {
  //   next(error);
  // }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  // Tạm thời so sánh mật khẩu plain text
  return candidatePassword === this.password;
  // return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
