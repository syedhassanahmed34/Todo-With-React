"use client"

import React, { useState, useEffect } from "react"
import { auth, db } from "../firebase"
import { signOut, onAuthStateChanged } from "firebase/auth"
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore"
import { useNavigate } from "react-router-dom"
import { LogOut, Plus, Trash2, Edit2, Check, X, User } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import "./Home.css"

function Home() {
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentEditTodo, setCurrentEditTodo] = useState({ id: "", text: "" })
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showEmptyTaskError, setShowEmptyTaskError] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login")
        return
      }

      setUser(currentUser)
      setUserEmail(currentUser.email)
      fetchTodos(currentUser.uid)

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))

        if (userDoc.exists()) {
          const userData = userDoc.data()
          if (userData.name) {
            setUserName(userData.name)
          } else if (currentUser.displayName) {
            setUserName(currentUser.displayName)
            await updateDoc(doc(db, "users", currentUser.uid), {
              name: currentUser.displayName,
            })
          } else {
            const emailName = currentUser.email.split("@")[0]
            setUserName(emailName)
          }
        } else {
          const emailName = currentUser.email.split("@")[0]
          setUserName(currentUser.displayName || emailName)
          await setDoc(doc(db, "users", currentUser.uid), {
            name: currentUser.displayName || emailName,
            email: currentUser.email,
            createdAt: new Date(),
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        const emailName = currentUser.email.split("@")[0]
        setUserName(emailName)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const fetchTodos = async (uid) => {
    try {
      const q = query(collection(db, "todos"), where("uid", "==", uid))
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        completed: doc.data().completed || false,
      }))
      setTodos(data)
    } catch (error) {
      console.error("Error fetching todos:", error)
    }
  }

  const handleAddTodo = async () => {
    if (newTodo.trim() === "") {
      setShowEmptyTaskError(true)
      setTimeout(() => setShowEmptyTaskError(false), 3000)
      return
    }

    try {
      await addDoc(collection(db, "todos"), {
        text: newTodo,
        uid: user.uid,
        completed: false,
        createdAt: new Date(),
      })
      setNewTodo("")
      fetchTodos(user.uid)
    } catch (error) {
      console.error("Error adding todo:", error)
    }
  }

  const handleDeleteTodo = async (id) => {
    try {
      await deleteDoc(doc(db, "todos", id))
      fetchTodos(user.uid)
    } catch (error) {
      console.error("Error deleting todo:", error)
    }
  }

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "todos", id), {
        completed: !currentStatus,
      })
      fetchTodos(user.uid)
    } catch (error) {
      console.error("Error updating todo status:", error)
    }
  }

  const openEditDialog = (todo) => {
    setCurrentEditTodo({ id: todo.id, text: todo.text })
    setIsEditDialogOpen(true)
  }

  const handleUpdateTodo = async () => {
    if (currentEditTodo.text.trim() === "") return

    try {
      await updateDoc(doc(db, "todos", currentEditTodo.id), {
        text: currentEditTodo.text,
      })
      setIsEditDialogOpen(false)
      fetchTodos(user.uid)
    } catch (error) {
      console.error("Error updating todo:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddTodo()
    }
  }

  if (loading) {
    return (
      <motion.div
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <div className="spinner-circle" />
        </motion.div>
        <motion.p
          className="loading-text"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Preparing your workspace...
        </motion.p>
      </motion.div>
    )
  }

  return (
    <div className="app-background">
      <motion.div
        className="home-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <header className="app-header">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Taskify
          </motion.h1>
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
            <div className="user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="user-icon-button"
                aria-label="User menu"
              >
                <User size={24} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="user-menu"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button onClick={handleLogout} className="logout-menu-button">
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <motion.div
          className="todo-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="welcome-section">
            <div className="welcome-content">
              <motion.h2
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Welcome, <span className="user-name">{userName}</span>
              </motion.h2>
              <motion.p
                className="subtitle"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {todos.length > 0
                  ? `You have ${todos.length} task${todos.length !== 1 ? 's' : ''} to complete`
                  : "Organize your day, one task at a time"}
              </motion.p>
            </div>
          </div>

          <div className="add-task-section">
            <motion.div
              className="input-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What needs to be done?"
                className="task-input"
              />
              {showEmptyTaskError && (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  Please enter a task
                </motion.div>
              )}
            </motion.div>
            <motion.button
              onClick={handleAddTodo}
              className="add-task-button"
              disabled={newTodo.trim() === ""}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              aria-label="Add task"
            >
              <Plus size={20} />
              <span>Add Task</span>
            </motion.button>
          </div>

          <div className="tasks-list">
            <h3>Your Tasks</h3>
            {todos.length > 0 ? (
              <ul>
                <AnimatePresence>
                  {todos.map((todo) => (
                    <motion.li
                      key={todo.id}
                      className={todo.completed ? "completed" : ""}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.2 }}
                      layout
                    >
                      <div className="task-content">
                        <motion.button
                          onClick={() => handleToggleComplete(todo.id, todo.completed)}
                          className={`complete-button ${todo.completed ? "completed" : ""}`}
                          title={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                          <Check size={18} />
                        </motion.button>
                        <span className="task-text">{todo.text}</span>
                      </div>
                      <div className="task-actions">
                        <motion.button
                          onClick={() => openEditDialog(todo)}
                          className="edit-button"
                          title="Edit task"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="Edit task"
                        >
                          <Edit2 size={18} />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="delete-button"
                          title="Delete task"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="Delete task"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <motion.div
                className="no-tasks-message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <p>No tasks yet</p>
                <p className="no-tasks-subtitle">Add your first task to get started!</p>
              </motion.div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {isEditDialogOpen && (
            <motion.div
              className="edit-dialog-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditDialogOpen(false)}
            >
              <motion.div
                className="edit-dialog"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="edit-dialog-header">
                  <h3>Edit Task</h3>
                  <button
                    onClick={() => setIsEditDialogOpen(false)}
                    className="close-dialog-button"
                    aria-label="Close dialog"
                  >
                    <X size={20} />
                  </button>
                </div>
                <input
                  type="text"
                  value={currentEditTodo.text}
                  onChange={(e) => setCurrentEditTodo({ ...currentEditTodo, text: e.target.value })}
                  className="edit-task-input"
                  autoFocus
                />
                <div className="edit-dialog-actions">
                  <motion.button
                    onClick={() => setIsEditDialogOpen(false)}
                    className="cancel-button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleUpdateTodo}
                    className="update-button"
                    disabled={currentEditTodo.text.trim() === ""}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default Home