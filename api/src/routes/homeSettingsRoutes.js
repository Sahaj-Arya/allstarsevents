import express from "express";
import {
  getHomeSettings,
  updateHomeSettings,
} from "../controllers/homeSettingsController.js";

const router = express.Router();

router.get("/", getHomeSettings);
router.put("/", updateHomeSettings);

export default router;
