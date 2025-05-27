// src/LandingPage.tsx
import { Link } from "react-router-dom";
import "./Landing.css";          // tiny extra styles

export default function LandingPage() {
  return (
    <div className="landing-wrap">
      <div className="landing-avatar" />
      <h1 className="landing-title">LullaBuddy</h1>

      <div className="landing-btns">
        <Link to="/login" className="land-btn gradient">
          Log In
        </Link>
        <Link to="/register" className="land-btn plain">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
