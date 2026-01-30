import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from 'jsonwebtoken'
import { prisma } from "../lib/prisma.js";

declare global{
    namespace Express{
        interface Request{
            userId? : String
        }
    }
}

export const authMiddleware: RequestHandler = async(req, res , next)=>{
    try {
        const authorization = req.headers.authorization
        if(!authorization){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "UNAUTHORIZED"
            })
        }

        const token = authorization.split(' ')[1]

        if(!token){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "UNAUTHORIZED"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string)

        if(!decoded){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "UNAUTHORIZED"
            })
        }

        const userId = (decoded as  JwtPayload).userId

        req.userId = userId

        next()
    } catch (error) {
        return res.status(500).json({
            "success": false,
            "data": null,
            "error": "INTERNAL_SERVER_ERROR"
        })
    }
}