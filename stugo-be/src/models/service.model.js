import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['transport', 'accommodation', 'restaurant', 'carpool'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  ward: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  images: [{
    type: String
  }],
  openTime: {
    type: String,
    default: '08:00'
  },
  closeTime: {
    type: String,
    default: '22:00'
  },
  priceRange: {
    min: {
      type: Number,
      required: true,
      min: 0
    },
    max: {
      type: Number,
      required: true,
      min: 0
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    default: 0
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'rejected', 'suspended'],
    default: 'pending'
  },
  // Transport specific
  vehicleType: String,
  seats: Number,
  routes: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
      default: () => new mongoose.Types.ObjectId()
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }
  }],
  departureTime: [String],
  // Accommodation specific
  roomTypes: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
      default: () => new mongoose.Types.ObjectId()
    },
    name: String,
    price: Number,
    capacity: Number,
    available: Number,
    images: [String]
  }],
  amenities: [String],
  rules: [String],
  // Restaurant specific
  cuisine: [String],
  menuItems: [{
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true,
      default: () => new mongoose.Types.ObjectId()
    },
    name: String,
    price: Number,
    description: String,
    image: String,
    category: String
  }],
  hasDelivery: Boolean,
  hasReservation: Boolean,
  // Carpool specific
  carpoolOptions: {
    vehicleInfo: {
      engineType: { type: String, enum: ['electric', 'gasoline'] },
      brand: String,
      vehicleName: String,
      seats: { type: Number, enum: [5, 7] }
    },
    routes: [{
      name: String,
      isHighwayDefault: { type: Boolean, default: true },
      sharedPricing: {
        pricePerGuest: Number,
        airportSurcharge: Number,
        extraPointSurcharge: Number,
        twoGuestsDiscountedPrice: Number
      },
      privatePricing: {
        seats5: {
          oneWayPrice: Number,
          twoWayPrice: Number
        },
        seats7: {
          oneWayPrice: Number,
          twoWayPrice: Number
        }
      }
    }]
  },
  // Snap Map flash deal
  flashDeal: {
    dealPrice: {
      type: Number,
      min: 0
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100
    },
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
serviceSchema.index({ location: '2dsphere' });

// Index for text search
serviceSchema.index({ name: 'text', description: 'text', address: 'text' });

// Index for filtering
serviceSchema.index({ type: 1, city: 1, status: 1 });
serviceSchema.index({ rating: -1, popularity: -1 });

// Sparse index for Snap Map flash deal queries
serviceSchema.index(
  { 'flashDeal.isActive': 1, 'flashDeal.expiresAt': 1 },
  { sparse: true }
);

// Virtual for latitude/longitude
serviceSchema.virtual('latitude').get(function() {
  return this.location?.coordinates?.[1] || 0;
});

serviceSchema.virtual('longitude').get(function() {
  return this.location?.coordinates?.[0] || 0;
});

const Service = mongoose.model('Service', serviceSchema);

export default Service;
