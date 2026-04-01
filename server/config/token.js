import jwt from 'jsonwebtoken';

//generating token for user
const genToken=async(userId)=>{
    try{
        const token=jwt.sign({userId},process.env.JWT_SECRET,{expiresIn:'7d'})
        return token;
    }
    catch(err){
        console.error(err);
    }

}
export default genToken;