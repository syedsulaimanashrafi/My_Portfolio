import { useState, useEffect } from 'react'
import { Form, Button, Alert, Card, Container, Row, Col } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../API'
import LoadingSpinner from './LoadingSpinner'

function EditPost({ user }) {
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [maxComments, setMaxComments] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingPost, setLoadingPost] = useState(true)
  const [post, setPost] = useState(null)
  
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await API.getPost(id)
        
        // Check if user can edit this post
        if (postData.author !== user?.username && user?.role !== 'admin') {
          navigate('/')
          return
        }
        
        setPost(postData)
        setTitle(postData.title)
        setText(postData.text)
        setMaxComments(postData.maxComments || '')
      } catch (err) {
        setErrorMessage('Error loading post')
      } finally {
        setLoadingPost(false)
      }
    }

    fetchPost()
  }, [id, user, navigate])

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
      await API.updatePost(id, postData)
      navigate(`/posts/${id}`)
    } catch (err) {
      setErrorMessage(err.error || 'Error updating post')
    } finally {
      setLoading(false)
    }
  }

  if (loadingPost) {
    return <LoadingSpinner />
  }

  if (!post) {
    return (
      <Container>
        <Alert variant="danger">Post not found or you don't have permission to edit it.</Alert>
      </Container>
    )
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Header className="bg-warning text-dark">
              <h4>Edit Post</h4>
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
                    Current comments: {post.commentCount}
                    {post.commentCount > 0 && maxComments && parseInt(maxComments) < post.commentCount && (
                      <span className="text-warning">
                        {' '}(Warning: Setting max below current count won't delete existing comments)
                      </span>
                    )}
                  </Form.Text>
                </Form.Group>
                
                <div className="d-flex justify-content-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate(`/posts/${id}`)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="warning" 
                    disabled={loading || !title.trim() || !text.trim()}
                  >
                    {loading ? 'Updating...' : 'Update Post'}
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

export default EditPost
