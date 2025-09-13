import jwt from 'jsonwebtoken';

export const generateToken = (user,res) => {
    const token = jwt.sign({ UserId: user._id}, process.env.JWT_SECRET, {
        expiresIn: "7d",
    })
    res.cookie("token", token, {
        maxAge: 7*24*60*60*1000, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "devlopment" ? false : true, // set to true in production
        sameSite: "strict",
    })

    return token;
}