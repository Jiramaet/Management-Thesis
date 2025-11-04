import { connect } from 'mongoose';

export const connectDatabase = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI as string;
        await connect(mongoURI);
        console.log("MongoDB Connected!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit process with failure
    }
};