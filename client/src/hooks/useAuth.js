import { useEffect, useState } from "react";
import api from "../api/axios";

export default function useAuth(){

  const [user,setUser] = useState(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    const fetchUser = async()=>{

      try{

        const {data} = await api.get("/auth/me");

        setUser(data);

      }catch{

        setUser(null);

      }finally{

        setLoading(false);

      }

    };

    fetchUser();

  },[]);

  return {user,loading};
}