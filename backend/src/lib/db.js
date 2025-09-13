import mongoose from 'mongoose';

export const connectDB = async (mongoURI) => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB connected:", conn.connection.host);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1); // Exit process with failure
    }
}