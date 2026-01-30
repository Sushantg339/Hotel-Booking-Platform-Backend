import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { bookRoomController } from '../controllers/bookings.controller.js'

const router = express.Router()

router.post('/', authMiddleware, bookRoomController)


export default router