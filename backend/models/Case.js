import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

const caseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Case title is required'],
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Case description is required'],
    trim: true 
  },
  caseType: { 
    type: String, 
    required: [true, 'Case type is required'],
    enum: ['Civil', 'Criminal', 'Corporate', 'Family', 'Property', 'Intellectual Property', 'Labor', 'Tax', 'Other'],
    trim: true
  },
  expertise: { 
    type: [String], 
    required: [true, 'At least one expertise area is required'],
    validate: [array => array.length > 0, 'At least one expertise area is required']
  },
  location: { 
    type: String, 
    required: [true, 'Location is required'],
    trim: true 
  },
  budget: {
    amount: { type: Number, required: [true, 'Budget amount is required'] },
    currency: { type: String, default: 'INR' },
    type: { type: String, enum: ['Fixed', 'Hourly', 'Negotiable'], default: 'Fixed' }
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  deadline: { 
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days from now
    validate: {
      validator: function(v) {
        // Make deadline optional, but if provided, it must be in the future
        return !v || v > Date.now();
      },
      message: 'Deadline must be in the future'
    }
  },
  // Auto-expiry date - cases will be automatically deleted after 2 months
  expiryDate: {
    type: Date,
    default: () => new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000), // 2 months from now
    index: { expireAfterSeconds: 0 } // MongoDB TTL index for automatic deletion
  },
  isRemote: { 
    type: Boolean, 
    default: false 
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Closed', 'Cancelled'],
    default: 'Open'
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  applications: [applicationSchema],
  views: { type: Number, default: 0 },
  slug: { type: String, unique: true },
  tags: [String],
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
 });

// Create a text index for search functionality
caseSchema.index({
  title: 'text',
  description: 'text',
  'expertise': 'text',
  location: 'text',
  'caseType': 'text'
});

// Create TTL index for automatic deletion after 2 months
caseSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

// Auto-update expiry date before saving
caseSchema.pre('save', function(next) {
  // Only set expiry date if it's a new document and no expiry date is set
  if (this.isNew && !this.expiryDate) {
    this.expiryDate = new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000); // 2 months from now
  }
  next();
});

// Pre-save hook to create slug
caseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');
  }
  next();
});

const Case = mongoose.model("Case", caseSchema);

export default Case;