import express from "express";
import {
  registerUser,
  loginUser,
  updateProfile,
} from "../controllers/controllers.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
const router = express.Router();

// Registro de usuario
router.post("/register", registerUser);

// Login de usuario
router.post("/login", loginUser);

router.put("/profile", updateProfile, verifyToken);


export default router;
