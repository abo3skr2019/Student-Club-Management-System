import { relations } from 'drizzle-orm';
import { club } from './club';
import { supervisor } from './supervisor';
import { clubMembership } from './user';
import { event } from './event';

// Club relations
export const clubRelations = relations(club, ({ many, one }) => ({
    memberships: many(clubMembership),
    createdEvents: many(event),
    supervisor: one(supervisor, {
        fields: [club.supervisorId],
        references: [supervisor.id],
    }),
}));

// Supervisor relations
export const supervisorRelations = relations(supervisor, ({ many }) => ({
    clubs: many(club),
}));
