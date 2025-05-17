// Service abstraction for User DB access
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// environment-based domain for university email derivation
const uniEmailDomain = process.env.UNI_EMAIL_DOMAIN ?? 'university';

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
    // derive uniId from institutional email if not provided
    const insertData = { ...data };
    const emailPattern = new RegExp(`^(\\d{9})@${uniEmailDomain}\\.edu\\.sa$`);
    const match = data.email.match(emailPattern);
    if (match) {
        insertData.uniId = match[1];
    }
    const [created] = await db.insert(user).values(insertData).returning();
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

/**
 * Find a user by ID with optional field selection and relations includes
 */
export const findUserByIdWithOptions = async (
    id: number,
    options: { fields?: string[]; include?: string[] } = {},
): Promise<any> => {
    const { fields = [], include = [] } = options;
    // Fetch base user record
    const userRecord = await findUserById(id);
    if (!userRecord) return null;

    // Build result with selected fields or all
    const result: any = {};
    if (fields.length) {
        fields.forEach((f) => {
            if (Object.prototype.hasOwnProperty.call(userRecord, f)) {
                result[f] = (userRecord as any)[f];
            }
        });
    } else {
        Object.assign(result, userRecord);
    }

    // Conditionally fetch relations
    for (const rel of include) {
        switch (rel) {
            case 'clubMemberships': {
                const { clubMembership } = require('../db/schema');
                const { eq } = require('drizzle-orm');
                result.clubMemberships = await db.query.clubMembership.findMany({
                    where: eq(clubMembership.userId, id),
                });
                break;
            }
            case 'eventRegistration': {
                const { eventRegistration } = require('../db/schema');
                const { eq } = require('drizzle-orm');
                result.eventRegistration = await db.query.eventRegistration.findMany({
                    where: eq(eventRegistration.userId, id),
                });
                break;
            }
            case 'clubsSupervised': {
                const { club } = require('../db/schema');
                const { eq } = require('drizzle-orm');
                result.clubsSupervised = await db.query.club.findMany({
                    where: eq(club.supervisorId, id),
                });
                break;
            }
            case 'createdTasks': {
                const { task } = require('../db/schema');
                const { eq } = require('drizzle-orm');
                result.createdTasks = await db.query.task.findMany({
                    where: eq(task.createdBy, id),
                });
                break;
            }
            case 'updatedTasks': {
                const { task } = require('../db/schema');
                const { eq } = require('drizzle-orm');
                result.updatedTasks = await db.query.task.findMany({
                    where: eq(task.updatedBy, id),
                });
                break;
            }
            case 'assignedTickets': {
                const { ticket } = require('../db/schema');
                const { eq } = require('drizzle-orm');
                result.assignedTickets = await db.query.ticket.findMany({
                    where: eq(ticket.assignedTo, id),
                });
                break;
            }
            case 'createdTickets': {
                const { ticket } = require('../db/schema');
                const { eq } = require('drizzle-orm');
                result.createdTickets = await db.query.ticket.findMany({
                    where: eq(ticket.createdBy, id),
                });
                break;
            }
            // Add other relations as needed
        }
    }

    return result;
};
