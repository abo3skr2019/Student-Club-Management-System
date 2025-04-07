import { pgTable, serial, varchar, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps, withUuid } from './common';
import { relations } from 'drizzle-orm';
import { user } from './user';
import { event } from './event';
import { clubMembership } from './user';

// Club table definition
export const club = pgTable('club', {
    id: serial('id').primaryKey(),
    ...withUuid('club'),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: varchar('description', { length: 500 }).notNull(),
    logo: varchar('logo', { length: 4096 }).notNull(),
    ...timestamps,
});

// Relations
export const clubRelations = relations(club, ({ many }) => ({
    memberships: many(clubMembership),
    createdEvents: many(event),
}));

// Validation schemas
const clubValidation = {
    name: z.string().min(3).max(100),
    description: z.string().max(500),
    logo: z.string().url().max(4096),
};

export const insertClubSchema = createInsertSchema(club).extend(clubValidation);
export const selectClubSchema = createSelectSchema(club);
export const updateClubSchema = insertClubSchema.partial();
