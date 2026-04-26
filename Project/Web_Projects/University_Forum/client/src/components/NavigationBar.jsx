import { Navbar, Nav, Button, Badge } from 'react-bootstrap'
import { useNavigate, useLocation } from 'react-router-dom'

function NavigationBar({ user, logout, loggedIn, needs2FA, totpVerified }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="px-3">
      <Navbar.Brand href="#" onClick={() => navigate('/')}>
        🎓 University Forum
      </Navbar.Brand>
      
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          <Nav.Link 
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
          >
            Home
          </Nav.Link>
          {loggedIn && (
            <Nav.Link 
              active={location.pathname === '/create'}
              onClick={() => navigate('/create')}
            >
              Create Post
            </Nav.Link>
          )}
        </Nav>
        
        <Nav className="ms-auto">
          {loggedIn ? (
            <>
              <Nav.Item className="d-flex align-items-center me-3">
                <span className="text-light me-2">
                  Welcome, {user?.username}
                </span>
                {user?.role === 'admin' && (
                  <Badge bg="danger" className="me-2">
                    Admin
                  </Badge>
                )}
                {needs2FA && !totpVerified && (
                  <Badge bg="warning" text="dark" className="me-2">
                    2FA Required
                  </Badge>
                )}
              </Nav.Item>
              
              {needs2FA && !totpVerified && (
                <Button 
                  variant="warning" 
                  size="sm" 
                  className="me-2"
                  onClick={() => navigate('/totp')}
                >
                  Verify 2FA
                </Button>
              )}
              
              <Button variant="outline-light" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  )
}

export default NavigationBar
