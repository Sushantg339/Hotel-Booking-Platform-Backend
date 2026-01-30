import type { RequestHandler } from "express";
import z from 'zod'
import { prisma } from "../lib/prisma.js";
import { nanoid, random } from "nanoid";

export const createHotelController: RequestHandler = async(req , res, next)=>{
    try {
        const userId = req.userId

        if(!userId){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "UNAUTHORIZED"
            })
        }

        const user = await prisma.user.findUnique({
            where : {id: String(userId)}
        })

        if(user?.role !== 'owner'){
            return res.status(403).json({
                "success": false,
                "data": null,
                "error": "FORBIDDEN"
            })
        }

        const requiredBody = z.object({
            "name": z.string(),
            "description": z.string().optional(),
            "city": z.string(),
            "country": z.string(),
            "amenities": z.array(z.string())
        })

        const parsed = requiredBody.safeParse(req.body)

        if(!parsed.success){
            return res.status(400).json({
                "success": false,
                "data": null,
                "error": "INVALID_REQUEST"
            })
        }

        const {name, description, city, country, amenities} = parsed.data

        const hotel = await prisma.hotel.create({
            data : {
                id: `hotel_${nanoid()}`,
                name,
                ownerId: String(userId),
                description: description ?? null,
                city,
                country,
                amenities
            }
        })

        return res.status(201).json({
            "success": true,
            "data": {
                "id": hotel.id,
                "ownerId": hotel.ownerId,
                "name": hotel.name,
                "description": hotel.description,
                "city": hotel.city,
                "country": hotel.country,
                "amenities": hotel.amenities,
                "rating": hotel.rating,
                "totalReviews": hotel.totalReviews
            },
            "error": null
        })
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "data": null,
            "error": "INTERNAL_SERVER_ERROR"
        })
    }
}


export const addRoomController: RequestHandler = async(req , res)=>{
    try {
        const userId = req.userId
        const hotelId = req.params.hotelId

        const hotel = await prisma.hotel.findUnique({
            where : {id: String(hotelId)}
        })

        if(!hotel){
            return res.status(404).json({
                "success": false,
                "data": null,
                "error": "HOTEL_NOT_FOUND"
            })
        }

        if(!userId){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "UNAUTHORIZED"
            })
        }

        const user = await prisma.user.findUnique({
            where : {id: String(userId)}
        })

        if(!user){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "UNAUTHORIZED"
            })
        }

        if(user.role !== 'owner' && hotel.ownerId !== user.id){
            return res.status(403).json({
                "success": false,
                "data": null,
                "error": "FORBIDDEN"
            })
        }

        const requiredBody = z.object({
            "roomNumber": z.string(),
            "roomType": z.string(),
            "pricePerNight": z.number(),
            "maxOccupancy": z.number()
        })

        const parsed = requiredBody.safeParse(req.body)

        if(!parsed.success){
            return res.status(400).json({
                "success": false,
                "data": null,
                "error": "INVALID_REQUEST"
            })
        }

        const {roomNumber, roomType, pricePerNight, maxOccupancy} = parsed.data

        const isRoom = await prisma.room.findFirst({
            where : {
                roomNumber: roomNumber,
                hotelId: hotel.id,
            }
        })

        if(isRoom){
            return res.status(400).json({
                "success": false,
                "data": null,
                "error": "ROOM_ALREADY_EXISTS"
            })
        }

        const room = await prisma.room.create({
            data : {
                id: `room_${nanoid()}`,
                hotelId: hotel.id,
                roomNumber,
                roomType,
                pricePerNight,
                maxOccupancy
            }
        })

        return res.status(201).json({
            "success": true,
            "data": {
                "id": room.id,
                "hotelId": room.hotelId,
                "roomNumber": room.roomNumber,
                "roomType": room.roomType,
                "pricePerNight": room.pricePerNight,
                "maxOccupancy": room.maxOccupancy,
            },
            "error": null
        })
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "data": null,
            "error": "INTERNAL_SERVER_ERROR"
        })
    }
}


export const getHotelsController: RequestHandler = async(req , res)=>{
    try {
        const {city, country, minPrice, maxPrice, minRating} = req.query
        const userId = req.userId

        const  user = await prisma.user.findUnique({
            where : {id: String(userId)}
        })

        if(!user){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "UNAUTHORIZED"
           })
        }


        const hotels = await prisma.hotel.findMany({
            where : {
                ...(city && {city : city as string}),
                ...(country && {country: country as string}),
                ...(minPrice && {rating: {gte: Number(minRating)}})
            },
            select : {
                id: true,
                name: true,
                description: true,
                city: true,
                country: true,
                amenities: true,
                rating: true,
                totalReviews: true,
                rooms : {
                    where : {
                    ...(minPrice && {pricePerNight : {gte: Number(minPrice)}}),
                    ...(maxPrice && {pricePerNight : {lte: Number(maxPrice)}})
                    },
                    select : {
                        pricePerNight: true,
                    }
                }
            }
        })

        const formattedHotels = hotels.map((hotel) => {
            const prices = hotel.rooms.map(r => r.pricePerNight as unknown as number);

            return {
                id: hotel.id,
                name: hotel.name,
                description: hotel.description,
                city: hotel.city,
                country: hotel.country,
                amenities: hotel.amenities,
                rating: hotel.rating,
                totalReviews: hotel.totalReviews,
                minPricePerNight: prices.length ? Math.min(...prices) : null,
            };
        });


        return res.status(200).json({
            "success": true,
            "data": formattedHotels,
            "error": null
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            "success": false,
            "data": null,
            "error": "INTERNAL_SERVER_ERROR"
        })
    }
}