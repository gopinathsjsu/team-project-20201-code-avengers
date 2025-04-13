const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cuisine: {
    type: String,
    required: true
  },
  costRating: {
    type: Number,
    min: 1,
    max: 5
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  businessHours: [{
    day: Number, // 0-6 (Sunday-Saturday)
    open: String, // HH:MM format
    close: String // HH:MM format
  }],
  tables: [{
    capacity: Number,
    quantity: Number
  }],
  description: String,
  photos: [String],
  averageRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  bookingsToday: {
    type: Number,
    default: 0
  },
  approved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

// Create index for location-based searches
restaurantSchema.index({ 'address.city': 1, 'address.state': 1, 'address.zipCode': 1 });

module.exports = mongoose.model('Restaurant', mongoose.model); 