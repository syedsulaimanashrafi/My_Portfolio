import { useState } from 'react'
import { Form, Button, Alert, Card, Container, Row, Col } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import API from '../API'

function CreatePost({ user }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [maxComments, setMaxComments] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)
    
    const postData = {
      title: title.trim(),
      text: text.trim(),
      maxComments: maxComments ? parseInt(maxComments) : null
    }
    
    try {
      const newPost = await API.addPost(postData)
      navigate(`/posts/${newPost.id}`)
    } catch (err) {
      setErrorMessage(err.error || 'Error creating post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-primary text-white">
              <h4>Create New Post</h4>
            </Card.Header>
            <Card.Body>
              {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(ev) => setTitle(ev.target.value)}
                    required
                    placeholder="Enter a unique title for your post"
                    maxLength={200}
                  />
                  <Form.Text className="text-muted">
                    Title must be unique across all posts
                  </Form.Text>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Content *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={text}
                    onChange={(ev) => setText(ev.target.value)}
                    required
                    placeholder="Write your post content here..."
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Comments (Optional)</Form.Label>
                  <Form.Control
                    type="number"
                    value={maxComments}
                    onChange={(ev) => setMaxComments(ev.target.value)}
                    placeholder="Leave empty for unlimited comments"
                    min="1"
                    max="1000"
                  />
                  <Form.Text className="text-muted">
                    Set a limit on how many comments this post can receive
                  </Form.Text>
                </Form.Group>
                
                <div className="d-flex justify-content-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={loading || !title.trim() || !text.trim()}
                  >
                    {loading ? 'Creating...' : 'Create Post'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default CreatePost
