import mongoose from "mongoose";

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }

}

let cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

export const connectToDatabase = async () => {
    if (cached.conn) return cached.conn;

    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error("MONGODB_URI is not defined in environment variables");
        throw new Error("MONGODB_URI is not defined");
    }

    if (!cached.promise) {
        console.log('Starting new MongoDB connection...');
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    }

    try {
        cached.conn = await cached.promise;
        console.info("Connected to database successfully");
    } catch (error) {
        cached.promise = null;
        if (error instanceof Error) {
            if (error.message.includes("Authentication failed")) {
                console.error("MongoDB Error: Authentication failed. Please check your database password in .env.local");
            } else if (error.message.includes("ETIMEOUT") || error.message.includes("ECONNREFUSED")) {
                console.error("MongoDB Error: Connection timed out. Please check if your IP address is whitelisted in MongoDB Atlas");
            } else {
                console.error("Error connecting to database:", error.message);
            }
        } else {
            console.error("Error connecting to database:", error);
        }
        throw error;
    }
    console.info("Connected to database");
    return cached.conn;
}
