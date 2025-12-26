// Supabase-based adapter that mimics tRPC interface
// This allows all pages to work without modification
import { trpcAdapter } from './trpc-adapter';

export const trpc = trpcAdapter as any;
