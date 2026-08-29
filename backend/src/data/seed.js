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

  // Find or create primary author Shlok Sharma
  let author = await User.findOne({ email: 'shlokrahul1@gmail.com' });
  if (!author) {
    author = await User.create({
      name: 'Shlok Sharma',
      email: 'shlokrahul1@gmail.com',
      password: 'Shlok@2026'
    });
    console.log('Created primary author Shlok Sharma');
  }

  // Delete all old automated test posts that have numeric timestamps
  const deleteResult = await Blog.deleteMany({
    title: { $regex: /\d{5,}/ }
  });
  console.log(`Cleaned up ${deleteResult.deletedCount} automated test posts with numbers in titles.`);

  const curatedPosts = [
    {
      title: 'The Art of Designing Minimalist Interfaces',
      slug: 'the-art-of-designing-minimalist-interfaces',
      category: 'Design',
      image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
      excerpt: 'How simplifying layouts, mastering typographic scale, and embracing intentional white space transforms user engagement.',
      content: `# The Art of Designing Minimalist Interfaces

Minimalism in digital design is not merely the absence of clutter — it is the deliberate presence of purpose. When every element on a screen is forced to earn its existence, the user experience transforms from overwhelming to effortlessly intuitive.

## The Core Principles

### 1. Intentional Typographic Hierarchy
Typography is 95% of web design. By pairing a high-character editorial serif like **Fraunces** with a functional workhorse like **Inter**, you create an immediate sense of authority without needing heavy ornamentation.

### 2. Generous White Space
White space is not empty space; it is a vital structural element. It provides cognitive breathing room and directly commands user attention.

> "Simplicity is about subtracting the obvious and adding the meaningful." — John Maeda

### 3. Purposeful Color Accents
A restrained color palette — warm neutral paper backgrounds paired with a single decisive accent tone — allows interactive buttons and status indicators to stand out instantly.

\`\`\`css
:root {
  --bg: #faf9f6;
  --ink: #1c2321;
  --accent: #1e3a5f;
  --border: #e4e1d8;
}
\`\`\`

When you strip away the decorative excess, what remains is clarity, performance, and lasting beauty.`,
      tags: ['Design', 'UI/UX', 'Typography', 'Minimalism'],
      status: 'published',
      author: author._id,
      readingTime: 4,
      views: 142
    },
    {
      title: 'Architecting Scalable Micro-Frontends for Modern Web Apps',
      slug: 'architecting-scalable-micro-frontends-for-modern-web-apps',
      category: 'Technology',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      excerpt: 'A practical guide to decoupling monolithic web applications into resilient, independently deployable frontend modules.',
      content: `# Architecting Scalable Micro-Frontends

As engineering teams scale, monolithic single-page applications often become bottlenecks for deployment frequency and code ownership. Micro-frontends extend the benefits of microservices directly into the browser.

## Why Decouple the Frontend?

- **Independent Deployment Cycles**: Feature teams can deploy updates to their specific modules without triggering a global build.
- **Technology Agnosticism**: Migrate legacy sections progressively without a risky total rewrite.
- **Isolated Failure Domains**: A runtime exception in a recommendations widget should never crash the core checkout funnel.

\`\`\`javascript
// Dynamic module loader example
async function loadRemoteModule(remoteUrl, moduleName) {
  const container = await import(remoteUrl);
  await container.init(__webpack_share_scopes__.default);
  const factory = await container.get(moduleName);
  return factory();
}
\`\`\`

## Best Practices for 2026
1. Establish a single design system library for visual cohesion.
2. Communicate across boundaries using lightweight CustomEvent buses or standard URLs.
3. Keep shared dependencies strictly version-aligned.`,
      tags: ['Technology', 'Architecture', 'WebDev', 'JavaScript'],
      status: 'published',
      author: author._id,
      readingTime: 5,
      views: 98
    },
    {
      title: 'Deep Work in an Era of Infinite Notifications',
      slug: 'deep-work-in-an-era-of-infinite-notifications',
      category: 'Productivity',
      image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80',
      excerpt: 'Strategies for reclaiming cognitive focus, setting digital boundaries, and cultivating sustained creative momentum.',
      content: `# Deep Work in an Era of Infinite Notifications

The ability to perform deep, uninterrupted work is becoming increasingly rare at the exact same time it is becoming increasingly valuable in our economy.

## The Cost of Context Switching

Every time a notification pings — whether a Slack message, email ping, or task reminder — our brain incurs an *attention residue* cost. Research indicates it takes up to 23 minutes to fully regain deep focus after an interruption.

### High-Impact Focus Strategies:
1. **Time Boxing**: Schedule 90-minute morning focus blocks where all communication apps are completely closed.
2. **Asynchronous First**: Treat messaging channels as asynchronous letterboxes rather than immediate walkie-talkies.
3. **Shutdown Ritual**: Clearly mark the end of the workday to allow full cognitive recovery.

> "If you don't produce, you won't thrive. But to produce at your peak, you must master the art of focus."`,
      tags: ['Productivity', 'Focus', 'Habits', 'Workplace'],
      status: 'published',
      author: author._id,
      readingTime: 3,
      views: 215
    },
    {
      title: 'The Evolution of Full-Stack Engineering in 2026',
      slug: 'the-evolution-of-full-stack-engineering-in-2026',
      category: 'Career',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80',
      excerpt: 'From monolithic servers to distributed cloud runtimes: how modern developers balance specialization with breadth.',
      content: `# The Evolution of Full-Stack Engineering

Full-stack development today is no longer just about writing HTML, CSS, and basic SQL queries. Today's full-stack engineers are cloud orchestrators, API designers, and user experience advocates.

## What Defines a High-Impact Developer Today?

1. **System Thinking**: Understanding how database indexing, network latency, and client-side rendering interact end-to-end.
2. **Security by Design**: Implementing strict input validation, CORS policies, JWT rotation, and least-privilege database roles.
3. **Resilience & Observability**: Building apps with proper health endpoints, graceful shutdowns, and structured logging.

Continuous curiosity and relentless focus on user value remain the timeless foundations of great engineering.`,
      tags: ['Career', 'SoftwareEngineering', 'FullStack', 'NodeJS'],
      status: 'published',
      author: author._id,
      readingTime: 4,
      views: 180
    },
    {
      title: 'Crafting Intentional Morning Routines for Creative Clarity',
      slug: 'crafting-intentional-morning-routines-for-creative-clarity',
      category: 'Lifestyle',
      image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&auto=format&fit=crop&q=80',
      excerpt: 'Why your first 60 minutes set the emotional and intellectual tone for the entire day.',
      content: `# Crafting Intentional Morning Routines

How you spend the first hour of your day profoundly influences your decision-making, mood, and creative stamina throughout the afternoon.

## Designing Your Morning Rhythm

Rather than adopting a rigid 20-step routine from the internet, build a sustainable personal ritual around three pillars:

- **Hydration & Sunlight**: Immediate outdoor light exposure calibrates your circadian rhythm.
- **Zero-Input Time**: Spend at least 30 minutes before looking at screens or social feeds.
- **Mindful Intention**: Identify the single highest-leverage task for the day before opening your email inbox.

Small, consistent daily habits compound into massive long-term wellbeing.`,
      tags: ['Lifestyle', 'Mindfulness', 'Wellness', 'MorningRoutine'],
      status: 'published',
      author: author._id,
      readingTime: 3,
      views: 89
    },
    {
      title: 'Mastering Async Concurrency in Modern Node.js',
      slug: 'mastering-async-concurrency-in-modern-nodejs',
      category: 'Technology',
      image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
      excerpt: 'Deep dive into concurrency, error handling, worker threads, and memory lifecycle in high-throughput backend services.',
      content: `# Mastering Async Concurrency in Node.js

Node.js is renowned for its single-threaded event loop, which enables impressive I/O performance. However, scaling async operations without blocking or memory leaks requires disciplined patterns.

## Concurrency Control with Promise.allSettled

When firing multiple downstream requests, always prefer \`Promise.allSettled\` over \`Promise.all\` to prevent a single transient failure from discarding successful parallel responses:

\`\`\`javascript
const results = await Promise.allSettled([
  fetchAnalytics(),
  fetchUserProfile(),
  fetchNotifications()
]);

const successful = results
  .filter(r => r.status === 'fulfilled')
  .map(r => r.value);
\`\`\`

## Key Takeaways
- Never execute CPU-heavy algorithms directly on the main event loop — offload them to Worker Threads.
- Always implement timeouts on external network calls.
- Handle process \`SIGTERM\` and \`SIGINT\` signals for zero-downtime rollouts.`,
      tags: ['Technology', 'NodeJS', 'Backend', 'Performance'],
      status: 'published',
      author: author._id,
      readingTime: 5,
      views: 165
    }
  ];

  for (const postData of curatedPosts) {
    const existing = await Blog.findOne({ title: postData.title });
    if (!existing) {
      await Blog.create(postData);
      console.log(`✅ Created: "${postData.title}"`);
    } else {
      existing.author = author._id;
      await existing.save();
      console.log(`ℹ️ Updated author for: "${postData.title}"`);
    }
  }

  console.log('🎉 Seeding completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
