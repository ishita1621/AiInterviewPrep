import express from "express"
import isAuth from "../middlewares/isAuth.js";
import { getCurruser } from "../controllers/userController.js";

const userRouter=express.Router();

userRouter.get("/currUser",isAuth,getCurruser);

export default userRouter;