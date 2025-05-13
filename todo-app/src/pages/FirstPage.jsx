import { Link } from "react-router-dom";
import "./FirstPage.css";

export default function FirstPage() {
  return (
    <div className="firstpage-container">
      <div className="overlay" />
      <div className="firstpage-card">
        <h1 className="firstpage-title">Welcome to Our Todo App</h1>
        <p className="firstpage-subtitle">
          Stay organized and boost your productivity with our sleek, powerful task manager.
        </p>
        <div className="firstpage-button-group">
          <Link to="/login" className="firstpage-primary-button">
            Sign In
          </Link>
          <Link to="/signup" className="firstpage-secondary-button">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
