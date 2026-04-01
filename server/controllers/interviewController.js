import fs from 'fs'
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from '../services/openRouter.service.js';
import User from '../models/user.js';
import Interview from '../models/interviewModel.js';

export const analyzeResume = async (req, res) => {
    try {
        // Check file
        if (!req.file) {
            return res.status(400).json({ message: "Resume required" });
        }

        const filepath = req.file.path;

        // Read PDF
        const fileBuffer = await fs.promises.readFile(filepath);
        const uint8Array = new Uint8Array(fileBuffer);
        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

        let resumeText = ""; // ✅ fixed

        // Extract text
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map(item => item.str).join(" ");
            resumeText += pageText + "\n";
        }

        resumeText = resumeText
            .replace(/\s+/g, " ")
            .trim();

        // AI Prompt
        const messages = [
            {
                role: "system",
                content: `
Extract structured data from resume.

Return ONLY raw JSON.
Do NOT include backticks or markdown.

{
  "role":"string",
  "experience":"string",
  "projects":["project1","project2"],
  "skills":["skill1","skill2"]
}`
            },
            {
                role: "user",
                content: resumeText
            }
        ];

        // Call AI
        const aiResponse = await askAi(messages);

        // Clean AI response (VERY IMPORTANT)
        let cleaned = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        // Safe JSON parse
        let parsed;

        try {
            parsed = JSON.parse(cleaned);
        } catch (error) {
            console.log("RAW AI RESPONSE:", aiResponse);
            return res.status(500).json({ message: "Invalid AI JSON format" });
        }

        // Delete file safely
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        //  Send response
        res.json({
            role: parsed.role || "",
            experience: parsed.experience || "",
            projects: parsed.projects || [],
            skills: parsed.skills || [],
            resumeText
        });

    } catch (err) {
        console.error("Analyze Resume Error:", err);

        // Cleanup if error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({ message: err.message || "Server error" });
    }
};

export const generateQuestion = async (req, res) => {
    try {
        let { role, experience, mode, resumeText, projects, skills } = req.body;
        role = typeof role === "string" ? role.trim() : "";
        experience = typeof experience === "string" ? experience.trim() : "";
        mode = typeof mode === "string" ? mode.trim() : "";

        if (!role || !experience || !mode) {
            return res.status(400).json({ message: "Role, experience and mode are required." });
        }

        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(400).json({ message: "User not found!" });
        }
        if (user.credits < 50) {
            return res.status(400).json({
                message: `Not enough credits. Generating questions costs 50 credits; you have ${user.credits}.`,
            });
        }

        const projectText = Array.isArray(projects) && projects.length ? projects.join(", ") : "None";

        const skillsText = Array.isArray(skills) && skills.length ? skills.join(", ") : "None";

        const safeResume = resumeText?.trim() || "None";

        const userPrompt = `
        Role:${role}
        Experience:${experience}
        interviewMode:${mode}
        Projects:${projectText}
        skills:${skillsText}
        resume:${safeResume}
        `;

        if (!userPrompt.trim()) {
            return res.status(400).json({ message: "Prompt is empty." });
        }

        const messages = [
            {
                role: "system",
                content: `
                You are a real human interviewer conducting a professional interview.
                Speak in simple, natural English as if you are directly talking to the candidate.
                Generate exactly 5 interview questions.
                Strict Rules:
                 -Each question must contain between 15 to 25 words.
                 -Each question must be a single complete sentence.
                 -Do NOT number them.
                 -Do NOT add explanations.
                 -Do NOT add extra text before or after.
                 -One question per line only.
                 -Keep language simple and conversational.
                 -Questions must feel practical and realistic.

                 Difficulty progression:
                 Question 1 -> easy
                 Question 2 -> easy
                 Question 3 -> medium
                 Question 4 -> medium
                 Question 5 -> hard

                 Make questions based on candidate's role, experience,interviewMode, projects, skills and
                 resume details.
                `
            },
            {
                role: "user",
                content: userPrompt
            }
        ];
        const aiResponse = await askAi(messages)

        if (!aiResponse || !aiResponse.trim()) {
            return res.status(500).json({ message: "AI returned empty response." });
        }
        const questionsArray = aiResponse
            .split("\n")
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .slice(0, 5);

        if (questionsArray.length === 0) {
            return res.status(500).json({ message: "AI failed to generate questions." });
        }
        user.credits -= 50;
        await user.save();

        const interview = await Interview.create({
            userId: user._id,
            role,
            experience,
            mode,
            resumeText: safeResume,
            questions: questionsArray.map((q, index) => ({
                question: q,
                difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
                timeLimit: [60, 60, 90, 90, 120][index],
            }))
        })
        res.json({
            interviewId: interview._id,
            creditsLeft: user.credits,
            userName: user.name,
            questions: interview.questions
        });
    } catch (err) {
        return res.status(500).json({ message: err.message || "Server error" });
    }
}

