import React from 'react'
import {buildStyles,CircularProgressbar} from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css" 
const Timer = ({timeLeft,totalTime}) => {
  const total = totalTime && totalTime > 0 ? totalTime : 60;
  const percentage = Math.min(100, Math.max(0, (timeLeft / total) * 100));
  return (
    <div className='w-20 h-20'>
        <CircularProgressbar 
        value={percentage}
        text={`${timeLeft}s`}
        styles={buildStyles({
            textSize:"28px",
            pathColor:"#2e61e0",
            textColor:"#ef4444",
            trailColor:"#e5e7eb"
        })}
        />
    </div>
  )
}

export default Timer
