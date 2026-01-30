import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'
import { postReviewController } from '../controllers/reviews.controller.js'

const router = express.Router()

router.post('/', authMiddleware, postReviewController)

export default router