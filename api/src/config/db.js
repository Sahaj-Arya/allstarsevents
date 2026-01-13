import mongoose from "mongoose";

export async function connectDb(mongoUri) {
  if (!mongoUri) throw new Error("MONGO_URI missing");
  const dbName = process.env.DB_NAME;
  try {
    await mongoose.connect(mongoUri, dbName ? { dbName } : undefined);
    console.log(`Mongo connected${dbName ? ` (${dbName})` : ""}`);
  } catch (err) {
    console.error("Mongo connection error", err.message);
    process.exit(1);
  }
}
