import jwt from 'jsonwebtoken';
import { ENV } from './env.js';

export const generateToken = (user,res) => {
    const { JWT_SECRET } = ENV;
    if(!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    const token = jwt.sign({ UserId: user._id}, ENV.JWT_SECRET, {
        expiresIn: "7d",
    })
    res.cookie("jwt", token, {
        maxAge: 7*24*60*60*1000, // 7 days
        httpOnly: true,
        secure: ENV.NODE_ENV === "devlopment" ? false : true, // set to true in production
        sameSite: "strict",
    })

    return token;
}