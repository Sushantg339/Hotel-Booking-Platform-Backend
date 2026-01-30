import type { RequestHandler } from "express";
import z from "zod";
import { prisma } from "../lib/prisma.js";
import { nanoid } from "nanoid";

export const postReviewController: RequestHandler = async (req , res)=>{
    try {
        const userId = req.userId

        const user = await prisma.user.findUnique({where : {id: String(userId)}})

        if(!user){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "UNAUTHORIZED"
            })
        }

        const requiredBody = z.object({
            "bookingId": z.string(),
            "rating": z.number().int().positive().min(1).max(5),
            "comment": z.string()
        })

        const parsed = requiredBody.safeParse(req.body)

        if(!parsed.success){
            return res.status(400).json({
                "success": false,
                "data": null,
                "error": "INVALID_REQUEST"
            })
        }

        const {bookingId, rating, comment} = parsed.data

        const booking = await prisma.booking.findUnique({
            where : {id: String(bookingId)},
        })

        if(!booking){
            return res.status(404).json({
                "success": false,
                "data": null,
                "error": "BOOKING_NOT_FOUND"
            })
        }

        if(booking.userId !== userId){
            return res.status(403).json({
                "success": false,
                "data": null,
                "error": "FORBIDDEN"
            })
        }

        const currentDate = new Date()

        if(booking.status === 'cancelled' || currentDate < booking.checkOutDate){
            return res.status(400).json({
                "success": false,
                "data": null,
                "error": "BOOKING_NOT_ELIGIBLE"
            })
        }

        const isReviewed = await prisma.review.findFirst({
            where : {bookingId: String(bookingId)}
        })

        if(isReviewed){
            return res.status(400).json({
                "success": false,
                "data": null,
                "error": "ALREADY_REVIEWED"
            })
        }

        const hotel = await prisma.hotel.findUnique({
            where : {id: booking.hotelId},
            select : {
                rating: true,
                totalReviews: true
            }
        })

        if(!hotel){
            return res.status(404).json({
                "success": false,
                "data": null,
                "error": "HOTEL_NOT_FOUND"
            })
        }
        let oldRating = hotel?.rating || 0
        let totalReviews = hotel?.totalReviews || 0

        let updatedRating = ((oldRating * totalReviews) + rating) / (totalReviews + 1)
        const finalRating = Math.round(updatedRating * 10) / 10;
        await prisma.hotel.update({
            where : {id: booking.hotelId},
            data : {
                rating: finalRating,
                totalReviews : {
                    increment: 1
                }
            }
        })

        const review = await prisma.review.create({
            data : {
                id: `review_${nanoid()}`,
                userId: booking.userId,
                hotelId: booking.hotelId,
                bookingId,
                rating,
                comment,
            }
        })

        return res.status(201).json({
            "success": true,
            "data": {
                "id": review.id,
                "userId": review.userId,
                "hotelId": review.hotelId,
                "bookingId": review.bookingId,
                "rating": review.rating,
                "comment": review.comment,
                "createdAt": review.createdAt
            },
            "error": null
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            data: null,
            error: "INTERNAL_SERVER_ERROR",
        });
    }
}