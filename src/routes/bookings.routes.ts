import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { bookRoomController, getMyBookingController, cancelBookingController } from '../controllers/bookings.controller.js'

const router = express.Router()

router.post('/', authMiddleware, bookRoomController)
router.get('/', authMiddleware, getMyBookingController)
router.post('/:bookingId/cancel', authMiddleware, cancelBookingController)

export default router