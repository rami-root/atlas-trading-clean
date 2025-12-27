import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { SignJWT } from 'jose';

const jwtSecret = process.env.AUTH_JWT_SECRET;
if (!jwtSecret) {
  throw new Error('AUTH_JWT_SECRET environment variable is not set');
}
const jwtKey = new TextEncoder().encode(jwtSecret);

export const userRouter = router({
  // Login procedure
  login: publicProcedure
    .input(z.object({ 
      email: z.string().email(), 
      password: z.string().min(6) 
    }))
    .mutation(async ({ input }) => {
      const { email, password } = input;
      
      try {
        // Find user by email
        const result = await db.execute(sql`
          SELECT id, username, email, password_hash, role 
          FROM users 
          WHERE LOWER(email) = LOWER(${email})
        `);
        
        const users = result.rows as Array<{
          id: string;
          username: string;
          email: string;
          password_hash: string;
          role: string;
        }>;
        
        if (users.length === 0) {
          throw new Error('Invalid credentials');
        }
        
        const user = users[0];
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }
        
        // Generate JWT token
        const token = await new SignJWT({ 
          userId: user.id, 
          email: user.email,
          role: user.role 
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(jwtKey);
        
        return {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          token,
        };
      } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Login failed');
      }
    }),

  // Register procedure
  register: publicProcedure
    .input(z.object({
      username: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      const { username, email, password } = input;
      
      try {
        // Check if user already exists
        const existingUser = await db.execute(sql`
          SELECT id FROM users WHERE LOWER(email) = LOWER(${email})
        `);
        
        if (existingUser.rows.length > 0) {
          throw new Error('User already exists');
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        const id = nanoid();
        
        // Insert new user
        await db.execute(sql`
          INSERT INTO users (id, username, email, password_hash, role)
          VALUES (${id}, ${username}, ${email}, ${passwordHash}, 'user')
        `);
        
        // Generate JWT token
        const token = await new SignJWT({ 
          userId: id, 
          email: email,
          role: 'user'
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(jwtKey);
        
        return {
          user: {
            id,
            username,
            email,
            role: 'user',
          },
          token,
        };
      } catch (error: any) {
        console.error('Register error:', error);
        throw new Error(error.message || 'Registration failed');
      }
    }),

  // Get profile procedure
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const result = await db.execute(sql`
          SELECT id, username, email, role 
          FROM users 
          WHERE id = ${input.userId}
        `);
        
        const users = result.rows as Array<{
          id: string;
          username: string;
          email: string;
          role: string;
        }>;
        
        if (users.length === 0) {
          throw new Error('User not found');
        }
        
        return users[0];
      } catch (error: any) {
        console.error('Get profile error:', error);
        throw new Error(error.message || 'Failed to get profile');
      }
    }),
});
