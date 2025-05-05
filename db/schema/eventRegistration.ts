import {
    pgTable,
    serial,
    uniqueIndex,
    integer,
    varchar,
    index,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './user';
import { event } from './event';
import { EVENT_REGISTRATION_STATUSES } from '../../lib/constants';
import { timestamps, withArchive } from './common';

// Event registrations table
export const eventRegistration = pgTable(
    'event_registration',
    {
        id: serial('id').primaryKey(),
        userId: integer('user_id')
            .references(() => user.id, { onDelete: 'cascade' })
            .notNull(),
        eventId: integer('event_id')
            .references(() => event.id, { onDelete: 'cascade' })
            .notNull(),
        status: varchar('status', {
            length: 20,
            enum: EVENT_REGISTRATION_STATUSES,
        })
            .notNull()
            .default('pending'),
        createdBy: integer('created_by')
            .references(() => user.id)
            .notNull(),
        updatedBy: integer('updated_by').references(() => user.id),
        ...withArchive,
        ...timestamps,
    },
    (table) => ({
        userEventIdx: uniqueIndex('user_event_idx').on(
            table.userId,
            table.eventId,
        ),
        statusIdx: index('event_registration_status_idx').on(table.status),
        eventIdx: index('event_registration_event_idx').on(table.eventId),
    }),
);

// Event registration validation
const eventRegistrationValidation = {
    userId: z.number().int().positive(),
    eventId: z.number().int().positive(),
    status: z.enum(EVENT_REGISTRATION_STATUSES).default('pending'),
    createdBy: z.number().int().positive(),
    updatedBy: z.number().int().positive().optional(),
};

export const insertEventRegistrationSchema = createInsertSchema(
    eventRegistration,
).extend(eventRegistrationValidation);
export const selectEventRegistrationSchema =
    createSelectSchema(eventRegistration);
export const updateEventRegistrationSchema =
    insertEventRegistrationSchema.partial();
