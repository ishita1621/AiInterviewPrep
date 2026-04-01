import express from "express";
import { googleAuth,logout } from "../controllers/authController.js";
const authRouter = express.Router();

authRouter.post("/login", googleAuth)
authRouter.get("/logout", logout)

export default authRouter;