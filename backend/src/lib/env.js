import "dotenv/config";

export const ENV = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    CLIENT_URL: process.env.CLIENT_URL,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    CLOUDINARRY_CLOUD_NAME: process.env.CLOUDINARRY_CLOUD_NAME,
    CLOUDINARRY_API_KEY: process.env.CLOUDINARRY_API_KEY,
    CLOUDINARRY_API_SECRET: process.env.CLOUDINARRY_API_SECRET,
}