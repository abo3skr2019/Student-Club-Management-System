import express, { Router } from 'express';
// @ts-ignore
import { isAuthenticated } from '../middleware/CheckAuth';
import { getProfile, deleteAccount } from '../controllers/profileController';

const router: Router = express.Router();

// RESTful profile endpoints
router.get('/profile', isAuthenticated, getProfile);
router.delete('/profile', isAuthenticated, deleteAccount);

export = router;
