// Global roles
export const GlobalRole = {
    INMA_ADMIN: 'inmaAdmin',
    UNI_ADMIN: 'uniAdmin',
    SUPERVISOR: 'supervisor',
    USER: 'user',
} as const;

// Club roles
export const ClubRole = {
    CLUB_ADMIN: 'clubAdmin',
    HR: 'hr',
    MEMBER: 'member',
} as const;

// Membership statuses
export const MembershipStatus = {
    ACTIVE: 'active', // approved / active membership
    INACTIVE: 'inactive', // withdrawn
    PENDING: 'pending', // pending approval
    DENIED: 'denied', // denied approval
} as const;

// Club types
export const ClubType = {
    GENERAL: 'general', // عام
    SPECIALIZED: 'specialized', // تخصصي
} as const;

// Club statuses
export const ClubStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

// Event categories
export const EVENT_CATEGORIES = [
    'bootcamp',
    'workshop',
    'meeting',
    'hackathon',
    'seminar',
    'conference',
    'networking',
] as const;

// Event statuses
export const EVENT_STATUSES = [
    'upcoming',
    'ongoing',
    'registration_open',
    'completed',
    'cancelled',
] as const;

// Event Registration statuses
export const EVENT_REGISTRATION_STATUSES = [
    'pending',
    'accepted',
    'rejected',
] as const;

// Task statuses
export const TaskStatus = {
    ACCEPTED: 'accepted',
    PENDING: 'pending',
    CHANGES_REQUESTED: 'changes_requested',
    DENIED: 'denied',
} as const;

// Task categories
export const TaskCategories = {
    CLUB_PROGRAMS_PROJECTS: 'club_programs_projects',
    UNI_COLLAB: 'uni_collab',
    EXTERNAL_COLLAB: 'external_collab',
    CLUB_INITIATIVES: 'club_initiatives',
    INTERNAL_ACTIVITIES: 'internal_activities',
    COMMUNITY_CONTRIBUTIONS: 'community_contributions',
} as const;

// Ticket statuses
export const TICKET_STATUSES = ['open', 'closed', 'in-progress'] as const;

// Ticket priorities
export const TICKET_PRIORITIES = ['low', 'medium', 'high'] as const;

// Ticket categories
export const TICKET_CATEGORIES = ['bug', 'feature', 'task'] as const;
