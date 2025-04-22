import {
    pgTable,
    serial,
    text,
    varchar,
    integer,
    index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps, withUuid, withArchive } from './common';
import { relations } from 'drizzle-orm';
import { clubMembership } from './user';
import { user } from './user';

// Task status enum
export const TaskStatus = {
    ACCEPTED: 'accepted',
    PENDING: 'pending',
    CHANGES_REQUESTED: 'changes_requested',
    DENIED: 'denied',
} as const;

// Task category enum
export const TaskCategories = {
    CLUB_PROGRAMS_PROJECTS: 'club_programs_projects',
    UNI_COLLAB: 'uni_collab',
    EXTERNAL_COLLAB: 'external_collab',
    CLUB_INITIATIVES: 'club_initiatives',
    INTERNAL_ACTIVITIES: 'internal_activities',
    COMMUNITY_CONTRIBUTIONS: 'community_contributions',
} as const;

// Task table definition
export const task = pgTable(
    'task',
    {
        id: serial('id').primaryKey(),
        ...withUuid('task'),
        clubMembershipId: integer('club_membership_id')
            .references(() => clubMembership.id)
            .notNull(),
        title: varchar('title', { length: 100 }).notNull(),
        description: varchar('description', { length: 500 }).notNull(),
        volunteeredSeconds: integer('volunteered_seconds').notNull(),
        category: text('category', {
            enum: [
                TaskCategories.CLUB_PROGRAMS_PROJECTS,
                TaskCategories.UNI_COLLAB,
                TaskCategories.EXTERNAL_COLLAB,
                TaskCategories.CLUB_INITIATIVES,
                TaskCategories.INTERNAL_ACTIVITIES,
                TaskCategories.COMMUNITY_CONTRIBUTIONS,
            ],
        }).notNull(),
        status: text('status', {
            enum: [
                TaskStatus.ACCEPTED,
                TaskStatus.PENDING,
                TaskStatus.CHANGES_REQUESTED,
                TaskStatus.DENIED,
            ],
        })
            .notNull()
            .default(TaskStatus.PENDING),
        attachment: varchar('attachment', { length: 4096 }),
        reviewComment: varchar('review_comment', { length: 500 }),
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
        clubMembershipIdx: index('task_club_membership_idx').on(
            table.clubMembershipId,
        ),
        statusIdx: index('task_status_idx').on(table.status),
        isArchivedIdx: index('task_is_archived_idx').on(table.isArchived),
    }),
);

// Relations
export const taskRelations = relations(task, ({ one }) => ({
    clubMembership: one(clubMembership, {
        fields: [task.clubMembershipId],
        references: [clubMembership.id],
    }),
    createdByUser: one(user, {
        fields: [task.createdBy],
        references: [user.id],
    }),
    updatedByUser: one(user, {
        fields: [task.updatedBy],
        references: [user.id],
    }),
}));

// Validation schemas
const taskValidation = {
    clubMembershipId: z.number().int().positive(),
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    volunteeredSeconds: z.number().int().min(0),
    category: z.enum([
        TaskCategories.CLUB_PROGRAMS_PROJECTS,
        TaskCategories.UNI_COLLAB,
        TaskCategories.EXTERNAL_COLLAB,
        TaskCategories.CLUB_INITIATIVES,
        TaskCategories.INTERNAL_ACTIVITIES,
        TaskCategories.COMMUNITY_CONTRIBUTIONS,
    ]),
    status: z.enum([
        TaskStatus.ACCEPTED,
        TaskStatus.PENDING,
        TaskStatus.CHANGES_REQUESTED,
        TaskStatus.DENIED,
    ]),
    attachment: z.string().max(4096).optional(),
    reviewComment: z.string().max(500).optional(),
    createdBy: z.number().int().positive(),
    updatedBy: z.number().int().positive(),
};

export const insertTaskSchema = createInsertSchema(task).extend(taskValidation);
export const selectTaskSchema = createSelectSchema(task);
export const updateTaskSchema = insertTaskSchema.partial();
