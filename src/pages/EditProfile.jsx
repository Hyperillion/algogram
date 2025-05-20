import { Button } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase"; // 确保你路径正确

export default function EditProfile() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // 登出后跳转到登录页
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div style={{ padding: "16px", paddingBottom: "80px" }}>
      <h2>Edit Profile Page</h2>
      <p>This is the edit profile page.</p>

      <Button
        variant="contained"
        onClick={() => navigate("/questionare")}
        sx={{ mt: 2 }}
      >
        Get a New Fingerprint
      </Button>

      <Button
        variant="outlined"
        color="error"
        onClick={handleLogout}
        sx={{ mt: 2, ml: 2 }}
      >
        Log Out
      </Button>
    </div>
  );
}
