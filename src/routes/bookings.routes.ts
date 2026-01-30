import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { bookRoomController, getMyBookingController } from '../controllers/bookings.controller.js'

const router = express.Router()

router.post('/', authMiddleware, bookRoomController)
router.get('/', authMiddleware, getMyBookingController)

export default router