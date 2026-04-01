import jwt from "jsonwebtoken";
const isAuth=async(req,res,next)=>{
        try{
            let {token}=req.cookies;
            if(!token){
                return res.status(401).json({message:"Unauthorized"});
            }
            const verifyToken=jwt.verify(token,process.env.JWT_SECRET);
            if(!verifyToken){
                return res.status(401).json({message:"Unauthorized"});
            }
            req.userId=verifyToken.userId;
            next();
        }catch(err){
            return res.status(500).json({message:"Server Error"});
        }
}

export default isAuth;