import React from 'react'
import maleVideo from "../assets/Videos/male-ai.mp4"
import femaleVideo from "../assets/Videos/female-ai.mp4"
import Timer from './Timer';
import { motion } from 'framer-motion';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { useState } from 'react';
import { useRef } from 'react';
import { useEffect } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';

import { BsArrowRight } from 'react-icons/bs';

const Step2Interview = ({ interviewData, onFinish }) => {
  const { interviewId, questions, userName } = interviewData;
  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const recognitionRef = useRef(null);
  const [isAIPlaying, setIsAIPlaying] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60);

  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [subtitle, setSubtitle] = useState("");
  /** True only after the current question has been fully spoken — countdown should not run during intro, delays, or TTS. */
  const [answerWindowActive, setAnswerWindowActive] = useState(false);

  const videoRef = useRef(null);
  const isMicOnRef = useRef(isMicOn);
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    isMicOnRef.current = isMicOn;
  }, [isMicOn]);

  useEffect(() => {
    setAnswerWindowActive(false);
  }, [currentIndex]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const femaleVoice = voices.find(v =>
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("female")
      );

      if (femaleVoice) {
        setSelectedVoice(femaleVoice);
        setVoiceGender("female");
        return;
      }

      const maleVoice = voices.find(v =>
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("mark") ||
        v.name.toLowerCase().includes("male")
      );

      if (maleVoice) {
        setSelectedVoice(maleVoice);
        setVoiceGender("male");
        return;
      }

      setSelectedVoice(voices[0]);
      setVoiceGender("female");
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [])

  const videoSource = voiceGender === "male" ? maleVideo : femaleVideo;

  const startMic = () => {
    if (recognitionRef.current && !isAIPlaying) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Speech recognition error:", err);
      }
    };
  }

  const stopMic = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  //speak function
  const speak = (text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !selectedVoice) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      // add natural pauses
      const humanText = text
        .replace(/,/g, ",...")
        .replace(/\./g, ". ...");

      const utterance = new SpeechSynthesisUtterance(humanText);
      utterance.voice = selectedVoice;

      // human-like speech
      utterance.rate = 0.92;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onstart = () => {
        setIsAIPlaying(true);
        stopMic();

        if (videoRef.current) {
          videoRef.current.play();
        }
      };

      utterance.onend = () => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }

        setIsAIPlaying(false);

        if (isMicOnRef.current) {
          startMic();
        }

        setTimeout(() => {
          setSubtitle("");
          resolve();
        }, 300);
      };


      setSubtitle(text);
      window.speechSynthesis.speak(utterance);

    });
  };

  useEffect(() => {
    if (!selectedVoice) return;
    const runInterview = async () => {
      if (isIntroPhase) {
        await speak(`hello ${userName}, welcome to your AI mock interview. 
        I hope you are feeling confident and ready to practice.`);

        await speak(`I will ask you a few questions. Just answer naturally and
        take your time. Let's begin. `);

        setIsIntroPhase(false);
      } else if (currentQuestion) {
        await new Promise(r => setTimeout(r, 800));

        if (currentIndex === questions.length - 1) {
          await speak("Alright,this one might be a bit tricky, but give it your best shot!");
        }

        await speak(currentQuestion.question);
        setAnswerWindowActive(true);

        if (isMicOnRef.current) {
          startMic();
        }
      };
    }
    runInterview();

  }, [selectedVoice, isIntroPhase, currentIndex])

  useEffect(() => {
    if (isIntroPhase || isAIPlaying || !answerWindowActive || feedback) return;
    if (!currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isIntroPhase, isAIPlaying, answerWindowActive, currentIndex, feedback]);

  useEffect(() => {
    if (!isIntroPhase && questions[currentIndex]) {
      setTimeLeft(questions[currentIndex].timeLimit || 60);
    }
  }, [currentIndex, isIntroPhase]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setAnswer((prev) => prev + " " + transcript);
    };
    recognitionRef.current = recognition;

  }, []);


  const toggleMic = () => {
    if (isMicOn) {
      stopMic();
    } else {
      startMic();
    }
    setIsMicOn(!isMicOn);
  };


  const submitAnswer = async () => {
    if (isSubmitting) return;
    stopMic();
    setIsSubmitting(true);
    try {
      const result = await axios.post(serverUrl + "/api/interview/submit", {
        interviewId,
        questionIndex: currentIndex,
        answer,
        timeTaken: currentQuestion.timeLimit - timeLeft,
      }, { withCredentials: true });
      setFeedback(result.data.feedback);
      speak(result.data.feedback);
      setIsSubmitting(false);

    } catch (err) {
      console.error("Submit answer error:", err);
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    setAnswer("");
    setFeedback("");
    setAnswerWindowActive(false);
    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }
    await speak("Alright, let's move on to the next question.");
    setCurrentIndex(currentIndex + 1);
    setTimeout(() => {
      if (isMicOn) {
        startMic();
      }
    }, 500);
  }

  const finishInterview = async () => {
    stopMic();
    setIsMicOn(false);
    try {
      const result = await axios.post(serverUrl + "/api/interview/finish", { interviewId }, { withCredentials: true });
      console.log(result.data);
      onFinish(result.data);
    } catch (err) {
      console.error("Finish interview error:", err);
    }
  }

  useEffect(() => {
    if (isIntroPhase) return;
    if (!currentQuestion) return;

    if (timeLeft === 0 && !isSubmitting && !feedback) {
      submitAnswer();
    }
  }, [timeLeft]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }
      window.speechSynthesis.cancel();
    };
  }, []);





  return (
    <div className='min-h-screen bg-linear-to-br from emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6'>
      <div className='w-full max-w-350 min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden'>

        {/* video */}
        <div className='w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-6 border-r border-gray-200'>
          <div className='w-full max-w-md rounded-2xl overflow-hidden shadow-xl'>
            <video
              src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload='auto'
              className='w-full h-auto object-corner'
            />
          </div>
          {/* subtitle pending */}
          {subtitle && (
            <div className='w-full max-w-md bg-gray-50 border border-gray-200 
              rounded-xl p-4 shadow-sm'>
              <p className='text-sm text-gray-700 sm:text-base font-medium text-center leading-relaxed'>{subtitle}</p>
            </div>
          )}



          {/* timer area */}
          <div className='w-full max-w-md bg-white border
            border-gray-200 rounded-2xl shadow-md p-6 space-y-5'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-500'>
                Interview Status
              </span>
              {isAIPlaying &&
                <span className='text-sm font-semibold text-blue-600'>
                  {isAIPlaying ? "AI is asking question..." : "Your turn to answer!"}
                </span>}
            </div>
            <div className='h-px bg-gray-200'></div>
            <div className='flex justify-center'>
              <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit} />
            </div>

            <div className='h-px bg-gray-200'></div>

            <div className='grid grid-cols-2 gap-6 text-center'>
              <div>
                <span className='text-2xl font-bold text-blue-600'>{currentIndex + 1}</span>
                <span className='text-xs text-gray-400'>Current Questions</span>
              </div>

              <div>
                <span className='text-2xl font-bold text-blue-600'>{questions.length}</span>
                <span className='text-xs text-gray-400'>Total Questions</span>
              </div>
            </div>


          </div>

        </div>

        {/* text section */}
        <div className='flex-1 flex flex-col h-full p-4 sm:p-6 md:p-8 relative'>
          <div>
            <h2 className='text-xl sm:text-2xl font-bold text-blue-600 mb-6'>
              AI Smart Interview
            </h2>

            {!isIntroPhase && (<div className='relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl
              border border-gray-200 shadow-sm'>
              <p className='text-xs sm:text-sm text-gray-400 mb-2'>
                Question {currentIndex + 1} of {questions.length}
              </p>
              <div className='text-base sm:text-lg font-semibold text-gray-800
                  leading relaxed '>{currentQuestion?.question}</div>
            </div>)}

            <textarea
              placeholder="Type your answer here..."
              onChange={(e) => setAnswer(e.target.value)}
              value={answer}
              className='flex-1 w-full min-h-0 bg-gray-100 p-4 rounded-2xl resize-none
              outline-none border border-gray-200 focus:ring-2
              focus:ring-blue-500 transition text-gray-800 mt-6'/>

            {!feedback ? (<div className='flex items-center gap-4 mt-6'>
              <motion.button
                onClick={toggleMic}
                whileTap={{ scale: 0.9 }}
                className='w-12 h-12 sm:w-14 sm:h-14 flex
                items-center justify-center rounded-full bg-black text-white
                shadow-lg mt-6'>
                {isMicOn ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
              </motion.button>

              <motion.button
                onClick={submitAnswer}
                disabled={isSubmitting}
                whileTap={{ scale: 0.95 }}
                className='flex-1 bg-blue-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg
                hover:opacity-90 transition font-semibold mt-6 disabled:bg-gray-500'>
                {isSubmitting ? "Submitting..." : "Submit Answer"}
              </motion.button>

            </div>) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='mt-6 bg-blue-50 border border-blue-200
              p-5 rounded-2xl shadow-sm'>
                <p className='text-blue-700 font-medium mb-4'>{feedback}</p>
                <button
                  onClick={handleNext}
                  className='w-full bg-blue-600 text-white py-3 rounded-xl
                shadow-md hover:opacity-90 transition flex items-center
                justify-center gap-2'>
                  Next Question <BsArrowRight size={18} />
                </button>
              </motion.div>
            )}

          </div>
        </div>
      </div>

    </div>


  )
}


export default Step2Interview;