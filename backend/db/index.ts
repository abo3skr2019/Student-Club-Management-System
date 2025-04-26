import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let db: any;
let connectDB: () => Promise<void>;

if (process.env.NODE_ENV === 'test') {
    // Dummy db and connectDB for tests
    db = { select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }), insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }) };
    connectDB = async () => {};
} else {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
    }
    const queryClient = postgres(process.env.DATABASE_URL);
    db = drizzle(queryClient, { schema });
    connectDB = async () => {
        try {
            await queryClient`SELECT 1`;
            console.log('PostgreSQL Connected');
        } catch (error) {
            console.error('Failed to connect to database:', error);
            process.exit(1);
        }
    };
}

export { db, connectDB };
