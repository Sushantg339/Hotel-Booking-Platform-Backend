import express from 'express'
import { addRoomController, createHotelController, getHotelsController } from '../controllers/hotel.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'



const router = express.Router()

router.post('/',authMiddleware, createHotelController)
router.post('/:hotelId/rooms',authMiddleware, addRoomController)
router.get('/',authMiddleware, getHotelsController)



export default router