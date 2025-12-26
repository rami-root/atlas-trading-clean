import 'dotenv/config';
import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from '../trpc';
import path from 'path';
import { createContext } from '../trpc/context';
import { db } from '../db';

const app = express();
const port = process.env.PORT || 3000;

// Middleware for JSON parsing
app.use(express.json());

// TRPC Middleware
app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).send('Server is running');
});

// Serve static files from the client build directory
app.use(express.static(path.join(process.cwd(), 'client/dist')));

// Fallback route for React Router (must be after TRPC and static files)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'client/dist', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log('Database connection established.');
});

// Export app for testing purposes
export default app;
