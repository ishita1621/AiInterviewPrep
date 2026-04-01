import express from "express"
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import { analyzeResume, finishInterview, generateQuestion, getInterviewReport, getMyInterviews, submitAnswer } from "../controllers/interviewController.js";


const interviewRouter=express.Router();

interviewRouter.post("/resume",isAuth,upload.single("resume"),analyzeResume)
interviewRouter.post("/generate",isAuth, generateQuestion)
interviewRouter.post("/submit",isAuth, submitAnswer)
interviewRouter.post("/finish",isAuth,finishInterview)

interviewRouter.get("/getInterview",isAuth,getMyInterviews)
interviewRouter.get("/getReport/:id",getInterviewReport) // Temporarily removed isAuth for testing

export default interviewRouter;