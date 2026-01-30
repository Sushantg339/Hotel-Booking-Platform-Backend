import type { RequestHandler } from "express";
import z from 'zod'
import bcrypt from 'bcrypt'
import jwt, { type JwtPayload } from 'jsonwebtoken'

import { prisma } from "../lib/prisma.js";
import { nanoid } from "nanoid";


export const signupController: RequestHandler = async(req , res)=>{
    try {
        const requiredBody = z.object({
            name : z.string(),
            email : z.string(),
            password : z.string(),
            role : z.enum(['customer', 'owner']).optional().default('customer'),
            phone : z.string()
        })

        const parsed = requiredBody.safeParse(req.body)

        if(!parsed.success){
            return res.status(400).json({
                "success": false,
                "data": null,
                "error": "INVALID_REQUEST"
            })
        }

        const {name, email, password, role, phone} = parsed.data

        const isUser = await prisma.user.findUnique({
            where : {email}
        })

        if(isUser){
            return res.status(400).json({
                "success": false,
                "data": null,
                "error": "EMAIL_ALREADY_EXISTS"
            })
        }

        const id = `usr_${nanoid()}`

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data : {
                id ,
                name,
                email,
                phone,
                role,
                password: hashedPassword
            }
        })

        return res.status(201).json({
            "success": true,
            "data": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "phone": user.phone
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


export const loginController: RequestHandler = async(req, res)=>{
    try {
        const requiredBody = z.object({
            email : z.string(),
            password : z.string()
        })

        const parsed = requiredBody.safeParse(req.body)

        if(!parsed.success){
            return res.status(400).json({
                "success": false,
                "data": null,
                "error": "INVALID_REQUEST"
            })
        }

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
            where : {email}
        })

        if(!user){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "INVALID_CREDENTIALS"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if(!isPasswordValid){
            return res.status(401).json({
                "success": false,
                "data": null,
                "error": "INVALID_CREDENTIALS"
            })
        }

        const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET as string)

        return res.status(200).json({
            "success": true,
            "data": {
                "token": token,
                "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
                }
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