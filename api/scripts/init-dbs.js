import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const { MONGO_URI } = process.env;

const DB_NAMES = ["allstarsdev", "allstarsprod"];
const COLLECTIONS = ["users", "bookings", "otprequests"];

if (!MONGO_URI) {
  console.error("MONGO_URI is required in env");
  process.exit(1);
}

async function ensureCollections(conn) {
  const existing = await conn.db.listCollections().toArray();
  const existingNames = new Set(existing.map((c) => c.name));

  for (const name of COLLECTIONS) {
    if (existingNames.has(name)) {
      console.log(`✔︎ ${conn.name}.${name} already exists`);
      continue;
    }
    await conn.createCollection(name);
    console.log(`➕ created ${conn.name}.${name}`);
  }
}

async function main() {
  for (const dbName of DB_NAMES) {
    const conn = mongoose.createConnection(MONGO_URI, { dbName });
    await conn.asPromise();
    console.log(`Connected to ${dbName}`);
    await ensureCollections(conn);
    await conn.close();
    console.log(`Closed ${dbName}\n`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Init failed", err);
  process.exit(1);
});
