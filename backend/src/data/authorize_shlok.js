import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Blog from '../models/Blog.js';

async function seed() {
  await connectDB();

  // Create or update Shlok Sharma author account
  let author = await User.findOne({ email: 'shlokrahul1@gmail.com' });
  if (!author) {
    author = await User.findOne({ email: 'shlok.sharma@papertrail.dev' });
  }

  if (!author) {
    author = await User.create({
      name: 'Shlok Sharma',
      email: 'shlokrahul1@gmail.com',
      password: 'Shlok@2026'
    });
    console.log('✅ Created primary author account: Shlok Sharma (shlokrahul1@gmail.com)');
  } else {
    author.name = 'Shlok Sharma';
    await author.save();
    console.log('✅ Updated primary author account to Shlok Sharma');
  }

  // Attribute all published articles to Shlok Sharma
  const updateRes = await Blog.updateMany({}, { author: author._id });
  console.log(`✅ Attributed ${updateRes.matchedCount} articles to Shlok Sharma.`);

  console.log('🎉 Author authorization complete!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Authorization setup error:', err);
  process.exit(1);
});
