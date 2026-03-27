import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

export default function QuestionBank(){

  const [questions,setQuestions] = useState([]);
  const navigate = useNavigate();

  const loadQuestions = async () => {
    try{
      const {data} = await api.get("/questions");
      setQuestions(data);
    }catch{
      toast.error("Failed to load questions");
    }
  };

  useEffect(()=>{
    loadQuestions();
  },[]);

  const deleteQuestion = async(id)=>{
    try{

      await api.delete(`/questions/${id}`);

      toast.success("Question deleted");

      setQuestions(prev => prev.filter(q => q._id !== id));

    }catch{

      toast.error("Delete failed");

    }
  };

  return(

    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">

      {/* HEADER */}

      <header className="border-b border-light-border dark:border-dark-border">

        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

          <h1 className="text-xl font-semibold">
            Question Bank
          </h1>

          <div className="flex gap-3">

            <ThemeToggle/>

            <button
              onClick={()=>navigate("/questions/create")}
              className="
              flex items-center gap-2
              bg-amu-primary text-white px-4 py-2 rounded-lg
              "
            >
              <FaPlus/>
              Add Question
            </button>

          </div>

        </div>

      </header>

      {/* BODY */}

      <main className="max-w-6xl mx-auto px-6 py-10">

        <div className="grid gap-4">

          {questions.map(q => (

            <div
              key={q._id}
              className="
              bg-white dark:bg-dark-card
              border border-light-border dark:border-dark-border
              p-5 rounded-xl
              flex justify-between items-center
              "
            >

              <div>

                <h3 className="font-semibold text-lg">
                  {q.title}
                </h3>

                <p className="text-sm opacity-70 mt-1">
                  {q.difficulty}
                </p>

              </div>

              <div className="flex gap-3">

                <button
                  onClick={()=>navigate(`/questions/edit/${q._id}`)}
                  className="
                  flex items-center gap-1
                  px-3 py-1 text-sm
                  bg-blue-600 text-white rounded
                  "
                >
                  <FaEdit/>
                  Edit
                </button>

                <button
                  onClick={()=>deleteQuestion(q._id)}
                  className="
                  flex items-center gap-1
                  px-3 py-1 text-sm
                  bg-red-600 text-white rounded
                  "
                >
                  <FaTrash/>
                  Delete
                </button>

              </div>

            </div>

          ))}

        </div>

      </main>

    </div>

  );

}