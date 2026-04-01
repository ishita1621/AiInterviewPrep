import React from 'react'
import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { serverUrl } from '../App'
import { Step3report } from '../components/Step3report'

const InterviewReport = () => {
  const {id}=useParams();
  const [report,setReport]=useState(null);

  useEffect(()=>{
    const fetchReport=async()=>{
      try{
        const result=await axios.get(`${serverUrl}/api/interview/getReport/${id}`,{withCredentials:true});
        console.log('Full Report Data:', result.data);
        console.log('Question Wise Score:', result.data.questionWiseScore);
        setReport(result.data);
      }catch(err){
        console.error(err);
      }
    };
    fetchReport();
  },[])
  if(!report){
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-gray-500 text-lg'>Loading Report...</p>
      </div>
    )
  }

  return <Step3report report={report}/>;
}

export default InterviewReport