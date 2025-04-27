import { pgTable, serial, varchar, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { timestamps, withUuid, withArchive } from './common';

// Supervisor table definition
export const supervisor = pgTable(
    'supervisor',
    {
        id: serial('id').primaryKey(),
        ...withUuid('supervisor'),
        name: varchar('name', { length: 100 }).notNull(),
        phoneNumber: varchar('phone_number', { length: 10 }).notNull(),
        ...withArchive,
        ...timestamps,
    },
    (table) => ({
        nameIdx: index('supervisor_name_idx').on(table.name),
        isArchivedIdx: index('supervisor_is_archived_idx').on(table.isArchived),
    }),
);

// Validation schemas
const supervisorValidation = {
    name: z.string().min(3).max(100),
    phoneNumber: z
        .string()
        .length(10)
        .regex(/^\d+$/, 'Phone number must contain only digits'),
};

export const insertSupervisorSchema =
    createInsertSchema(supervisor).extend(supervisorValidation);
export const selectSupervisorSchema = createSelectSchema(supervisor);
export const updateSupervisorSchema = insertSupervisorSchema.partial();
