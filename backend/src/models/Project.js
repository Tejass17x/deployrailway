const mongoose = require('mongoose');
const slugify = require('slugify');
const { Schema } = mongoose;

const ProjectSchema = new Schema(
  {
    // ─── Legacy compatibility ────────────────────────────────────────────────
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    // ─── Ownership & Identity ────────────────────────────────────────────────
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    shortTitle: { type: String, trim: true, maxlength: 80 },
    slug: { type: String, trim: true, unique: true, sparse: true, index: true },

    // ─── Media ───────────────────────────────────────────────────────────────
    coverImage: { type: String, default: null },          // R2 URL
    coverImageKey: { type: String, default: null },       // R2 key for deletion
    banner: { type: String, default: null },
    bannerKey: { type: String, default: null },
    logo: { type: String, default: null },
    thumbnail: { type: String, default: null },
    videoIntroduction: { type: String, default: null },   // YouTube/external URL

    // ─── Content ─────────────────────────────────────────────────────────────
    abstract: { type: String, trim: true, maxlength: 1000 },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    longDescription: { type: String, maxlength: 20000 },
    objectives: [{ type: String, trim: true, maxlength: 500 }],
    expectedOutcomes: [{ type: String, trim: true, maxlength: 500 }],
    deliverables: [String],
    notes: { type: String, maxlength: 5000 },

    // ─── Classification ──────────────────────────────────────────────────────
    category: { type: String, trim: true, index: true },
    subcategory: { type: String, trim: true },
    researchDomain: { type: String, index: true },
    researchAreas: [{ type: String, index: true }],
    keywords: [{ type: String, index: true }],
    tags: [{ type: String, index: true }],
    language: { type: String, default: 'English' },

    // ─── Institution & Funding ───────────────────────────────────────────────
    institution: { type: String, trim: true },
    department: { type: String, trim: true },
    organization: { type: String, trim: true },
    principalInvestigator: { type: String, trim: true },
    fundingSource: { type: String, trim: true },
    grantNumber: { type: String, trim: true },
    budget: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: 'USD' },
    country: { type: String, trim: true, index: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },

    // ─── Status & Visibility ─────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'recruiting', 'active', 'completed', 'archived', 'cancelled'],
      default: 'draft',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'hidden', 'institution-only', 'invitation-only'],
      default: 'public',
      index: true,
    },
    projectType: {
      type: String,
      enum: ['open-source', 'private', 'institution-only', 'invitation-only'],
      default: 'open-source',
    },

    // ─── Dates & Duration ────────────────────────────────────────────────────
    startDate: { type: Date },
    endDate: { type: Date },
    estimatedDuration: { type: String, trim: true },
    applicationDeadline: { type: Date, index: true },

    // ─── Team Requirements ───────────────────────────────────────────────────
    maxTeamMembers: { type: Number, min: 1, max: 1000, default: 10 },
    requiredSkills: [{ type: String, trim: true }],
    requiredTechnologies: [{ type: String, trim: true }],
    requiredResearchAreas: [{ type: String, trim: true }],
    requiredExperience: { type: String, trim: true },
    eligibility: { type: String, trim: true, maxlength: 2000 },

    // ─── External Links ──────────────────────────────────────────────────────
    githubUrl: { type: String, trim: true },
    website: { type: String, trim: true },
    datasetLinks: [{ type: String, trim: true }],
    paperUrl: { type: String, trim: true },
    demoUrl: { type: String, trim: true },
    referencePapers: [{ title: String, url: String, doi: String }],

    // ─── GitHub Sync ─────────────────────────────────────────────────────────
    githubRepository: {
      name: String,
      description: String,
      url: String,
      stars: Number,
      forks: Number,
      language: String,
      topics: [String],
      updatedAt: Date,
      isPrivate: Boolean,
      syncedAt: Date,
    },

    // ─── Legal & Ethics ──────────────────────────────────────────────────────
    license: { type: String, trim: true },
    ethicsApproval: { type: Boolean, default: false },
    irbNumber: { type: String, trim: true },

    // ─── Metrics & Analytics ─────────────────────────────────────────────────
    progress: { type: Number, min: 0, max: 100, default: 0 },
    viewCount: { type: Number, default: 0, index: true },
    starCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
    applicationCount: { type: Number, default: 0 },
    memberCount: { type: Number, default: 1 },
    taskCount: { type: Number, default: 0 },
    fileCount: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },

    // ─── Screening Questions ─────────────────────────────────────────────────
    screeningQuestions: [
      {
        question: { type: String, trim: true, maxlength: 500 },
        required: { type: Boolean, default: false },
        type: { type: String, enum: ['text', 'textarea', 'yesno', 'rating'], default: 'text' },
      },
    ],

    // ─── Settings ────────────────────────────────────────────────────────────
    allowApplications: { type: Boolean, default: true },
    allowInvitations: { type: Boolean, default: true },
    requireApplicationApproval: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isVerified: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    // ─── Completion ──────────────────────────────────────────────────────────
    completedAt: { type: Date },
    outcomes: [{ type: String, trim: true }],
    publishedResults: { type: Boolean, default: false },
    resultUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────
ProjectSchema.index({ owner: 1, status: 1, createdAt: -1 });
ProjectSchema.index({ userId: 1, status: 1, createdAt: -1 });
ProjectSchema.index({ status: 1, visibility: 1, createdAt: -1 });
ProjectSchema.index({ researchDomain: 1, status: 1 });
ProjectSchema.index({ country: 1, status: 1 });
ProjectSchema.index({ applicationDeadline: 1, status: 1 });
ProjectSchema.index({ isFeatured: 1, status: 1, viewCount: -1 });
ProjectSchema.index({ viewCount: -1 });
ProjectSchema.index({ starCount: -1 });
ProjectSchema.index({ isDeleted: 1, isArchived: 1 });
ProjectSchema.index(
  { title: 'text', description: 'text', abstract: 'text', tags: 'text', keywords: 'text', researchAreas: 'text' },
  { weights: { title: 10, abstract: 8, keywords: 6, tags: 5, description: 3, researchAreas: 4 } }
);

// ─── Pre-validate Hook ───────────────────────────────────────────────────────
ProjectSchema.pre('validate', async function (next) {
  // Sync legacy userId ↔ owner
  if (!this.owner && this.userId) this.owner = this.userId;
  if (!this.userId && this.owner) this.userId = this.owner;

  // Auto-generate slug on title change
  if (this.isModified('title') && !this.slug) {
    const base = slugify(this.title, { lower: true, strict: true }) || 'project';
    const exists = await this.constructor.exists({ slug: base });
    this.slug = exists ? `${base}-${Date.now().toString().slice(-6)}` : base;
  }
  next();
});

module.exports = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
