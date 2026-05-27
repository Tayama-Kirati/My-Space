const mongoose = require("mongoose");

const oppostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      maxlength: 200,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    excerpt: {
      type: String,
      maxlength: 500,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    contentType: {
      type: String,
      enum: ["blog", "page", "news", "product"],
      default: "blog",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    editor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["draft", "pending_review", "published", "archived"],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "private", "scheduled"],
      default: "public",
    },

    // SEO
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    ogImage: String,

    // Media
    featuredImage: {
      url: String,
      alt: String,
      cloudinaryId: String,
    },

    // Organization
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    tags: [String],

    // Stats
    viewCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },

    // Publishing
    publishedAt: Date,
    scheduledFor: Date,
    archivedAt: Date,

    // Revisions
    revisions: [
      {
        content: String,
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        comment: String,
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: Date,
  },
  { timestamps: true },
);

// Indexes for performance
postSchema.index({ author: 1, status: 1 });
postSchema.index({ categories: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model("Post", postSchema);
