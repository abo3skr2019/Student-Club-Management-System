const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const { isAuthenticated } = require('../middleware/CheckAuth');
const { parseQueryParams } = require('../middleware/QueryParser');
const { authorize } = require('../middleware/authorize');
const validateBody = require('../middleware/validateBody');
const { GlobalRole, ClubRole } = require('../dist/lib/constants');
const asyncHandler = require('../utils/asyncHandler');
const {
    insertClubSchema,
    updateClubSchema,
} = require('../dist/db/schema/club');
const {
    insertClubMembershipSchema,
    updateClubMembershipSchema,
    createMembershipSchema,
} = require('../dist/db/schema/clubMembership');

// ============= CLUB ROUTES =============

// Get all clubs (public)
router.get('/', parseQueryParams, asyncHandler(clubController.getAllClubs));

// Get club by UUID (public)
router.get(
    '/:clubUuid',
    parseQueryParams,
    asyncHandler(clubController.getClubByUuid),
);

// Create club (INMA_ADMIN only)
router.post(
    '/',
    isAuthenticated,
    authorize([GlobalRole.INMA_ADMIN], []),
    validateBody(insertClubSchema),
    asyncHandler(clubController.createClub),
);

// Update club (INMA_ADMIN or clubAdmin)
router.put(
    '/:clubUuid',
    isAuthenticated,
    authorize([GlobalRole.INMA_ADMIN], [ClubRole.CLUB_ADMIN]),
    validateBody(updateClubSchema),
    asyncHandler(clubController.updateClub),
);

// Delete club (INMA_ADMIN only)
router.delete(
    '/:clubUuid',
    isAuthenticated,
    authorize([GlobalRole.INMA_ADMIN], []),
    asyncHandler(clubController.deleteClub),
);

// Reset club term - archives inactive/denied memberships and ALL tasks (INMA_ADMIN or clubAdmin)
router.put(
    '/:clubUuid/term-reset',
    isAuthenticated,
    authorize([GlobalRole.INMA_ADMIN], [ClubRole.CLUB_ADMIN]),
    asyncHandler(clubController.resetClubTerm),
);

// ============= MEMBERSHIP ROUTES =============

// Get all memberships for a club (INMA_ADMIN, UNI_ADMIN, SUPERVISOR or club admin/HR only)
router.get(
    '/:clubUuid/memberships',
    isAuthenticated,
    authorize(
        [GlobalRole.INMA_ADMIN, GlobalRole.UNI_ADMIN, GlobalRole.SUPERVISOR],
        [ClubRole.CLUB_ADMIN, ClubRole.HR],
    ),
    parseQueryParams,
    asyncHandler(clubController.getAllMemberships),
);

// Get specific membership (INMA_ADMIN, UNI_ADMIN, SUPERVISOR or club admin/HR only)
router.get(
    '/:clubUuid/memberships/:membershipUuid',
    isAuthenticated,
    authorize(
        [GlobalRole.INMA_ADMIN, GlobalRole.UNI_ADMIN, GlobalRole.SUPERVISOR],
        [ClubRole.CLUB_ADMIN, ClubRole.HR],
    ),
    parseQueryParams,
    asyncHandler(clubController.getMembershipByUuid),
);

// Create membership - admin initiated (INMA_ADMIN, clubAdmin or HR)
router.post(
    '/:clubUuid/memberships',
    isAuthenticated,
    authorize([GlobalRole.INMA_ADMIN], [ClubRole.CLUB_ADMIN, ClubRole.HR]),
    validateBody(createMembershipSchema),
    asyncHandler(clubController.createMembership),
);

// Update membership (INMA_ADMIN, clubAdmin or HR)
router.put(
    '/:clubUuid/memberships/:membershipUuid',
    isAuthenticated,
    authorize([GlobalRole.INMA_ADMIN], [ClubRole.CLUB_ADMIN, ClubRole.HR]),
    validateBody(updateClubMembershipSchema),
    asyncHandler(clubController.updateMembership),
);

// Join club - user initiated (only regular users)
router.post(
    '/:clubUuid/memberships/me',
    isAuthenticated,
    authorize([GlobalRole.USER], []),
    asyncHandler(clubController.joinClub),
);

// Leave club - user initiated (must be a member of the club)
router.delete(
    '/:clubUuid/memberships/me',
    isAuthenticated,
    authorize([], [ClubRole.CLUB_ADMIN, ClubRole.HR, ClubRole.MEMBER]),
    asyncHandler(clubController.leaveClub),
);

// Delete membership - admin initiated (INMA_ADMIN, clubAdmin or HR)
router.delete(
    '/:clubUuid/memberships/:membershipUuid',
    isAuthenticated,
    authorize([GlobalRole.INMA_ADMIN], [ClubRole.CLUB_ADMIN, ClubRole.HR]),
    asyncHandler(clubController.deleteMembership),
);

module.exports = router;
