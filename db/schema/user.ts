import {
    pgTable,
    serial,
    text,
    jsonb,
    timestamp,
    index,
    uniqueIndex,
    varchar,
    integer,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps, withUuid, withArchive } from './common';
import { club } from './club';
import { event } from './event';
import { GlobalRole, ClubRole, MembershipStatus } from '../../lib/constants';

// Provider validation
const providerValidation = z.object({
    name: z.string(),
    providerId: z.string(),
});

// User table definition
export const user = pgTable(
    'user',
    {
        id: serial('id').primaryKey(),
        ...withUuid('user'),
        uniId: varchar('uni_id', { length: 9 }).unique(),
        nationalId: varchar('national_id', { length: 10 }).notNull().unique(),
        phoneNumber: varchar('phone_number', { length: 10 }).notNull(),
        displayName: text('display_name').notNull(),
        firstName: text('first_name').notNull(),
        lastName: text('last_name'),
        email: text('email').notNull().unique(),
        profileImage: text('profile_image').notNull(),
        providers: jsonb('providers')
            .notNull()
            .default([])
            .$type<Array<{ name: string; providerId: string }>>(),
        globalRole: text('global_role', {
            enum: [
                GlobalRole.INMA_ADMIN,
                GlobalRole.UNI_ADMIN,
                GlobalRole.SUPERVISOR,
                GlobalRole.USER,
            ],
        })
            .notNull()
            .default(GlobalRole.USER),
        ...withArchive,
        ...timestamps,
    },
    (table) => ({
        globalRoleIdx: index('global_role_idx').on(table.globalRole),
        providerIdx: index('provider_idx').on(table.providers),
        isArchivedIdx: index('user_is_archived_idx').on(table.isArchived),
    }),
);

// Validation schemas
const userValidation = {
    displayName: z.string().min(2),
    firstName: z.string().min(2),
    lastName: z.string().optional(),
    email: z.string().email(),
    uniId: z.string().length(9).optional(),
    nationalId: z
        .string()
        .length(10)
        .regex(/^\d+$/, 'National ID must contain only digits'),
    phoneNumber: z
        .string()
        .length(10)
        .regex(/^\d+$/, 'Phone number must contain only digits'),
    profileImage: z.string().url(),
    providers: z.array(providerValidation),
    globalRole: z.enum([
        GlobalRole.INMA_ADMIN,
        GlobalRole.UNI_ADMIN,
        GlobalRole.SUPERVISOR,
        GlobalRole.USER,
    ]),
};

export const insertUserSchema = createInsertSchema(user).extend(userValidation);
export const selectUserSchema = createSelectSchema(user);
export const updateUserSchema = insertUserSchema.partial();
