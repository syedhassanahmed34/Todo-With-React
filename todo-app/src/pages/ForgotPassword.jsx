"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../firebase"
import "./ForgotPassword.css"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validateEmail = () => {
    setError("")
    if (!email) {
      setError("Please enter your email address")
      return false
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return false
    }

    return true
  }

  const handleSendResetEmail = async () => {
    if (!validateEmail()) return

    setLoading(true)
    setError("")

    try {
      // Firebase password reset
      await sendPasswordResetEmail(auth, email)
      setSuccess(`Password reset email sent to ${email}. Please check your inbox and follow the instructions.`)

      // After 5 seconds, redirect to login
      setTimeout(() => {
        navigate("/login")
      }, 5000)
    } catch (error) {
      console.error("Error sending reset email:", error)

      // Handle specific Firebase auth errors
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email address.")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email format.")
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.")
      } else {
        setError("Failed to send reset email. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-illustration">
          <div className="illustration-content">
            <h2 className="illustration-title">Reset Password</h2>
            <p className="illustration-subtitle">We'll help you get back into your account</p>
            <div className="illustration-image-container">
              <img src="https://img.freepik.com/free-vector/forgot-password-concept-illustration_114360-1095.jpg?semt=ais_hybrid&w=740" alt="Forgot password illustration" className="illustration-image" />
            </div>
          </div>
        </div>

        <div className="forgot-password-form-side">
          <div className="forgot-password-form-wrapper">
            <div className="forgot-password-header">
              <h1 className="forgot-password-title">Forgot Password</h1>
              <p className="forgot-password-subtitle">Enter your email to receive a password reset link</p>
            </div>

            {error && <div className="forgot-password-error-message">{error}</div>}
            {success && <div className="forgot-password-success-message">{success}</div>}

            <div className="forgot-password-form-fields">
              <div className="forgot-password-input-group">
                <div className="forgot-password-input-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="forgot-password-input-field"
                  disabled={loading}
                />
              </div>

              <button onClick={handleSendResetEmail} className="forgot-password-submit-button" disabled={loading}>
                {loading ? (
                  <div className="forgot-password-loading-spinner">
                    <div className="forgot-password-spinner"></div>
                    <span>Sending reset link...</span>
                  </div>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <div className="forgot-password-footer">
                Remember your password?{" "}
                <Link to="/login" className="forgot-password-link">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
