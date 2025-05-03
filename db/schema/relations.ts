import { relations } from 'drizzle-orm';
import { user } from './user';
import { club } from './club';
import { clubMembership } from './clubMembership';
import { event } from './event';
import { userToEventJoined } from './eventRegistration';
import { task } from './task';
import { ticket } from './ticket';

// User relations
export const userRelations = relations(user, ({ many }) => ({
    clubMemberships: many(clubMembership, { relationName: 'membershipUser' }),
    eventsJoined: many(userToEventJoined, { relationName: 'eventJoinUser' }),
    clubsSupervised: many(club, { relationName: 'supervisor' }),
    createdTasks: many(task, { relationName: 'taskCreatedBy' }),
    updatedTasks: many(task, { relationName: 'taskUpdatedBy' }),
    assignedTickets: many(ticket, { relationName: 'ticketAssignedTo' }),
    createdTickets: many(ticket, { relationName: 'ticketCreatedBy' }),
}));

// Club relations
export const clubRelations = relations(club, ({ many, one }) => ({
    memberships: many(clubMembership),
    createdEvents: many(event),
    supervisor: one(user, {
        fields: [club.supervisorId],
        references: [user.id],
        relationName: 'supervisor',
    }),
    createdByUser: one(user, {
        fields: [club.createdBy],
        references: [user.id],
        relationName: 'clubCreatedBy',
    }),
    updatedByUser: one(user, {
        fields: [club.updatedBy],
        references: [user.id],
        relationName: 'clubUpdatedBy',
    }),
}));

// Club membership relations
export const clubMembershipRelations = relations(
    clubMembership,
    ({ one, many }) => ({
        user: one(user, {
            fields: [clubMembership.userId],
            references: [user.id],
            relationName: 'membershipUser',
        }),
        club: one(club, {
            fields: [clubMembership.clubId],
            references: [club.id],
        }),
        tasks: many(task),
    }),
);

// Event relations
export const eventRelations = relations(event, ({ many, one }) => ({
    registeredUsers: many(userToEventJoined),
    club: one(club, {
        fields: [event.clubId],
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
            relationName: 'eventJoinUser',
        }),
        event: one(event, {
            fields: [userToEventJoined.eventId],
            references: [event.id],
        }),
    }),
);

// Task relations
export const taskRelations = relations(task, ({ one }) => ({
    clubMembership: one(clubMembership, {
        fields: [task.clubMembershipId],
        references: [clubMembership.id],
    }),
    createdByUser: one(user, {
        fields: [task.createdBy],
        references: [user.id],
        relationName: 'taskCreatedBy',
    }),
    updatedByUser: one(user, {
        fields: [task.updatedBy],
        references: [user.id],
        relationName: 'taskUpdatedBy',
    }),
}));

// Ticket relations
export const ticketRelations = relations(ticket, ({ one }) => ({
    assignedTo: one(user, {
        fields: [ticket.assignedTo],
        references: [user.id],
        relationName: 'ticketAssignedTo',
    }),
    createdBy: one(user, {
        fields: [ticket.createdBy],
        references: [user.id],
        relationName: 'ticketCreatedBy',
    }),
}));
