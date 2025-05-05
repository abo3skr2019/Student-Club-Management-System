import {
    pgTable,
    serial,
    text,
    varchar,
    index,
    integer,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps, withUuid } from './common';
import { user } from './user';
import {
    TICKET_STATUSES,
    TICKET_PRIORITIES,
    TICKET_CATEGORIES,
} from '../../lib/constants';

// Ticket table definition
export const ticket = pgTable(
    'ticket',
    {
        id: serial('id').primaryKey(),
        ...withUuid('ticket'),
        title: varchar('title', { length: 100 }).notNull(),
        description: varchar('description', { length: 1000 }).notNull(),
        status: text('status', { enum: TICKET_STATUSES })
            .notNull()
            .default('open'),
        priority: text('priority', { enum: TICKET_PRIORITIES })
            .notNull()
            .default('low'),
        category: text('category', { enum: TICKET_CATEGORIES })
            .notNull()
            .default('bug'),
        assignedTo: integer('assigned_to').references(() => user.id, {
            onDelete: 'set null',
        }),
        createdBy: integer('created_by').references(() => user.id, {
            onDelete: 'restrict',
        }),
        ...timestamps,
    },
    (table) => ({
        statusIdx: index('status_idx').on(table.status),
        priorityIdx: index('priority_idx').on(table.priority),
    }),
);

// Validation schemas
const ticketValidation = {
    title: z.string().max(100),
    description: z.string().max(1000),
    status: z.enum(TICKET_STATUSES),
    priority: z.enum(TICKET_PRIORITIES),
    category: z.enum(TICKET_CATEGORIES),
    assignedTo: z.number().int().positive().nullable(),
    createdBy: z.number().int().positive().nullable(),
};

export const insertTicketSchema =
    createInsertSchema(ticket).extend(ticketValidation);
export const selectTicketSchema = createSelectSchema(ticket);
export const updateTicketSchema = insertTicketSchema.partial();
