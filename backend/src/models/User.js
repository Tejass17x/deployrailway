const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageMetadataSchema = new Schema({
  url: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  etag: { type: String, default: '' },
  version: { type: String, default: '1' },
  objectKey: { type: String, default: '' },
  mimeType: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  uploadedAt: { type: Date },
  storageProvider: { type: String, default: 'cloudflare-r2' },
  bucket: { type: String, default: 'research-connect' },
  fileName: { type: String, default: '' }
}, { _id: false });

const setImageMetadata = (val) => {
  if (!val) return { url: '' };
  if (typeof val === 'string') {
    return { url: val };
  }
  return val;
};


const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    fullName: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      enum: ['researcher', 'admin'],
      default: 'researcher'
    },
    researcherType: {
      type: String,
      enum: ['academic', 'corporate', 'medical', 'non_researcher'],
      default: 'non_researcher'
    },
    organizationType: {
      type: String,
      enum: ['institution', 'company', 'hospital', 'organization'],
      default: 'organization'
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'active', 'suspended'],
      default: 'pending'
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    otpVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date
    },
    refreshToken: {
      type: String
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session'
    },
    isActive: {
      type: Boolean,
      default: false
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lastLogin: {
      type: Date
    },
    lastLoginIP: {
      type: String,
      default: ''
    },
    lastLoginDevice: {
      type: String,
      default: ''
    },
    profileImage: {
      type: ImageMetadataSchema,
      set: setImageMetadata,
      default: () => ({ url: '' })
    },
    country: {
      type: String,
      trim: true,
      default: ''
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true
    },
    publicProfileId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    profileSlug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    slug: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true
    },
    profileUrl: {
      type: String,
      trim: true
    },
    publicProfileUrl: {
      type: String,
      trim: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Virtual for displayName
UserSchema.virtual('displayName').get(function() {
  return this.fullName || `${this.firstName} ${this.lastName}`.trim();
});

// Pre-save hook to populate fullName, sync verified fields, and auto-generate username/profile URL
UserSchema.pre('save', async function (next) {
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.fullName = `${this.firstName} ${this.lastName}`.trim();
  }

  // Generate username, public profile URL details and clean slug if not present
  if (!this.username || !this.profileSlug || !this.slug) {
    try {
      const UserModel = mongoose.model('User');
      
      // 1. Generate clean unique slug
      if (!this.slug) {
        const cleanFirst = (this.firstName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
        const cleanLast = (this.lastName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
        let baseSlug = `${cleanFirst}-${cleanLast}`
          .replace(/-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');

        if (!baseSlug) {
          baseSlug = 'researcher';
        }

        let finalSlug = baseSlug;
        let counter = 1;
        
        while (true) {
          const exists = await UserModel.findOne({ slug: finalSlug, _id: { $ne: this._id } });
          if (!exists) {
            break;
          }
          counter++;
          finalSlug = `${baseSlug}-${counter}`;
        }

        this.slug = finalSlug;
      }

      // 2. Generate username and profileSlug (keeping old random suffix for backward compatibility if already set,
      // but otherwise setting it to the clean slug format for new profiles).
      if (!this.username) {
        const cleanFirst = (this.firstName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
        const cleanLast = (this.lastName || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
        let baseUsername = `${cleanFirst}-${cleanLast}`
          .replace(/-+/g, '-')
          .replace(/^-+/, '')
          .replace(/-+$/, '');

        if (!baseUsername) {
          baseUsername = 'researcher';
        }

        // For new users, let's keep username same as base slug if possible
        const exists = await UserModel.findOne({ username: baseUsername, isDeleted: { $ne: true } });
        if (!exists) {
          this.username = baseUsername;
        } else {
          // If username is taken, use suffix for username but keep clean slug
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let randomId = '';
          for (let i = 0; i < 6; i++) {
            randomId += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          const publicProfileId = `rc_${randomId}`;
          this.username = `${baseUsername}-${publicProfileId}`;
          this.publicProfileId = publicProfileId;
        }
      }

      if (!this.profileSlug) {
        this.profileSlug = this.slug;
      }

      this.profileUrl = `/profile/${this.profileSlug}`;
      this.publicProfileUrl = `https://researchconnect.com${this.profileUrl}`;
    } catch (err) {
      console.error('Error generating username and slug in pre-save: ', err);
    }
  }
  next();
});


// Pre-init hook to cast legacy string URLs to structured objects
UserSchema.pre('init', function(rawDoc) {
  if (rawDoc) {
    if (typeof rawDoc.profileImage === 'string') {
      rawDoc.profileImage = { url: rawDoc.profileImage };
    }
    if (typeof rawDoc.coverImage === 'string') {
      rawDoc.coverImage = { url: rawDoc.coverImage };
    }
  }
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.profileImage && typeof ret.profileImage === 'object') {
      ret.thumbnail = ret.profileImage.thumbnail || ret.profileImage.url || '';
      ret.etag = ret.profileImage.etag || '';
      ret.version = ret.profileImage.version || '1';
      ret.profileImage = ret.profileImage.url || '';
    } else {
      ret.thumbnail = ret.profileImage || '';
      ret.etag = '';
      ret.version = '1';
    }
    return ret;
  }
});

UserSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.profileImage && typeof ret.profileImage === 'object') {
      ret.thumbnail = ret.profileImage.thumbnail || ret.profileImage.url || '';
      ret.etag = ret.profileImage.etag || '';
      ret.version = ret.profileImage.version || '1';
      ret.profileImage = ret.profileImage.url || '';
    } else {
      ret.thumbnail = ret.profileImage || '';
      ret.etag = '';
      ret.version = '1';
    }
    return ret;
  }
});

// Indexes
UserSchema.index({ status: 1 });
UserSchema.index({ isDeleted: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ firstName: 1 });
UserSchema.index({ lastName: 1 });
UserSchema.index({ fullName: 1 });

// Sync hooks for Meilisearch
UserSchema.post('save', function (doc) {
  try {
    const { syncToMeili } = require('../config/meilisearch');
    syncToMeili('users', {
      _id: doc._id,
      firstName: doc.firstName,
      lastName: doc.lastName,
      fullName: doc.fullName || `${doc.firstName} ${doc.lastName}`,
      email: doc.email,
      role: doc.role,
      status: doc.status
    });
  } catch (err) {
    console.error('Failed to trigger user meilisearch sync:', err);
  }
});

UserSchema.post('remove', function (doc) {
  try {
    const { removeFromMeili } = require('../config/meilisearch');
    removeFromMeili('users', doc._id);
  } catch (err) {
    console.error('Failed to trigger user meilisearch delete:', err);
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
