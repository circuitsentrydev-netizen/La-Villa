import { Router } from 'express';
import { getAllAccommodations, createAccommodation } from '../controllers/hotelController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Public route: Stays feed downloads freely to display in the frontend cards grid layout

router.get('/', getAllAccommodations);

// Admin route: Restricts entry strictly to logged-in administrators matching 'ADMIN'
router.post('/', authMiddleware.requireAuth, authMiddleware.requireAdmin, createAccommodation);

export default router;
