import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

// for query purposes
const queryClient = postgres(process.env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });

// Database connection verification function
export const connectDB = async () => {
    try {
        await queryClient`SELECT 1`;
        console.log('PostgreSQL Connected');
    } catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
};
