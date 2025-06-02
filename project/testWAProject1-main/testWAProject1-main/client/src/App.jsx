import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'

import NavigationBar from './components/NavigationBar'
import LoginForm from './components/LoginForm'
import PostList from './components/PostList'
import PostDetail from './components/PostDetail'
import CreatePost from './components/CreatePost'
import EditPost from './components/EditPost'
import TotpForm from './components/TotpForm'
import LoadingSpinner from './components/LoadingSpinner'
import API from './API'

import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [message, setMessage] = useState('')
  const [needs2FA, setNeeds2FA] = useState(false)
  const [totpVerified, setTotpVerified] = useState(false)

  useEffect(() => {
    const checkAuthUser = async () => {
      try {
        const user = await API.getUserInfo()
        setUser(user)
        setLoggedIn(true)
        setTotpVerified(user.isTotp || false)
        if (user.role === 'admin' && user.canDoTotp && !user.isTotp) {
          setNeeds2FA(true)
        }
      } catch (err) {
        // User not authenticated
      }
      setLoading(false)
    }
    checkAuthUser()
  }, [])

  const doLogIn = async (credentials) => {
    try {
      const result = await API.logIn(credentials)
      setUser(result)
      setLoggedIn(true)
      
      if (result.role === 'admin' && result.canDoTotp && !result.isTotp) {
        setNeeds2FA(true)
        setTotpVerified(false)
        setMessage('2FA verification required for admin users')
      } else {
        setTotpVerified(true)
        setMessage('Welcome back!')
      }
    } catch (err) {
      setMessage(err.error || err.message || 'Login failed')
      throw err
    }
  }

  const doLogOut = async () => {
    try {
      await API.logOut()
      setUser(null)
      setLoggedIn(false)
      setNeeds2FA(false)
      setTotpVerified(false)
      setMessage('Logged out successfully')
    } catch (err) {
      setMessage('Error during logout')
    }
  }

  const verifyTotp = async (token) => {
    try {
      const result = await API.verifyTotp(token)
      setTotpVerified(true)
      setNeeds2FA(false)
      setMessage('2FA verification successful')
    } catch (err) {
      setMessage(err.error || 'Invalid TOTP token')
      throw err
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <div className="App">
        <NavigationBar 
          user={user} 
          logout={doLogOut} 
          loggedIn={loggedIn}
          needs2FA={needs2FA}
          totpVerified={totpVerified}
        />
        
        <Container fluid className="mt-3">
          {message && (
            <div className={`alert ${message.includes('Error') || message.includes('failed') ? 'alert-danger' : 'alert-info'} alert-dismissible`}>
              {message}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setMessage('')}
              ></button>
            </div>
          )}

          <Routes>
            <Route path="/login" element={
              loggedIn ? <Navigate to="/" /> : <LoginForm login={doLogIn} />
            } />
            
            <Route path="/totp" element={
              (loggedIn && needs2FA) ? 
                <TotpForm verifyTotp={verifyTotp} /> : 
                <Navigate to="/" />
            } />
            
            <Route path="/" element={<PostList user={user} />} />
            
            <Route path="/posts/:id" element={<PostDetail user={user} />} />
            
            <Route path="/create" element={
              loggedIn ? 
                <CreatePost user={user} /> : 
                <Navigate to="/login" />
            } />
            
            <Route path="/edit/:id" element={
              loggedIn ? 
                <EditPost user={user} /> : 
                <Navigate to="/login" />
            } />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Container>
      </div>
    </Router>
  )
}

export default App
