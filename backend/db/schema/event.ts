import {
    pgTable,
    serial,
    varchar,
    integer,
    timestamp,
    index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps, withUuid } from './common';
import { relations } from 'drizzle-orm';
import { userToEventJoined } from './user';
import { club } from './club';

// Event Categories
export const EVENT_CATEGORIES = [
    'bootcamp',
    'workshop',
    'meeting',
    'hackathon',
    'seminar',
    'conference',
    'networking',
] as const;

// Event Statuses
export const EVENT_STATUSES = [
    'upcoming',
    'registration_open',
    'registration_closed',
    'ongoing',
    'completed',
    'cancelled',
] as const;

// Event table definition
export const event = pgTable(
    'event',
    {
        id: serial('id').primaryKey(),
        ...withUuid('event'),
        name: varchar('name', { length: 100 }).notNull(),
        description: varchar('description', { length: 1000 }).notNull(),
        poster: varchar('poster', { length: 255 }).notNull(),
        location: varchar('location', { length: 255 }).notNull(),
        registrationStart: timestamp('registration_start').notNull(),
        registrationEnd: timestamp('registration_end').notNull(),
        eventStart: timestamp('event_start').notNull(),
        eventEnd: timestamp('event_end').notNull(),
        seatsAvailable: integer('seats_available').notNull(),
        seatsRemaining: integer('seats_remaining').notNull(),
        category: varchar('category', {
            length: 20,
            enum: EVENT_CATEGORIES,
        }).notNull(),
        status: varchar('status', { length: 20, enum: EVENT_STATUSES })
            .notNull()
            .default('upcoming'),
        clubId: serial('club_id')
            .references(() => club.id, { onDelete: 'cascade' })
            .notNull(),
        ...timestamps,
    },
    (table) => ({
        clubIdIdx: index('club_id_idx').on(table.clubId),
    }),
);

// Relations
export const eventRelations = relations(event, ({ many, one }) => ({
    registeredUsers: many(userToEventJoined),
    club: one(club, {
        fields: [event.clubId],
        references: [club.id],
    }),
}));

// Validation schemas
const eventValidation = {
    name: z.string().min(3).max(100),
    description: z.string().max(1000),
    poster: z.string().url().max(255),
    location: z.string().min(3).max(255),
    registrationStart: z.coerce.date(),
    registrationEnd: z.coerce.date(),
    eventStart: z.coerce.date(),
    eventEnd: z.coerce.date(),
    seatsAvailable: z.number().int().min(1).max(10000),
    category: z.enum(EVENT_CATEGORIES),
    status: z.enum(EVENT_STATUSES),
    clubId: z.number().int().positive(),
};

// Base schema without refinements for updates
const baseEventSchema = createInsertSchema(event).extend(eventValidation);

export const insertEventSchema = baseEventSchema
    .refine((data) => data.registrationEnd > data.registrationStart, {
        message: 'Registration end must be after registration start',
    })
    .refine((data) => data.eventEnd > data.eventStart, {
        message: 'Event end must be after event start',
    })
    .refine((data) => data.eventStart > data.registrationEnd, {
        message: 'Event must start after registration ends',
    })
    .transform((data) => ({
        ...data,
        seatsRemaining: data.seatsAvailable, // Initialize seatsRemaining with seatsAvailable
        status: 'upcoming', // Explicitly set status to upcoming
    }));

export const selectEventSchema = createSelectSchema(event);
export const updateEventSchema = baseEventSchema.partial();
