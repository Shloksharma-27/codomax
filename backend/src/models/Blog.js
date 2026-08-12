import mongoose from 'mongoose';

const CATEGORIES = ['Technology', 'Design', 'Productivity', 'Career', 'Lifestyle'];

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [300, 'Excerpt cannot exceed 300 characters'],
      default: ''
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Technology'
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    views: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

blogSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

/**
 * Serializes a populated (or unpopulated) blog document into the shape
 * the existing frontend expects: `author` as a display name, `id` instead
 * of `_id`, and `date` as an ISO date string derived from createdAt.
 */
blogSchema.methods.toClientJSON = function toClientJSON() {
  const authorIsPopulated = this.author && typeof this.author === 'object' && this.author.name;

  return {
    id: this._id,
    title: this.title,
    slug: this.slug,
    content: this.content,
    excerpt: this.excerpt,
    category: this.category,
    image: this.image,
    tags: this.tags,
    status: this.status,
    author: authorIsPopulated ? this.author.name : undefined,
    authorId: authorIsPopulated ? this.author._id : this.author,
    views: this.views,
    readingTime: this.readingTime,
    date: this.createdAt ? this.createdAt.toISOString().slice(0, 10) : undefined,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
export { CATEGORIES };
