import {
    pgTable,
    serial,
    varchar,
    text,
    index,
    date,
    integer,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps, withUuid, withArchive } from './common';
import { relations } from 'drizzle-orm';
import { user } from './user';
import { event } from './event';
import { clubMembership } from './user';
import { supervisor } from './supervisor';

// Club type enum
export const ClubType = {
    GENERAL: 'general', // عام
    SPECIALIZED: 'specialized', // تخصصي
} as const;

// Club status enum
export const ClubStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

// Club table definition
export const club = pgTable(
    'club',
    {
        id: serial('id').primaryKey(),
        ...withUuid('club'),
        name: varchar('name', { length: 100 }).notNull().unique(),
        description: varchar('description', { length: 500 }).notNull(),
        logo: varchar('logo', { length: 4096 }).notNull(),
        supervisorId: integer('supervisor_id')
            .references(() => supervisor.id)
            .notNull(),
        type: text('type', {
            enum: [ClubType.GENERAL, ClubType.SPECIALIZED],
        }).notNull(),
        foundingDate: date('founding_date'),
        status: text('status', {
            enum: [ClubStatus.ACTIVE, ClubStatus.INACTIVE],
        })
            .notNull()
            .default(ClubStatus.ACTIVE),
        createdBy: integer('created_by')
            .references(() => user.id)
            .notNull(),
        updatedBy: integer('updated_by')
            .references(() => user.id)
            .notNull(),
        ...withArchive,
        ...timestamps,
    },
    (table) => ({
        statusIdx: index('club_status_idx').on(table.status),
        isArchivedIdx: index('club_is_archived_idx').on(table.isArchived),
    }),
);

// Relations
export const clubRelations = relations(club, ({ many, one }) => ({
    memberships: many(clubMembership),
    createdEvents: many(event),
    supervisor: one(supervisor, {
        fields: [club.supervisorId],
        references: [supervisor.id],
    }),
}));

// Validation schemas
const clubValidation = {
    name: z.string().min(3).max(100),
    description: z.string().max(500),
    logo: z.string().url().max(4096),
    supervisorId: z.number().int().positive(),
    type: z.enum([ClubType.GENERAL, ClubType.SPECIALIZED]),
    foundingDate: z.date().optional(),
    status: z.enum([ClubStatus.ACTIVE, ClubStatus.INACTIVE]),
    createdBy: z.number().int().positive(),
    updatedBy: z.number().int().positive(),
};

export const insertClubSchema = createInsertSchema(club).extend(clubValidation);
export const selectClubSchema = createSelectSchema(club);
export const updateClubSchema = insertClubSchema.partial();
