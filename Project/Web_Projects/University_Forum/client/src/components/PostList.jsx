import { useState, useEffect } from 'react'
import { Card, Button, Badge, Row, Col, Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import API from '../API'
import LoadingSpinner from './LoadingSpinner'

function PostList({ user }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsData = await API.getAllPosts()
        setPosts(postsData)
      } catch (err) {
        setError('Error loading posts')
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const handleDeletePost = async (postId, event) => {
    event.stopPropagation()
    
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      await API.deletePost(postId)
      setPosts(posts.filter(post => post.id !== postId))
    } catch (err) {
      setError(err.error || 'Error deleting post')
    }
  }

  const canEditPost = (post) => {
    return user && (user.username === post.author || user.role === 'admin')
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>University Forum</h1>
        {user && (
          <Button 
            variant="primary" 
            onClick={() => navigate('/create')}
          >
            Create New Post
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {posts.length === 0 ? (
        <Alert variant="info" className="text-center">
          No posts available. {user ? 'Be the first to create one!' : 'Login to create posts.'}
        </Alert>
      ) : (
        <Row>
          {posts.map(post => (
            <Col key={post.id} md={6} lg={4} className="mb-3">
              <Card 
                className="post-card h-100" 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/posts/${post.id}`)}
              >
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">
                      by {post.author}
                      {post.author === 'admin' && (
                        <Badge bg="danger" className="ms-1">Admin</Badge>
                      )}
                    </small>
                  </div>
                  <small className="text-muted">{post.createdAt}</small>
                </Card.Header>
                
                <Card.Body>
                  <Card.Title className="h5">{post.title}</Card.Title>
                  <Card.Text className="text-muted">
                    {post.text.length > 150 
                      ? `${post.text.substring(0, 150)}...` 
                      : post.text
                    }
                  </Card.Text>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Badge bg="secondary" className="me-2">
                        {post.commentCount} comments
                      </Badge>
                      {post.maxComments && (
                        <Badge bg="warning" text="dark">
                          Max: {post.maxComments}
                        </Badge>
                      )}
                    </div>
                    
                    {canEditPost(post) && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => navigate(`/edit/${post.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={(e) => handleDeletePost(post.id, e)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {user && (
        <Button 
          variant="primary" 
          className="create-post-btn"
          onClick={() => navigate('/create')}
        >
          +
        </Button>
      )}
    </div>
  )
}

export default PostList
