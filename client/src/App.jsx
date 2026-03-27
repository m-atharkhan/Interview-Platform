import { BrowserRouter,Routes,Route,Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import InterviewRoom from "./pages/InterviewRoom";
import CreateQuestion from "./pages/CreateQuestion";
import QuestionBank from "./pages/QuestionBank";

export default function App(){

  return(

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Navigate to="/dashboard"/>}/>

        <Route path="/login" element={<Login/>}/>

        <Route path="/register" element={<Register/>}/>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard/>
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview/:roomId"
          element={
            <ProtectedRoute>
            <InterviewRoom/>
            </ProtectedRoute>
          }
          />

          <Route path="/questions/create" element={
            <ProtectedRoute>
              <CreateQuestion />
            </ProtectedRoute>
          } />

          <Route path="/questions/edit/:id" element={
            <ProtectedRoute>
              <CreateQuestion />
            </ProtectedRoute>
          } />

          <Route path="/questions" element={
            <ProtectedRoute>
              <QuestionBank />
            </ProtectedRoute>
          } />

      </Routes>

    </BrowserRouter>

  );
}