export const submitAnswer = async (req, res) => {
    try {
        const { interviewId, questionIndex, answer, timeTaken } = req.body;
        const interview = await Interview.findById(interviewId)
        const question = interview.questions[questionIndex]

        if (!answer) {
            question.score = 0;
            question.feedback = "You didn't submit an answer";
            question.answer = "";

            await interview.save();
            return res.json({
                feedback: question.feedback
            });
        }

        if (timeTaken > question.timeLimit) {
            question.score = 0;
            question.feedback = "Time limit exceeded. Answer not evaluated.";
            question.answer = answer;

            await interview.save();
            return res.json({
                feedback: question.feedback
            })
        }

        const messages = [
            {
                role: "system",
                content: `
                you are a professional human interviewer evaluating a candidate's answer
                in a real interview.
                Evaluate naturally and fairly, like a real person would.
                Score the answer in these areas(0 to 10):
                1.Confidence - Does the answer sound clear, confident and well-presented?
                2.Communication-Is the language simple, clear, and easy to undersand?
                3.Correctness - Is the answer factually correct and relevant to the question?
                4.Depth - Does the answer show a deep understanding of the topic?
                5.Practicality - Does the answer provide practical insights or solutions?

                Rules:
                -Be realistic and unbiased.
                -Do not give random high scores.
                -If the answer is weak, score low.
                -If the answer is strong and impressive, score high.
                -Consider clarity, structure and relevance of the answer.
                
                Calculate:
                finalScore=average of confidence,communication and correctness(rounded to
                nearest whole number).

                Feedback Rules:
                -Write natural human feedback.
                -10 to 15 words only.
                -Sound like real interview feedback.
                -Can suggest improvements if needed.
                -Do NOT repeat the question in feedback.
                -Do NOT explain scoring.
                -Keep tone professional, honest and constructive.

                Return ONLY valid JSON in this format:
                {
                "confidence":number,
                "communication":number,
                "correctness":number,
                "finalScore":number,
                "feedback":"short human feedback"
                }
                `
            },
            {
                role: "user",
                content: `
                Question:${question.question}
                Answer:${answer}
                `
            }
        ];

        const aiResponse = await askAi(messages);

        const parsed = JSON.parse(aiResponse);
        question.answer = answer;
        question.confidence = parsed.confidence;
        question.communication = parsed.communication;
        question.correctness = parsed.correctness;
        question.score = parsed.finalScore;
        question.feedback = parsed.feedback;

        await interview.save();

        return res.status(200).json({ feedback: parsed.feedback });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: `fail to evaluate answer: ${err.message || "Server error"} ` });
    }
}

export const finishInterview = async (req, res) => {
    try {
        const { interviewId } = req.body;
        const interview = await Interview.findById(interviewId);

        if (!interview) {
            return res.status(400).json({ message: "Interview not found!" });
        }

        const totalQuestions = interview.questions.length;

        let totalScore = 0;
        let totalConfidence = 0;
        let totalCommunication = 0;
        let totalCorrectness = 0;

        interview.questions.forEach((q) => {
            totalScore += q.score || 0;
            totalConfidence += q.confidence || 0;
            totalCommunication += q.communication || 0;
            totalCorrectness += q.correctness || 0;
        });

        const finalScore = totalQuestions ? totalScore / totalQuestions : 0;
        const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
        const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0;
        const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;

        interview.finalScore = finalScore;
        interview.status = "completed";
        await interview.save();

        return res.status(200).json({
            finalScore: Number(finalScore.toFixed(1)),
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),
            questionWiseScore: interview.questions.map((q) => ({
                question: q.question,
                score: q.score || 0,
                feedback: q.feedback || "",
                confidence: q.confidence || 0,
                communication: q.communication || 0,
                correctness: q.correctness || 0,

            })),
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: `fail to finish interview: ${err.message || "Server error"} ` });
    }
}

export const getMyInterviews=async(req,res)=>{
     try{
         const interview =await Interview.find({userId:req.userId}).sort({createdAt:-1})
         .select("role experience ,mode finalScore status createdAt");
         return res.status(200).json(interview);
     }catch(err){
        console.error(err);
        return res.status(500).json({ message: `fail to get interviews: ${err.message || "Server error"} ` });
     }
}

export const getInterviewReport=async(req,res)=>{
    try{
        // Temporarily bypass userId check for testing
        const interview=await Interview.findById(req.params.id);
        if(!interview){
            return res.status(400).json({message:"Interview not found!"})
        }
        const totalQuestions = interview.questions.length;

        let totalConfidence = 0;
        let totalCommunication = 0;
        let totalCorrectness = 0;

        interview.questions.forEach((q) => {
            totalConfidence += q.confidence || 0;
            totalCommunication += q.communication || 0;
            totalCorrectness += q.correctness || 0;
        });

        const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;
        const avgCommunication = totalQuestions ? totalCommunication / totalQuestions : 0;
        const avgCorrectness = totalQuestions ? totalCorrectness / totalQuestions : 0;

        return res.json({
            finalScore:interview.finalScore,
            confidence: Number(avgConfidence.toFixed(1)),
            communication: Number(avgCommunication.toFixed(1)),
            correctness: Number(avgCorrectness.toFixed(1)),
            questionWiseScore:interview.questions
        });
    }catch(err){
        console.error(err);
        return res.status(500).json({ message: `fail to get report: ${err.message || "Server error"} ` });
    }
}
