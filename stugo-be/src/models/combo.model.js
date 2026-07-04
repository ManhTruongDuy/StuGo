import mongoose from 'mongoose';

const comboSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  destination: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true, // VD: "3 Ngày 2 Đêm"
    trim: true
  },
  
  // Liên kết các dịch vụ của Supplier
  linkedServices: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    netPriceAtBooking: Number // Snapshot giá sỉ để đối soát thanh toán nếu cần
  }], 
  
  accommodationName: {
    type: String,
    trim: true
  },
  transportType: {
    type: String,
    trim: true
  },

  // Thông tin hiển thị dạng Tour
  includes: [{
    type: String,
    trim: true
  }], 
  excludes: [{
    type: String,
    trim: true
  }],
  termsAndConditions: [{
    type: String,
    trim: true
  }],

  // Cấu trúc giá trọn gói bán cho khách hàng
  pricing: {
    servedPrice: {
      type: Number,
      min: 0
    }, 
    unservedPrice: {
      type: Number,
      min: 0
    },
    privateRentalPrice: {
      type: Number,
      min: 0
    }
  },

  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }, // Reseller (Partner A) or Admin
  
  status: { 
    type: String, 
    enum: ['active', 'pending', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  rating: { 
    type: Number, 
    default: 0 
  },
  reviewCount: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for searching and filtering
comboSchema.index({ name: 'text', destination: 'text' });
comboSchema.index({ status: 1, destination: 1 });
comboSchema.index({ ownerId: 1 });

const Combo = mongoose.model('Combo', comboSchema);

export default Combo;
