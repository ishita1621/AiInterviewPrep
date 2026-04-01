import React from "react";
import { RiRobot2Line } from "react-icons/ri";
import { IoSparkles } from "react-icons/io5";
import {motion} from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../utils/firebase";
import axios from "axios";
import { serverUrl } from "../App";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";

export const Auth = ({isModel=false}) => {
  const dispatch=useDispatch();
  const handleGoogleAuth=async()=>{
    try{
        const response=await signInWithPopup(auth, provider);
        let User=response.user;
        let name=User.displayName;
        let email=User.email;
        const result=await axios.post(serverUrl+"/api/auth/login",{name,email},{withCredentials:true})
        dispatch(setUserData(result.data))
      }catch(err){
        console.error(err);
        dispatch(setUserData(null))
    }
  };

  return (
   <div
    className={`w-full ${
    isModel
      ? "py-4 px-4"
      : "min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20"
    }`}
    >
      <motion.div
       initial={{ opacity: 0, y: 50 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
      className={`w-full ${
        isModel
         ?" max-w-md p-8 rounded-3xl"
         :"max-w-lg p-12 rounded-[32px]"
      } bg-white shadow-2xl border border-gray-200
      `}  
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-black text-white p-2 rounded-lg">
            <RiRobot2Line size={20} />
          </div>
          <h2 className="font-semibold text-xl">InterviewPrep</h2>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-center leading-snug mb-6">
          Continue with
        </h1>
        <div className="flex justify-center mb-6">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition">
            <IoSparkles size={18} />
            AI Smart Interview
          </button>
        </div>
        <p className="text-gray-500 text-center text-sm md:text-base leading-relaxed max-w-md mx-auto">
          Prepare for interviews smarter with InterviewPrep. Practice AI-driven
          mock interviews, improve your communication and boost your
          confidence before the real interview.
        </p>
        <motion.button
        onClick={handleGoogleAuth}
               whileHover={{ opacity:0.9,scale: 1.03 }}
                whileTap={{ opacity:1,scale: 0.97 }}
                className="w-full flex items-center justify-center gap-3 py-3 
             bg-white text-gray-700 font-medium 
             border border-gray-300 rounded-xl 
             shadow-sm hover:shadow-md transition mt-1"
              >
                <FcGoogle size={20} />              
                Continue with Google
              </motion.button>

      </motion.div>
    </div>
  );
}; 