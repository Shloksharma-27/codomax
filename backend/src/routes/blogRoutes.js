import { Router } from 'express';
import {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog
} from '../controllers/blogController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getBlogs);
router.get('/:id', getBlogById);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

export default router;
