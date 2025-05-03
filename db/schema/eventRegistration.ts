import {
    pgTable,
    serial,
    timestamp,
    uniqueIndex,
    integer,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './user';
import { event } from './event';

// Event registration table
export const userToEventJoined = pgTable(
    'user_event_joined',
    {
        id: serial('id').primaryKey(),
        userId: integer('user_id')
            .references(() => user.id, { onDelete: 'cascade' })
            .notNull(),
        eventId: integer('event_id')
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
