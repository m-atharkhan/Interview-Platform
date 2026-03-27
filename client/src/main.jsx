import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "#1E1E1E",
          color: "#EAEAEA",
          border: "1px solid #2A2A2A",
          borderRadius: "10px"
        }
      }}
    />
    <App />
  </React.StrictMode>
);