import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Report from "./models/Report.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/nawi_db";

async function seed() {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // Seed Admin User
    const adminEmail = "ilmchikhli@gmail.com";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        email: adminEmail,
        username: "System Admin",
        password_hash: "AdminPass123!", // Will be hashed by pre-save hook
        role: "admin",
        department: "Legal Metrology Admin",
        is_active: true,
      });
      await admin.save();
      console.log(`Created Admin account: ${adminEmail} (role: admin)`);
    } else {
      admin.role = "admin";
      await admin.save();
      console.log(`Updated Admin account: ${adminEmail} (role: admin)`);
    }

    // Seed Demo Inspector User
    const engineerEmail = "engineer@nawi.com";
    let engineer = await User.findOne({ email: engineerEmail });
    if (!engineer) {
      engineer = new User({
        email: engineerEmail,
        username: "Dhananjay Muley",
        password_hash: "Engineer123!",
        role: "user",
        department: "Inspection Services",
        is_active: true,
      });
      await engineer.save();
      console.log(`Created Inspector account: ${engineerEmail} (role: user)`);
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
}

seed();
