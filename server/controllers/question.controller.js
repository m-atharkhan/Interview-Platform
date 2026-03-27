import Question from "../models/question.model.js";

/* CREATE QUESTION */

export const createQuestion = async (req,res)=>{

  try{

    const question = await Question.create(req.body);

    res.status(201).json(question);

  }catch(err){

    res.status(500).json({message:"Failed to create question"});

  }

};

/* GET ALL QUESTIONS */

export const getQuestions = async (req,res)=>{

  try{

    const questions = await Question.find().sort({createdAt:-1});

    res.json(questions);

  }catch{

    res.status(500).json({message:"Failed to fetch questions"});

  }

};

/* GET SINGLE QUESTION */

export const getQuestionById = async (req,res)=>{

  try{

    const question = await Question.findById(req.params.id);

    if(!question){
      return res.status(404).json({message:"Question not found"});
    }

    res.json(question);

  }catch{

    res.status(500).json({message:"Failed to fetch question"});

  }

};

/* UPDATE QUESTION */

export const updateQuestion = async (req,res)=>{

  try{

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
    );

    res.json(question);

  }catch{

    res.status(500).json({message:"Failed to update question"});

  }

};

/* DELETE QUESTION */

export const deleteQuestion = async (req,res)=>{

  try{

    await Question.findByIdAndDelete(req.params.id);

    res.json({message:"Question deleted"});

  }catch{

    res.status(500).json({message:"Failed to delete question"});

  }

};