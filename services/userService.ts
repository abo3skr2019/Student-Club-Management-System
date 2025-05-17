// Service abstraction for User DB access
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// User model types
export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

/**
 * Find a user by numeric ID.
 * @param id - User numeric ID
 * @returns User record or null
 */
export const findUserById = async (id: number): Promise<User | null> => {
    const record = await db.query.user.findFirst({ where: eq(user.id, id) });
    return record ?? null;
};

/**
 * Find a user by UUID.
 * @param uuid - User UUID
 * @returns User record or null
 */
export const findUserByUUID = async (uuid: string): Promise<User | null> => {
    const record = await db.query.user.findFirst({
        where: eq(user.uuid, uuid),
    });
    return record ?? null;
};

/**
 * Find a user by email.
 * @param email - User email address
 * @returns User record or null
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
    const record = await db.query.user.findFirst({
        where: eq(user.email, email),
    });
    return record ?? null;
};

/**
 * Find a user by university ID.
 * @param uniId - University ID
 * @returns User record or null
 */
export const findUserByUniId = async (uniId: string): Promise<User | null> => {
    const record = await db.query.user.findFirst({
        where: eq(user.uniId, uniId),
    });
    return record ?? null;
};

/**
 * Find a user by national ID.
 * @param nationalId - National ID
 * @returns User record or null
 */
export const findUserByNationalId = async (
    nationalId: string,
): Promise<User | null> => {
    const record = await db.query.user.findFirst({
        where: eq(user.nationalId, nationalId),
    });
    return record ?? null;
};

/**
 * Create a new user record.
 * @param data - New user data
 * @returns Created user record
 */
export const createUser = async (data: NewUser): Promise<User> => {
    const [created] = await db.insert(user).values(data).returning();
    return created;
};

/**
 * Update an existing user by ID.
 * @param id - User numeric ID
 * @param data - Partial user data to update
 */
export const updateUserById = async (
    id: number,
    data: Partial<Omit<NewUser, 'id' | 'uuid'>>,
): Promise<void> => {
    await db
        .update(user)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(user.id, id));
};

/**
 * Delete a user by ID.
 * @param id - User numeric ID
 */
export const deleteUserById = async (id: number): Promise<void> => {
    await db.delete(user).where(eq(user.id, id));
};

/**
 * List all users.
 * @returns Array of user records
 */
export const listUsers = async (): Promise<User[]> => {
    return db.query.user.findMany();
};
