import express, { Router } from 'express';
// @ts-ignore
import { isAuthenticated } from '../middleware/CheckAuth';
import { getProfile, createProfile, deleteAccount } from '../controllers/profileController';

const router: Router = express.Router();

// RESTful profile endpoints
router.get('/profile', isAuthenticated, getProfile);
// Create new user account (registration)
router.post('/profile', createProfile);
router.delete('/profile', isAuthenticated, deleteAccount);

export = router;
