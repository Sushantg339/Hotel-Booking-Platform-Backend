import express from 'express'


import authRoutes from './auth.routes.js'
import hotelRoutes from './hotel.routes.js'
import bookingRoutes from './bookings.routes.js'
import reviewRoutes from './reviews.routes.js'

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/hotels', hotelRoutes)
router.use('/bookings', bookingRoutes)
router.use('/reviews', reviewRoutes)

export default router