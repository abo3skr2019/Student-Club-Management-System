import {
    pgTable,
    serial,
    varchar,
    integer,
    index,
    customType,
    timestamp,
    boolean,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Custom type for bytea (binary data)
const bytea = customType<{
    data: Buffer;
    dataType: 'bytea';
}>({
    dataType() {
        return 'bytea';
    }
});

// Common timestamp fields
const timestamps = {
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
};

// Image table definition - completely independent with no relations
export const image = pgTable(
    'image',
    {
        id: serial('id').primaryKey(),
        uuid: varchar('uuid', { length: 36 }).notNull().unique(),
        fileName: varchar('file_name', { length: 255 }).notNull(),
        mimeType: varchar('mime_type', { length: 100 }).notNull(),
        size: integer('size').notNull(), // File size in bytes
        data: bytea('data').notNull(), // Binary image data using custom type
        purpose: varchar('purpose', { length: 50 }).notNull().default('general'),
        hash: varchar('hash', { length: 64 }).notNull(), // SHA-256 hash for deduplication
        createdBy: integer('created_by').notNull(), // Just store ID without foreign key
        updatedBy: integer('updated_by').notNull(), // Just store ID without foreign key
        ...timestamps,
    },
    (table) => ({
        hashIdx: index('image_hash_idx').on(table.hash),
        purposeIdx: index('image_purpose_idx').on(table.purpose),
    }),
);

// Validation schemas
const imageValidation = {
    uuid: z.string().uuid(),
    fileName: z.string().max(255),
    mimeType: z.string().max(100),
    size: z.number().int().positive(),
    data: z.instanceof(Buffer),
    purpose: z.string().max(50).default('general'),
    hash: z.string().length(64),
    createdBy: z.number().int().positive(),
    updatedBy: z.number().int().positive(),
    isArchived: z.boolean().default(false),
    archivedAt: z.date().optional(),
};

export const insertImageSchema = createInsertSchema(image).extend(
    imageValidation
);

export const selectImageSchema = createSelectSchema(image);
export const updateImageSchema = insertImageSchema.partial(); 