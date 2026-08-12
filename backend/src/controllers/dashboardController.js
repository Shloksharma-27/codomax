import Blog from '../models/Blog.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @route  GET /api/dashboard/stats
// @access Private
export const getDashboardStats = asyncHandler(async (req, res) => {
  const authorId = req.user._id;

  const [totalPosts, publishedPosts, draftPosts, viewsAgg] = await Promise.all([
    Blog.countDocuments({ author: authorId }),
    Blog.countDocuments({ author: authorId, status: 'published' }),
    Blog.countDocuments({ author: authorId, status: 'draft' }),
    Blog.aggregate([
      { $match: { author: authorId } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ])
  ]);

  const totalViews = viewsAgg[0]?.totalViews || 0;

  res.status(200).json({
    success: true,
    data: {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews
    }
  });
});
