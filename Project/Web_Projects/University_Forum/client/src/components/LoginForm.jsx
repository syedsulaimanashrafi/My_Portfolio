import { useState } from 'react'
import { Form, Button, Alert, Container, Row, Col, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

function LoginForm({ login }) {
  const [username, setUsername] = useState('reza')
  const [password, setPassword] = useState('password123')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()

  const doLogin = (credentials) => {
    setLoading(true)
    login(credentials)
      .then(() => {
        setErrorMessage('')
        setLoading(false)
        navigate('/')
      })
      .catch(err => {
        // Generic error message for security
        setErrorMessage('Wrong username or password')
        setLoading(false)
      })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setErrorMessage('')
    const credentials = { username, password }
    
    // Simple validation
    let valid = true
    if(username === '' || password === '') {
      valid = false
    }
    
    if(valid) {
      doLogin(credentials)
    } else {
      setErrorMessage('Username and password are required')
    }
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white text-center">
              <h4>Login to Forum</h4>
            </Card.Header>
            <Card.Body>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(ev) => setUsername(ev.target.value)}
                    required
                    placeholder="Enter your username"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading}
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </Form>
              
              <hr />
              
              <div className="text-center">
                <small className="text-muted">
                  Test accounts:<br />
                  <strong>admin_sara</strong> / admin123 (requires 2FA)<br />
                  <strong>admin_ali</strong> / admin456 (requires 2FA)<br />
                  <strong>reza</strong> / password123<br />
                  <strong>maryam</strong> / password123<br />
                  <strong>arash</strong> / password123
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default LoginForm
