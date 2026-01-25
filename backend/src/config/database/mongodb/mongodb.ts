import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config()

export const connectDB = async () => {
    return mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log("MongoDB Connected"))
        .catch((error) => console.log(error));
};