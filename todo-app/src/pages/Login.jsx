"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"
import { auth, db } from "../firebase"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import "./Login.css"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const recentSignup = localStorage.getItem("recentSignup")
    if (recentSignup) {
      const { email } = JSON.parse(recentSignup)
      setEmail(email)
      localStorage.removeItem("recentSignup")
    }
  }, [])

  const validateForm = () => {
    setError("")
    if (!email || !password) {
      setError("Please enter your email and password")
      return false
    }
    return true
  }

  const handleEmailLogin = async () => {
    if (!validateForm()) return

    setLoading(true)
    setError("")

    try {
      // Check if user exists in Firestore
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        throw new Error("Account not registered. Please sign up first.")
      }

      await signInWithEmailAndPassword(auth, email, password)
      navigate("/home")
    } catch (error) {
      console.error("Login error:", error)
      if (error.code === "auth/user-not-found" || error.message.includes("not registered")) {
        setError("Account not registered. Please sign up first.")
      } else if (error.code === "auth/wrong-password") {
        setError("Invalid password. Please try again.")
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email format.")
      } else {
        setError("Login failed. Please check your credentials.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (!userDoc.exists()) {
        await signOut(auth)
        throw new Error("Account not registered. Please sign up first.")
      }

      navigate("/home")
    } catch (error) {
      console.error("Google login error:", error)
      setError(error.message.includes("not registered") 
        ? "Account not registered. Please sign up first."
        : "Google login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleEmailLogin()
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-illustration">
          <div className="illustration-content">
            <h2 className="illustration-title">Welcome Back!</h2>
            <p className="illustration-subtitle">Log in to manage your tasks and stay organized.</p>
            <div className="illustration-image-container">
              <img src="https://img.lovepik.com/photo/45009/7677.jpg_wh860.jpg" alt="Login illustration" className="illustration-image" />
            </div>
          </div>
        </div>

        <div className="login-form-side">
          <div className="login-form-wrapper">
            <div className="login-header">
              <h1 className="login-title">Logging In</h1>
              <p className="login-subtitle">Enter your credentials to continue</p>
            </div>

            {error && <div className="login-error-message">{error}</div>}

            <div className="login-form-fields">
              <div className="login-input-group">
                <div className="login-input-icon">
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
                  className="login-input-field"
                  disabled={loading}
                  onKeyPress={handleKeyPress}
                />
              </div>

              <div className="login-input-group">
                <div className="login-input-icon">
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
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input-field"
                  disabled={loading}
                  onKeyPress={handleKeyPress}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="login-password-toggle">
                  {showPassword ? (
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
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </svg>
                  ) : (
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
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="login-forgot-password-link">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>

              <button onClick={handleEmailLogin} className="login-submit-button" disabled={loading}>
                {loading ? (
                  <div className="login-loading-spinner">
                    <div className="login-spinner"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  "Log In"
                )}
              </button>

              <div className="login-divider">
                <span>OR</span>
              </div>

              <button onClick={handleGoogleLogin} className="login-google-button" disabled={loading}>
                <svg className="login-google-icon" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                Continue with Google
              </button>

              <div className="login-footer">
                Don't have an account?{" "}
                <Link to="/signup" className="login-link">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}