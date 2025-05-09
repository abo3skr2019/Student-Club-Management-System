import {
    pgTable,
    serial,
    timestamp,
    index,
    uniqueIndex,
    varchar,
    integer,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { withUuid, withArchive } from './common';
import { user } from './user';
import { club } from './club';
import { ClubRole, MembershipStatus } from '../../lib/constants';

// Club membership table with roles
export const clubMembership = pgTable(
    'club_membership',
    {
        id: serial('id').primaryKey(),
        ...withUuid('club_membership'),
        userId: integer('user_id')
            .references(() => user.id, { onDelete: 'cascade' })
            .notNull(),
        clubId: integer('club_id')
            .references(() => club.id, { onDelete: 'cascade' })
            .notNull(),
        role: varchar('role', {
            length: 15,
            enum: [ClubRole.CLUB_ADMIN, ClubRole.HR, ClubRole.MEMBER],
        })
            .notNull()
            .default(ClubRole.MEMBER),
        tag: varchar('tag', { length: 50 }),
        status: varchar('status', {
            length: 10,
            enum: [
                MembershipStatus.ACTIVE,
                MembershipStatus.INACTIVE,
                MembershipStatus.PENDING,
                MembershipStatus.DENIED,
            ],
        })
            .notNull()
            .default(MembershipStatus.PENDING),
        submittingErrors: integer('submitting_errors').notNull().default(0),
        createdBy: integer('created_by')
            .references(() => user.id)
            .notNull(),
        updatedBy: integer('updated_by')
            .references(() => user.id)
            .notNull(),
        joinedAt: timestamp('joined_at').notNull().defaultNow(),
        ...withArchive,
    },
    (table) => ({
        userClubIdx: uniqueIndex('user_club_idx')
            .on(table.userId, table.clubId)
            .where(sql`${table.isArchived} = false`),
        roleIdx: index('club_membership_role_idx').on(table.role),
        statusIdx: index('club_membership_status_idx').on(table.status),
        clubIdx: index('club_membership_club_idx').on(table.clubId),
        isArchivedIdx: index('club_membership_is_archived_idx').on(
            table.isArchived,
        ),
    }),
);

// Validation schemas
const clubMembershipValidation = {
    userId: z.number().int().positive(),
    clubId: z.number().int().positive(),
    role: z.enum([ClubRole.CLUB_ADMIN, ClubRole.HR, ClubRole.MEMBER]),
    tag: z.string().max(50).optional(),
    status: z.enum([
        MembershipStatus.ACTIVE,
        MembershipStatus.INACTIVE,
        MembershipStatus.PENDING,
        MembershipStatus.DENIED,
    ]),
    submittingErrors: z.number().int().min(0),
    createdBy: z.number().int().positive(),
    updatedBy: z.number().int().positive(),
    isArchived: z.boolean(),
    archivedAt: z.coerce.date().optional(),
};

export const insertClubMembershipSchema = createInsertSchema(
    clubMembership,
).extend(clubMembershipValidation);
export const selectClubMembershipSchema = createSelectSchema(clubMembership);
export const updateClubMembershipSchema = insertClubMembershipSchema.partial();

// Additional schema for the API that accepts email
export const createMembershipSchema = z.object({
    email: z.string().email(),
    role: z
        .enum([ClubRole.CLUB_ADMIN, ClubRole.HR, ClubRole.MEMBER])
        .optional(),
    tag: z.string().max(50).optional(),
});
