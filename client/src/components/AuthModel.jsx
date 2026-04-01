import React from 'react'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {FaTimes} from "react-icons/fa"
import { Auth } from '../pages/Auth'

const AuthModel = ({onClose}) => {
    const {userData}=useSelector((state)=>state.user)
    useEffect(()=>{
       if(userData){
        onClose()
       }  
    },[userData,onClose])
  return (
    <div className='fixed inset-0 z-[999] flex items-center justify-center bg-black/10 backdrop-blur-sm px-4'>
        <div className='relative w-full max-w-md'>
            <button onClick={onClose} className='absolute top-5 right-5 w-8 h-8 flex items-center justify-center 
  rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-black 
  transition duration-200'>
                <FaTimes size={18}/>
            </button>
            <Auth isModel={true}/>
        </div>
    </div>
  )
}

export default AuthModel