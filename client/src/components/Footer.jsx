import React from 'react'
import { RiRobot2Line } from "react-icons/ri";

const Footer = () => {
  return (
    <div className='bg-[#f3f3f3] flex justify-center px-4 py-10'>
      <div className='w-full max-w-6xl bg-white rounded-2xl shadow-md border border-gray-200 py-10 px-6 text-center transition'>
        
        {/* Logo */}
        <div className='flex justify-center items-center gap-3 mb-3'>
          <div className='bg-black text-white p-2 rounded-lg'>
            <RiRobot2Line size={16} />
          </div>
          <h2 className='font-semibold text-lg'>InterviewPrep</h2>
        </div>

        {/* Description */}
        <p className='text-gray-500 text-sm max-w-xl mx-auto'>
          Practice smarter, perform better, and achieve your career goals with AI-powered interview preparation.
        </p>

        {/* Links */}
        <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
          <span className="hover:text-black cursor-pointer">About</span>
          <span className="hover:text-black cursor-pointer">Contact</span>
          <span className="hover:text-black cursor-pointer">Privacy</span>
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-400 mt-6">
          © 2026 InterviewPrep. All rights reserved.
        </p>

      </div>
    </div>
  )
}

export default Footer;