import Payment from "../models/paymentModel.js";
import razorpay from "../services/razorpay.service.js"
import crypto from "crypto"
import User from "../models/user.js";

export const createOrder=async(req,res)=>{
     try{
          const {planId,amount,credits}=req.body;  
          if(!amount || !credits){
            return res.status(400).json({message:"Invalid plan data"});
          }

          const options={
            amount:amount*100,
            currency:"INR",
            receipt:`receipt_${Date.now()}`,
          };

          const order=await razorpay.orders.create(options);

          await Payment.create({
            userId:req.userId,
            planId,
            amount,
            credits,
            razorpayOrderId:order.id,
            status:"created",
          });
          return res.json(order);
     }catch(err){
            return res.status(500).json({message:`failed to create razorpayOrder ${err}`})
     }
}

export const verifyPayment=async(req,res)=>{
    try{
        const {razorpayOrderId,razorpayPaymentId,razorpaySignature}=req.body;
        const body=razorpayOrderId + "|" + razorpayPaymentId;

        const expectedSignature=crypto
         .createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
         .update(body)
         .digest("hex");

         if(expectedSignature!==razorpaySignature){
            return res.status(400).json({message:"Invalid payment signature"});
         }
         const payment=await Payment.findOne({
            razorpayOrderId:razorpayOrderId,
         });
         if(!payment){
            return res.status(404).json({message:"Payment not found"});
         }
         if(payment.status==="paid"){
            return res.json({message:"Already processed"});
         }
         payment.status="paid";
         payment.razorpayPaymentId=razorpayPaymentId;
         await payment.save();

         const updateUser=await User.findByIdAndUpdate(payment.userId,{
            $inc:{credits:payment.credits}
         },{new:true});

         res.json({
            success:true,
            message:"Payment verified and credits added",
            user:updateUser,
         });

    }catch(err){
            return res.status(500).json({message:`failed to verify Razorpay payment ${err}`})
    }
}