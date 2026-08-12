import dotenv from 'dotenv';

dotenv.config();

import { connectDB } from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Papertrail API listening on http://localhost:${PORT}`);
  });
}

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err.message);
});
