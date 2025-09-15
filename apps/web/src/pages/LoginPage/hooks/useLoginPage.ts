import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/api/index";
import { useAppDispatch } from "@/store/index";
import { setCredentials } from "@/store/slices/auth";

export function useLoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    try {
      const res = await login(username, password);
      dispatch(
        setCredentials({
          username: res.user.username,
          role: res.user.role,
          token: res.accessToken,
        })
      );
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    password,
    setUsername,
    setPassword,
    loading,
    onSubmit,
  };
}
