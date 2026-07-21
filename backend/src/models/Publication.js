const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { generatePublicationId, generatePublicationCode } = require('../modules/publication/helper/publicationId.util');

const PublicationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    /**
     * publicationId — Globally unique, immutable identifier.
     * Format: RCPUB_{26-char ULID}  e.g., RCPUB_01J4AB9X2D6Q3P8M7T5VY8K4RZ
     * NEVER collides. NEVER uses Date.now(), Math.random(), or a counter.
     * Generated via ULID (timestamp + cryptographic random) on first save.
     * Uses () => function reference so it is evaluated per-document, not at schema load time.
     */
    publicationId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: () => generatePublicationId()
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    /**
     * publicationCode — Human-readable display code. NOT a unique constraint identifier.
     * Format: RC-YYYY-XXXXXXXX (ULID-random suffix, safe for display)
     * Uses ULID random portion — zero race condition risk.
     */
    publicationCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    authors: {
      type: String,
      default: ''
    },
    researchType: {
      type: String,
      default: ''
    },
    correspondingAuthor: {
      type: String,
      default: ''
    },
    institution: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    publicationDate: {
      type: Date
    },
    isbn: {
      type: String,
      default: ''
    },
    issn: {
      type: String,
      default: ''
    },
    language: {
      type: String,
      default: ''
    },
    researchAreas: [
      {
        type: String,
        trim: true
      }
    ],
    visibility: {
      type: String,
      enum: ['Draft', 'Private', 'Institution Only', 'Public'],
      default: 'Public'
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    },
    pdfUrl: {
      type: String,
      default: ''
    },
    fileDetails: {
      secure_url: { type: String, default: '' },
      public_id: { type: String, default: '' },
      resource_type: { type: String, default: '' },
      bytes: { type: Number, default: 0 },
      format: { type: String, default: '' },
      pages: { type: Number, default: 0 },
      asset_id: { type: String, default: '' }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    document: {
      url: { type: String, default: '' },
      objectKey: { type: String, default: '' },
      fileName: { type: String, default: '' },
      mimeType: { type: String, default: '' },
      fileSize: { type: Number, default: 0 },
      uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      uploadedAt: { type: Date },
      lastModified: { type: Date },
      storageProvider: { type: String, default: 'cloudflare-r2' },
      version: { type: Number, default: 1 }
    },
    attachments: [
      {
        url: { type: String, default: '' },
        objectKey: { type: String, default: '' },
        fileName: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        fileSize: { type: Number, default: 0 },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date },
        attachmentType: { type: String, default: 'supplementary' }
      }
    ],
    license: {
      type: String,
      default: ''
    },
    funding: {
      type: String,
      default: ''
    },
    openAccess: {
      type: Boolean,
      default: false
    },
    thumbnail: {
      type: String,
      default: ''
    },
    publication: {
      type: String,
      default: ''
    },
    journal: {
      type: String,
      default: ''
    },
    conference: {
      type: String,
      default: ''
    },
    publisher: {
      type: String,
      default: ''
    },
    year: {
      type: Number
    },
    citations: {
      type: Number,
      default: 0
    },
    citationId: {
      type: String,
      default: '',
      index: true
    },
    googleScholarPublicationId: {
      type: String,
      trim: true
    },
    paperURL: {
      type: String,
      default: ''
    },
    pdfURL: {
      type: String,
      default: ''
    },
    doi: {
      type: String,
      trim: true
    },
    volume: {
      type: String,
      default: ''
    },
    issue: {
      type: String,
      default: ''
    },
    pages: {
      type: String,
      default: ''
    },
    abstract: {
      type: String,
      default: ''
    },
    keywords: [
      {
        type: String,
        trim: true
      }
    ],
    publicationType: {
      type: String,
      default: 'Article'
    },
    publicationFormat: {
      type: String,
      default: ''
    },
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    recommendations: {
      type: Number,
      default: 0
    },
    googleScholarVerified: {
      type: Boolean,
      default: false
    },
    lastSyncedAt: {
      type: Date
    },
    readingTime: {
      type: Number,
      default: 5
    },
    researchScore: {
      type: Number,
      default: 20
    },
    aiAnalysis: {
      summary: { type: String, default: '' },
      researchGap: { type: String, default: '' },
      futureWork: { type: String, default: '' },
      methodology: { type: String, default: '' },
      keyFindings: { type: String, default: '' },
      noveltyScore: { type: Number, default: 5 },
      difficultyLevel: { type: String, default: 'Intermediate' }
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

PublicationSchema.pre('save', async function (next) {
  if (this.doi === '' || this.doi === null) {
    this.doi = undefined;
  }
  if (this.googleScholarPublicationId === '' || this.googleScholarPublicationId === null) {
    this.googleScholarPublicationId = undefined;
  }

  // 1. Ensure publicationId is set (ULID-based, collision-resistant)
  //    The default: () => generatePublicationId() covers new documents.
  //    This guard handles edge cases where the field was somehow cleared.
  if (!this.publicationId) {
    this.publicationId = generatePublicationId();
  }

  // 2. Auto-generate slug if not present
  if (!this.slug && this.title) {
    const { generateSlug } = require('../modules/publication/helper/slug.helper');
    this.slug = generateSlug(this.title);
  }

  // 3. Auto-generate publicationCode (display label only) if not present
  //    Uses ULID-based generation — no countDocuments(), no race condition.
  if (!this.publicationCode) {
    this.publicationCode = generatePublicationCode();
  }

  if (!this.ownerId && this.userId) {
    this.ownerId = this.userId;
  }
  if (!this.createdBy && this.userId) {
    this.createdBy = this.userId;
  }

  next();
});

PublicationSchema.index({ userId: 1, doi: 1 }, { unique: true, sparse: true });
PublicationSchema.index({ userId: 1, googleScholarPublicationId: 1 }, { unique: true, sparse: true });
PublicationSchema.index({ publicationType: 1 });
PublicationSchema.index({ createdAt: -1 });
PublicationSchema.index({ isDeleted: 1 });
PublicationSchema.index({ userId: 1, isDeleted: 1, status: 1, visibility: 1 });
PublicationSchema.index({ userId: 1, isDeleted: 1 });

// Compound text index for full-text search (Phase 5 Search Engine)
PublicationSchema.index(
  {
    title: 'text',
    abstract: 'text',
    keywords: 'text',
    authors: 'text',
    journal: 'text',
    publication: 'text',
    conference: 'text',
    publisher: 'text',
    institution: 'text',
    researchAreas: 'text',
  },
  {
    name: 'publication_full_text_search',
    weights: {
      title: 10,
      abstract: 5,
      keywords: 8,
      authors: 6,
      journal: 4,
      publication: 4,
      conference: 4,
      researchAreas: 3,
      publisher: 2,
      institution: 2,
    },
    default_language: 'english',
    language_override: 'none',
  }
);

// Compound index for search filters
PublicationSchema.index({ isDeleted: 1, status: 1, visibility: 1 });
PublicationSchema.index({ isDeleted: 1, status: 1, visibility: 1, year: -1 });
PublicationSchema.index({ isDeleted: 1, status: 1, visibility: 1, citations: -1 });
PublicationSchema.index({ isDeleted: 1, status: 1, visibility: 1, views: -1 });


// Sync hooks for Meilisearch
PublicationSchema.post('save', function (doc) {
  try {
    const { syncToMeili } = require('../config/meilisearch');
    syncToMeili('publications', {
      _id: doc._id,
      userId: doc.userId,
      title: doc.title,
      abstract: doc.abstract,
      authors: doc.authors,
      journal: doc.journal,
      conference: doc.conference,
      year: doc.year,
      citations: doc.citations,
      views: doc.views,
      downloads: doc.downloads,
      keywords: doc.keywords,
      publicationType: doc.publicationType,
      status: doc.status,
      visibility: doc.visibility,
      isDeleted: doc.isDeleted
    });
  } catch (err) {
    console.error('Failed to trigger publication meilisearch sync:', err);
  }
});

PublicationSchema.post('remove', function (doc) {
  try {
    const { removeFromMeili } = require('../config/meilisearch');
    removeFromMeili('publications', doc._id);
  } catch (err) {
    console.error('Failed to trigger publication meilisearch delete:', err);
  }
});

const Publication = mongoose.model('Publication', PublicationSchema);

module.exports = Publication;
