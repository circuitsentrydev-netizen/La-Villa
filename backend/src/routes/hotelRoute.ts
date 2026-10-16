import { Router } from 'express';
import { 
  getAllAccommodations, 
  createAccommodation, 
  addRoomInventory, 
  getDashboardSnapshot 
} from '../controllers/hotelController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Dashboard Analytical Operations (Overview State panels widgets data)
router.get('/snapshot', getDashboardSnapshot);

// Database grid table list data array queries
router.get('/', getAllAccommodations);

// Admin-protected asset management mutation pipelines
// Inside backend/src/routes/hotelRoute.ts

router.post('/hotels', createAccommodation);
router.post('/:accommodationId/rooms', authMiddleware.requireAuth, authMiddleware.requireAdmin, addRoomInventory);

export default router;
