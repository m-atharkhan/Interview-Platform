import Interview from "../models/interview.model.js";
import { nanoid } from "nanoid";

export const createInterview = async (req,res,next)=>{
  try{

    const roomId = nanoid(8);

    if (req.user.role !== "interviewer") {
      return res.status(403).json({
        message: "Only interviewers can create interviews"
      });
    }

    const interview = await Interview.create({
      roomId,
      interviewer: req.userId,
      startedAt: Date.now()
    });

    res.status(201).json({
      message:"Interview created",
      roomId
    });

  }catch(err){
    next(err);
  }
};

export const getInterview = async(req,res,next)=>{
  try{

    const {roomId} = req.params;

    const interview = await Interview.findOne({roomId})
      .populate("interviewer","name email");

    if(!interview){
      return res.status(404).json({message:"Interview not found"});
    }

    if (interview.status === "completed") {
      return res.status(410).json({ message: "This interview has already ended." });
    }

    res.json(interview);

  }catch(err){
    next(err);
  }
};

export const endInterview = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    if (req.user.role !== "interviewer") {
      return res.status(403).json({ message: "Only interviewers can end interviews" });
    }

    const interview = await Interview.findOneAndUpdate(
      { roomId },
      { status: "completed" },
      { new: true }
    );

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.json({ message: "Interview ended", interview });
  } catch (err) {
    next(err);
  }
};