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
import { relations } from 'drizzle-orm';
import { club } from './club';
import { event } from './event';

// Provider validation
const providerValidation = z.object({
    name: z.string(),
    providerId: z.string(),
});

// Global role enum
export const GlobalRole = {
    INMA_ADMIN: 'inmaAdmin',
    UNI_ADMIN: 'uniAdmin',
    USER: 'user',
} as const;

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

// Club role enum
export const ClubRole = {
    CLUB_ADMIN: 'clubAdmin',
    HR: 'hr',
    MEMBER: 'member',
} as const;

// Membership status enum
export const MembershipStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

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
        role: text('role', {
            enum: [ClubRole.CLUB_ADMIN, ClubRole.HR, ClubRole.MEMBER],
        })
            .notNull()
            .default(ClubRole.MEMBER),
        tag: varchar('tag', { length: 50 }),
        status: text('status', {
            enum: [MembershipStatus.ACTIVE, MembershipStatus.INACTIVE],
        })
            .notNull()
            .default(MembershipStatus.ACTIVE),
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
        userClubIdx: uniqueIndex('user_club_idx').on(
            table.userId,
            table.clubId,
        ),
        roleIdx: index('club_membership_role_idx').on(table.role),
        statusIdx: index('club_membership_status_idx').on(table.status),
        isArchivedIdx: index('club_membership_is_archived_idx').on(
            table.isArchived,
        ),
    }),
);

// Event registration table with additional fields
export const userToEventJoined = pgTable(
    'user_event_joined',
    {
        id: serial('id').primaryKey(),
        userId: serial('user_id')
            .references(() => user.id, { onDelete: 'cascade' })
            .notNull(),
        eventId: serial('event_id')
            .references(() => event.id, { onDelete: 'cascade' })
            .notNull(),
        registrationDate: timestamp('registration_date').notNull().defaultNow(),
    },
    (table) => ({
        userEventIdx: uniqueIndex('user_event_idx').on(
            table.userId,
            table.eventId,
        ),
    }),
);

// Relations
export const userRelations = relations(user, ({ many }) => ({
    clubMemberships: many(clubMembership),
    eventsJoined: many(userToEventJoined),
}));

// Club membership relations
export const clubMembershipRelations = relations(clubMembership, ({ one }) => ({
    user: one(user, {
        fields: [clubMembership.userId],
        references: [user.id],
    }),
    club: one(club, {
        fields: [clubMembership.clubId],
        references: [club.id],
    }),
}));

// Event registration relations
export const userToEventJoinedRelations = relations(
    userToEventJoined,
    ({ one }) => ({
        user: one(user, {
            fields: [userToEventJoined.userId],
            references: [user.id],
        }),
        event: one(event, {
            fields: [userToEventJoined.eventId],
            references: [event.id],
        }),
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
        GlobalRole.USER,
    ]),
};

export const insertUserSchema = createInsertSchema(user).extend(userValidation);
export const selectUserSchema = createSelectSchema(user);
export const updateUserSchema = insertUserSchema.partial();

// Club membership validation
const clubMembershipValidation = {
    userId: z.number().int().positive(),
    clubId: z.number().int().positive(),
    role: z.enum([ClubRole.CLUB_ADMIN, ClubRole.HR, ClubRole.MEMBER]),
    tag: z.string().max(50).optional(),
    status: z.enum([MembershipStatus.ACTIVE, MembershipStatus.INACTIVE]),
    submittingErrors: z.number().int().min(0),
    createdBy: z.number().int().positive(),
    updatedBy: z.number().int().positive(),
    isArchived: z.boolean(),
    archivedAt: z.date().optional(),
};

export const insertClubMembershipSchema = createInsertSchema(
    clubMembership,
).extend(clubMembershipValidation);
export const selectClubMembershipSchema = createSelectSchema(clubMembership);
export const updateClubMembershipSchema = insertClubMembershipSchema.partial();

// Event registration validation
const eventRegistrationValidation = {
    userId: z.number().int().positive(),
    eventId: z.number().int().positive(),
};

export const insertEventRegistrationSchema = createInsertSchema(
    userToEventJoined,
).extend(eventRegistrationValidation);
export const selectEventRegistrationSchema =
    createSelectSchema(userToEventJoined);
export const updateEventRegistrationSchema =
    insertEventRegistrationSchema.partial();
