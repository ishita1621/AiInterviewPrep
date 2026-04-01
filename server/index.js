import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/connectDb.js';
dotenv.config();
import cors from "cors";
import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoute.js';
import userRouter from './routes/userRoute.js';
import interviewRouter from './routes/interviewRoute.js';
import paymentRouter from './routes/paymentRoute.js';

const app=express();

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)
app.use("/api/interview",interviewRouter)
app.use("/api/payment",paymentRouter)


const PORT=process.env.PORT || 6000;

app.listen(PORT,()=>{
    console.log(`Example app listening on port ${PORT}`);
    connectDb();
}); 