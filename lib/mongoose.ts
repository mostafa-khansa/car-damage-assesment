
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DB = mongoose;

const uri = process.env.MONGODB_URI ?? '';

if (!uri) {
    throw new Error(
        "Missing MONGODB_URI environment variable. Add it to your .env "
    );
}

DB.set("strictQuery", false);

let isConnected = false;

export async function connectToDatabase(): Promise<void> {
    if (isConnected) {
        console.log("Using existing MongoDB connection");
        return;
    }

    try {
        await DB.connect(uri);
        isConnected = true;
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err);
        throw err;
    }
}
//
export default DB;