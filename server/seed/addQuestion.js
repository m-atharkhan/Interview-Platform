import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/question.model.js";

dotenv.config();

const questions = [
  {
    title: "Valid Anagram",
    difficulty: "easy",
    description: "Check if two strings are anagrams.",
    constraints: "1 ≤ s.length ≤ 5*10^4",
    functionName: "isAnagram",
    examples: [{ input: 's="anagram", t="nagaram"', output: "true" }],
    starterCode: {
      javascript: "function isAnagram(s,t){\n\n}",
      python: "def isAnagram(s,t):\n    pass",
      java: "boolean isAnagram(String s,String t){ }",
      cpp: "bool isAnagram(string s,string t){ }"
    },
    testCases: [
      { args: '["anagram","nagaram"]', expected: "true", functionName: "isAnagram" }
    ]
  },

  {
    title: "Maximum Subarray",
    difficulty: "medium",
    description: "Find max subarray sum.",
    constraints: "1 ≤ nums.length ≤ 10^5",
    functionName: "maxSubArray",
    examples: [{ input: "[-2,1,-3,4,-1,2,1,-5,4]", output: "6" }],
    starterCode: {
      javascript: "function maxSubArray(nums){\n\n}",
      python: "def maxSubArray(nums):\n    pass",
      java: "int maxSubArray(int[] nums){ }",
      cpp: "int maxSubArray(vector<int>& nums){ }"
    },
    testCases: [
      { args: "[[-2,1,-3,4,-1,2,1,-5,4]]", expected: "6", functionName: "maxSubArray" }
    ]
  },

  {
    title: "Reverse String",
    difficulty: "easy",
    description: "Reverse a string.",
    constraints: "1 ≤ s.length ≤ 10^5",
    functionName: "reverseString",
    examples: [{ input: '"hello"', output: '"olleh"' }],
    starterCode: {
      javascript: "function reverseString(s){\n\n}",
      python: "def reverseString(s):\n    pass",
      java: "String reverseString(String s){ }",
      cpp: "string reverseString(string s){ }"
    },
    testCases: [
      { args: '["hello"]', expected: '"olleh"', functionName: "reverseString" }
    ]
  },

  {
    title: "Palindrome Number",
    difficulty: "easy",
    description: "Check if number is palindrome.",
    constraints: "-2^31 ≤ x ≤ 2^31 - 1",
    functionName: "isPalindrome",
    examples: [{ input: "121", output: "true" }],
    starterCode: {
      javascript: "function isPalindrome(x){\n\n}",
      python: "def isPalindrome(x):\n    pass",
      java: "boolean isPalindrome(int x){ }",
      cpp: "bool isPalindrome(int x){ }"
    },
    testCases: [
      { args: "[121]", expected: "true", functionName: "isPalindrome" }
    ]
  },

  {
    title: "Merge Sorted Arrays",
    difficulty: "easy",
    description: "Merge two sorted arrays.",
    constraints: "1 ≤ n ≤ 1000",
    functionName: "mergeArrays",
    examples: [{ input: "[1,3,5] + [2,4,6]", output: "[1,2,3,4,5,6]" }],
    starterCode: {
      javascript: "function mergeArrays(a,b){\n\n}",
      python: "def mergeArrays(a,b):\n    pass",
      java: "int[] mergeArrays(int[] a,int[] b){ }",
      cpp: "vector<int> mergeArrays(vector<int>& a,vector<int>& b){ }"
    },
    testCases: [
      { args: "[[1,3,5],[2,4,6]]", expected: "[1,2,3,4,5,6]", functionName: "mergeArrays" }
    ]
  },

  {
    title: "Valid Parentheses",
    difficulty: "easy",
    description: "Check valid parentheses.",
    constraints: "1 ≤ s.length ≤ 10^4",
    functionName: "isValid",
    examples: [{ input: '"()[]{}"', output: "true" }],
    starterCode: {
      javascript: "function isValid(s){\n\n}",
      python: "def isValid(s):\n    pass",
      java: "boolean isValid(String s){ }",
      cpp: "bool isValid(string s){ }"
    },
    testCases: [
      { args: '["()[]{}"]', expected: "true", functionName: "isValid" }
    ]
  },

  {
    title: "Single Number",
    difficulty: "easy",
    description: "Find single occurring number.",
    constraints: "1 ≤ nums.length ≤ 10^5",
    functionName: "singleNumber",
    examples: [{ input: "[2,2,1]", output: "1" }],
    starterCode: {
      javascript: "function singleNumber(nums){\n\n}",
      python: "def singleNumber(nums):\n    pass",
      java: "int singleNumber(int[] nums){ }",
      cpp: "int singleNumber(vector<int>& nums){ }"
    },
    testCases: [
      { args: "[[2,2,1]]", expected: "1", functionName: "singleNumber" }
    ]
  },

  {
    title: "Move Zeroes",
    difficulty: "easy",
    description: "Move zeroes to end.",
    constraints: "1 ≤ nums.length ≤ 10^4",
    functionName: "moveZeroes",
    examples: [{ input: "[0,1,0,3,12]", output: "[1,3,12,0,0]" }],
    starterCode: {
      javascript: "function moveZeroes(nums){\n\n}",
      python: "def moveZeroes(nums):\n    pass",
      java: "void moveZeroes(int[] nums){ }",
      cpp: "void moveZeroes(vector<int>& nums){ }"
    },
    testCases: [
      { args: "[[0,1,0,3,12]]", expected: "[1,3,12,0,0]", functionName: "moveZeroes" }
    ]
  },

  {
    title: "Climbing Stairs",
    difficulty: "easy",
    description: "Count ways to climb stairs.",
    constraints: "1 ≤ n ≤ 45",
    functionName: "climbStairs",
    examples: [{ input: "3", output: "3" }],
    starterCode: {
      javascript: "function climbStairs(n){\n\n}",
      python: "def climbStairs(n):\n    pass",
      java: "int climbStairs(int n){ }",
      cpp: "int climbStairs(int n){ }"
    },
    testCases: [
      { args: "[3]", expected: "3", functionName: "climbStairs" }
    ]
  },

  {
    title: "Best Time to Buy and Sell Stock",
    difficulty: "easy",
    description: "Find max profit.",
    constraints: "1 ≤ prices.length ≤ 10^5",
    functionName: "maxProfit",
    examples: [{ input: "[7,1,5,3,6,4]", output: "5" }],
    starterCode: {
      javascript: "function maxProfit(prices){\n\n}",
      python: "def maxProfit(prices):\n    pass",
      java: "int maxProfit(int[] prices){ }",
      cpp: "int maxProfit(vector<int>& prices){ }"
    },
    testCases: [
      { args: "[[7,1,5,3,6,4]]", expected: "5", functionName: "maxProfit" }
    ]
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    await Question.insertMany(questions);

    console.log("10 Questions inserted successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();