import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/question.model.js";

dotenv.config();

const question = {
  title: "Two Sum",
  difficulty: "easy",
  description: "Given an array of integers nums and an integer target...",
  constraints: "2 <= nums.length <= 10^4",
  functionName: "twoSum",

  examples: [
    {
      input: "nums=[2,7,11,15], target=9",
      output: "[0,1]",
      explanation: "nums[0] + nums[1] = 9"
    }
  ],

  starterCode: {
    javascript: "function twoSum(nums,target){\n\n}",
    python: "def twoSum(nums,target):\n    pass",
    java: "class Solution { public int[] twoSum(int[] nums,int target){ } }",
    cpp: "vector<int> twoSum(vector<int>& nums,int target){ }"
  },

  testCases: [
    {
      args: "[[2,7,11,15],9]",
      expected: "[0,1]",
      functionName: "twoSum"
    },
    {
      args: "[[3,2,4],6]",
      expected: "[1,2]",
      functionName: "twoSum"
    }
  ]
};

const seed = async () => {

  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    await Question.create(question);

    console.log("Question inserted successfully");

    process.exit();

  } catch (err) {

    console.error(err);

    process.exit(1);

  }

};

seed();