import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async (mongoURI) => {
    try {
        const { MONGO_URI } = ENV
        if (!MONGO_URI) throw new Error("MONGO_URI is not set");
        const conn = await mongoose.connect(ENV.MONGO_URI)
        console.log("MongoDB connected:", conn.connection.host);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit process with failure
    }
}