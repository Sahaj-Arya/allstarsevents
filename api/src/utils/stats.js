import { Stats } from "../models/Stats.js";

export async function incrementOtpSent() {
  await Stats.findOneAndUpdate(
    {},
    { $inc: { otpSent: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
