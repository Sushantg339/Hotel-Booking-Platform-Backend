import type { RequestHandler } from "express";
import z from "zod";
import { prisma } from "../lib/prisma.js";
import { nanoid } from "nanoid";

export const bookRoomController: RequestHandler = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await prisma.user.findUnique({
            where: {
                id: String(userId),
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                data: null,
                error: "UNAUTHORIZED",
            });
        }

        const requiredBody = z.object({
            roomId: z.string(),
            checkInDate: z.string().transform((v) => new Date(v)),
            checkOutDate: z.string().transform((v) => new Date(v)),
            guests: z.number().int().positive(),
        });

        const parsed = requiredBody.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "INVALID_REQUEST",
            });
        }

        const { roomId, checkInDate, checkOutDate, guests } = parsed.data;

        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "INVALID_DATE",
            });
        }

        let currentDate = new Date();

        checkInDate.setHours(0, 0, 0, 0);
        checkOutDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        if (checkInDate >= checkOutDate || checkInDate < currentDate) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "INVALID_DATES",
            });
        }

        const room = await prisma.room.findUnique({
            where: { id: String(roomId) },
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "ROOM_NOT_FOUND",
            });
        }

        const hotel = await prisma.hotel.findUnique({
            where: { id: String(room.hotelId) },
        });

        if (user.role === "owner" && user.id === hotel?.ownerId) {
            return res.status(403).json({
                success: false,
                data: null,
                error: "FORBIDDEN",
            });
        }

        if (guests > room.maxOccupancy) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "INVALID_CAPACITY",
            });
        }

        const isBooking = await prisma.booking.findFirst({
            where: {
                roomId: roomId,
                status: "confirmed",
                AND: [
                {
                    checkInDate: {
                    lt: checkOutDate,
                    },
                },
                {
                    checkOutDate: {
                    gt: checkInDate,
                    },
                },
                ],
            },
        });

        if (isBooking) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "ROOM_NOT_AVAILABLE",
            });
        }

        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const pricePerNight = Number(room.pricePerNight) || 0;
        const totalPrice = nights * pricePerNight;

        const booking = await prisma.booking.create({
            data: {
                id: `booking_${nanoid()}`,
                roomId,
                userId: String(userId),
                hotelId: room.hotelId,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                guests: guests,
                totalPrice: totalPrice,
            },
        });

        return res.status(200).json({
            success: true,
            data: {
                id: booking.id,
                userId: booking.userId,
                roomId: booking.roomId,
                hotelId: booking.hotelId,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                guests: booking.guests,
                totalPrice: booking.totalPrice,
                status: booking.status,
                bookingDate: booking.bookingDate,
            },
            error: null,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            data: null,
            error: "INTERNAL_SERVER_ERROR",
        });
    }
};
