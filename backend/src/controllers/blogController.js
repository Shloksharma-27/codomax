import Blog, { CATEGORIES } from '../models/Blog.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { slugify } from '../utils/slugify.js';

function estimateReadingTime(content) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// @route  GET /api/blogs
// @access Public (optionalAuth - "mine=true" requires a logged-in user)
export const getBlogs = asyncHandler(async (req, res) => {
  const { search, category, status, mine, page = 1, limit = 12 } = req.query;

  const filter = {};

  if (mine === 'true') {
    if (!req.user) {
      throw new AppError('Not authorized. Please log in.', 401);
    }
    filter.author = req.user._id;
    if (status && ['draft', 'published'].includes(status)) {
      filter.status = status;
    }
    // mine=true with no status filter returns both drafts and published posts.
  } else {
    // Public listings only ever show published posts.
    filter.status = 'published';
  }

  if (category && CATEGORIES.includes(category)) {
    filter.category = category;
  }

  if (search && search.trim()) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ title: regex }, { excerpt: regex }, { content: regex }];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Blog.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      blogs: blogs.map((b) => b.toClientJSON()),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1
      }
    }
  });
});

// @route  GET /api/blogs/:id
// @access Public
export const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate('author', 'name');

  if (!blog) {
    throw new AppError('Post not found.', 404);
  }

  if (req.query.view === 'true') {
    blog.views = (blog.views || 0) + 1;
    await blog.save();
  }

  res.status(200).json({
    success: true,
    data: { blog: blog.toClientJSON() }
  });
});

// @route  POST /api/blogs
// @access Private
export const createBlog = asyncHandler(async (req, res) => {
  const { title, content, excerpt, category, image, tags, status } = req.body;

  if (!title || !title.trim()) {
    throw new AppError('Title is required.', 400);
  }
  if (!content || !content.trim()) {
    throw new AppError('Content is required.', 400);
  }
  if (category && !CATEGORIES.includes(category)) {
    throw new AppError(`Category must be one of: ${CATEGORIES.join(', ')}.`, 400);
  }

  const blog = await Blog.create({
    title: title.trim(),
    slug: slugify(title),
    content,
    excerpt: excerpt ? excerpt.trim() : content.trim().slice(0, 160),
    category: category || 'Technology',
    image: image || '',
    tags: Array.isArray(tags) ? tags : [],
    status: status === 'published' ? 'published' : 'draft',
    author: req.user._id,
    readingTime: estimateReadingTime(content)
  });

  await blog.populate('author', 'name');

  res.status(201).json({
    success: true,
    message: blog.status === 'published' ? 'Story published.' : 'Draft saved.',
    data: { blog: blog.toClientJSON() }
  });
});

// @route  PUT /api/blogs/:id
// @access Private (author only)
export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw new AppError('Post not found.', 404);
  }

  if (blog.author.toString() !== req.user._id.toString()) {
    throw new AppError('You can only edit your own posts.', 403);
  }

  const { title, content, excerpt, category, image, tags, status } = req.body;

  if (title !== undefined) {
    if (!title.trim()) throw new AppError('Title is required.', 400);
    blog.title = title.trim();
  }
  if (content !== undefined) {
    if (!content.trim()) throw new AppError('Content is required.', 400);
    blog.content = content;
    blog.readingTime = estimateReadingTime(content);
  }
  if (excerpt !== undefined) blog.excerpt = excerpt.trim();
  if (category !== undefined) {
    if (!CATEGORIES.includes(category)) {
      throw new AppError(`Category must be one of: ${CATEGORIES.join(', ')}.`, 400);
    }
    blog.category = category;
  }
  if (image !== undefined) blog.image = image;
  if (tags !== undefined) blog.tags = Array.isArray(tags) ? tags : blog.tags;
  if (status !== undefined) blog.status = status === 'published' ? 'published' : 'draft';

  await blog.save();
  await blog.populate('author', 'name');

  res.status(200).json({
    success: true,
    message: blog.status === 'published' ? 'Story published.' : 'Draft saved.',
    data: { blog: blog.toClientJSON() }
  });
});

// @route  DELETE /api/blogs/:id
// @access Private (author only)
export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    throw new AppError('Post not found.', 404);
  }

  if (blog.author.toString() !== req.user._id.toString()) {
    throw new AppError('You can only delete your own posts.', 403);
  }

  await blog.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Post deleted.'
  });
});
