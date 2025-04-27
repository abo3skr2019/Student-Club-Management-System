import { timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const timestamps = {
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
};

export const withUuid = (tableName: string) => ({
    uuid: uuid('uuid')
        .notNull()
        .unique(`drizzle_${tableName}_uuid_unique`)
        .defaultRandom(),
});

export const withArchive = {
    isArchived: boolean('is_archived').notNull().default(false),
    archivedAt: timestamp('archived_at'),
};
