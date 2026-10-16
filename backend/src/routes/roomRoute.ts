import { Router } from 'express';
import { createRoom, getRoomsFeed } from '../controllers/roomController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Fetches the sub-inventories grid array profiles for a listing
router.get('/:accommodationId', getRoomsFeed);

// Protects sub-resource inventory creation using admin guards
router.post('/:accommodationId', authMiddleware.requireAuth, authMiddleware.requireAdmin, createRoom);

export default router;
