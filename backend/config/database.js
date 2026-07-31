import mongoose from "mongoose";
import logger from "../utils/logger.js";

/**
 * Establishes connection to MongoDB.
 */
export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error("MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    mongoose.connection.on("connecting", () => {
      logger.info("Connecting to MongoDB...");
    });

    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connection established successfully.");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error: %O", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB connection disconnected.");
    });

    await mongoose.connect(uri);
  } catch (error) {
    logger.error("Failed to connect to MongoDB during startup: %O", error);
    process.exit(1);
  }
}

export default connectDatabase;
