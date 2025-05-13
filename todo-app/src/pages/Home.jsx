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
import { LogOut, Plus, Trash2, Edit2, Check, X, User, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import "./Home.css"

function Home() {
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [todos, setTodos] = useState([])
  const [filteredTodos, setFilteredTodos] = useState([])
  const [newTodo, setNewTodo] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentEditTodo, setCurrentEditTodo] = useState({ id: "", text: "" })
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()

  // Toast notifications
  const showToast = (message, type = "success") => {
    toast[type](message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }

  // Validate task input
  const validateTask = (task) => {
    const trimmedTask = task.trim()

    // 1. Check for empty task
    if (!trimmedTask) {
      showToast("Task cannot be empty!", "error")
      return false
    }

    // 2. NEW: Check if task is only numbers
    if (/^[\d\s]+$/.test(trimmedTask)) {
      showToast("Task cannot be only numbers!", "error")
      return false
    }

    // 3. Check for special characters
    if (/[^a-zA-Z0-9\s.,!?-]/.test(trimmedTask)) {
      showToast("Only letters, numbers and basic punctuation allowed", "error")
      return false
    }

    return true
  }

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

  useEffect(() => {
    const filtered = todos.filter(todo =>
      todo.text.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTodos(filtered)
  }, [searchTerm, todos])

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
      setFilteredTodos(data)
    } catch (error) {
      showToast("Failed to load tasks", "error")
    }
  }

  const handleAddTodo = async () => {
    if (!validateTask(newTodo)) return

    try {
      await addDoc(collection(db, "todos"), {
        text: newTodo.trim(),
        uid: user.uid,
        completed: false,
        createdAt: new Date(),
      })
      setNewTodo("")
      fetchTodos(user.uid)
      showToast("Task added successfully!")
    } catch (error) {
      showToast("Failed to add task", "error")
    }
  }

  const handleDeleteTodo = async (id) => {
    try {
      await deleteDoc(doc(db, "todos", id))
      fetchTodos(user.uid)
      showToast("Task deleted successfully!")
    } catch (error) {
      showToast("Failed to delete task", "error")
    }
  }

  const handleToggleComplete = async (id, currentStatus) => {
    if (currentStatus) return // Prevent unchecking

    try {
      await updateDoc(doc(db, "todos", id), {
        completed: true,
      })
      fetchTodos(user.uid)
      showToast("Task completed! 🎉")
    } catch (error) {
      showToast("Failed to update task", "error")
    }
  }

  const openEditDialog = (todo) => {
    setCurrentEditTodo({ id: todo.id, text: todo.text })
    setIsEditDialogOpen(true)
  }

  const handleUpdateTodo = async () => {
    if (!validateTask(currentEditTodo.text)) return

    try {
      await updateDoc(doc(db, "todos", currentEditTodo.id), {
        text: currentEditTodo.text.trim(),
      })
      setIsEditDialogOpen(false)
      fetchTodos(user.uid)
      showToast("Task updated successfully!")
    } catch (error) {
      showToast("Failed to update task", "error")
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate("/login")
      showToast("Logged out successfully")
    } catch (error) {
      showToast("Failed to logout", "error")
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddTodo()
    }
  }

  const completedTasksCount = todos.filter(todo => todo.completed).length
  const totalTasksCount = todos.length

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
      <ToastContainer />
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
            <div className="task-stats">
              {completedTasksCount}/{totalTasksCount} completed
            </div>
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
                  ? `You have ${todos.length} task${todos.length !== 1 ? 's' : ''} (${completedTasksCount} completed)`
                  : "Organize your day, one task at a time"}
              </motion.p>
            </div>
          </div>

          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
            {filteredTodos.length > 0 ? (
              <ul>
                <AnimatePresence>
                  {filteredTodos.map((todo) => (
                    <motion.li
                      key={todo.id}
                      className={todo.completed ? "completed locked" : ""}
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
                          title={todo.completed ? "Completed" : "Mark as complete"}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label={todo.completed ? "Completed" : "Mark as complete"}
                          disabled={todo.completed}
                        >
                          <Check size={18} />
                        </motion.button>
                        <span className="task-text">{todo.text}</span>
                      </div>
                      <div className="task-actions">
                        {!todo.completed && (
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
                        )}
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
                <p>{searchTerm ? "No matching tasks found" : "No tasks yet"}</p>
                <p className="no-tasks-subtitle">
                  {searchTerm ? "Try a different search" : "Add your first task to get started!"}
                </p>
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