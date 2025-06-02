import { useState, useEffect } from 'react'
import { Card, Button, Badge, Alert, Form, Modal } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import API from '../API'
import LoadingSpinner from './LoadingSpinner'

function PostDetail({ user }) {
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newComment, setNewComment] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postData, commentsData] = await Promise.all([
          API.getPost(id),
          API.getComments(id)
        ])
        setPost(postData)
        setComments(commentsData)
      } catch (err) {
        setError('Error loading post or comments')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleSubmitComment = async (event) => {
    event.preventDefault()
    if (!newComment.trim()) return
    
    setSubmittingComment(true)
    
    try {
      const commentData = {
        text: newComment.trim(),
        author: user ? (commentAuthor.trim() || user.username) : (commentAuthor.trim() || null)
      }
      
      const comment = await API.addComment(id, commentData)
      setComments([...comments, comment])
      setNewComment('')
      setCommentAuthor('')
      
      // Update post comment count
      setPost({ ...post, commentCount: post.commentCount + 1 })
    } catch (err) {
      setError(err.error || 'Error adding comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editCommentText.trim()) return
    
    try {
      const updatedComment = await API.updateComment(commentId, { text: editCommentText.trim() })
      setComments(comments.map(c => c.id === commentId ? updatedComment : c))
      setEditingComment(null)
      setEditCommentText('')
    } catch (err) {
      setError(err.error || 'Error updating comment')
    }
  }

  const handleDeletePost = async () => {
    try {
      await API.deletePost(id)
      navigate('/')
    } catch (err) {
      setError(err.error || 'Error deleting post')
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await API.deleteComment(commentId)
      setComments(comments.filter(c => c.id !== commentId))
      setPost({ ...post, commentCount: post.commentCount - 1 })
      setShowDeleteModal(false)
      setDeleteTarget(null)
    } catch (err) {
      setError(err.error || 'Error deleting comment')
    }
  }

  const handleToggleInteresting = async (commentId) => {
    if (!user) return
    
    try {
      const updatedComment = await API.toggleInteresting(commentId)
      setComments(comments.map(c => c.id === commentId ? updatedComment : c))
    } catch (err) {
      setError(err.error || 'Error updating interesting flag')
    }
  }

  const canEditPost = () => {
    return user && (user.username === post?.author || user.role === 'admin')
  }

  const canEditComment = (comment) => {
    return user && (user.username === comment.author || user.role === 'admin')
  }

  const isCommentInteresting = (comment) => {
    return user && comment.interestingUsers.includes(user.username)
  }

  const canAddComment = () => {
    return !post?.maxComments || comments.length < post.maxComments
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!post) {
    return (
      <Alert variant="danger">
        Post not found.
        <Button variant="link" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </Alert>
    )
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/')}>
        ← Back to Posts
      </Button>
      
      {/* Post Card */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">{post.title}</h5>
            <small className="text-muted">
              by {post.author}
              {post.author === 'admin' && (
                <Badge bg="danger" className="ms-1">Admin</Badge>
              )}
              {' • '} {post.createdAt}
              {post.createdAt !== post.updatedAt && (
                <span className="text-muted"> (edited: {post.updatedAt})</span>
              )}
            </small>
          </div>
          
          {canEditPost() && (
            <div>
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => navigate(`/edit/${post.id}`)}
              >
                Edit
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  setDeleteTarget({ type: 'post', id: post.id })
                  setShowDeleteModal(true)
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </Card.Header>
        
        <Card.Body>
          <Card.Text style={{ whiteSpace: 'pre-wrap' }}>
            {post.text}
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
          </div>
        </Card.Body>
      </Card>

      {/* Comment Form */}
      {canAddComment() ? (
        <Card className="mb-4">
          <Card.Header>
            <h6>Add a Comment</h6>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmitComment}>
              {!user && (
                <Form.Group className="mb-3">
                  <Form.Label>Name (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    value={commentAuthor}
                    onChange={(ev) => setCommentAuthor(ev.target.value)}
                    placeholder="Leave empty to comment anonymously"
                  />
                </Form.Group>
              )}
              
              {user && (
                <Form.Group className="mb-3">
                  <Form.Label>Comment as</Form.Label>
                  <Form.Control
                    type="text"
                    value={commentAuthor || user.username}
                    onChange={(ev) => setCommentAuthor(ev.target.value)}
                    placeholder={user.username}
                  />
                  <Form.Text className="text-muted">
                    Leave empty to use your username
                  </Form.Text>
                </Form.Group>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label>Comment *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newComment}
                  onChange={(ev) => setNewComment(ev.target.value)}
                  required
                  placeholder="Write your comment here..."
                />
              </Form.Group>
              
              <Button 
                type="submit" 
                variant="primary" 
                disabled={submittingComment || !newComment.trim()}
              >
                {submittingComment ? 'Adding...' : 'Add Comment'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Alert variant="warning" className="mb-4">
          This post has reached its maximum number of comments ({post.maxComments}).
        </Alert>
      )}

      {/* Comments */}
      <h5>Comments ({comments.length})</h5>
      {comments.length === 0 ? (
        <Alert variant="info">No comments yet. Be the first to comment!</Alert>
      ) : (
        comments.map(comment => (
          <Card 
            key={comment.id} 
            className={`comment-card ${comment.interestingCount > 0 ? 'interesting' : ''}`}
          >
            <Card.Body>
              {editingComment === comment.id ? (
                <Form onSubmit={(e) => { e.preventDefault(); handleEditComment(comment.id); }}>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={editCommentText}
                    onChange={(ev) => setEditCommentText(ev.target.value)}
                    required
                  />
                  <div className="mt-2">
                    <Button 
                      type="submit" 
                      variant="success" 
                      size="sm" 
                      className="me-2"
                      disabled={!editCommentText.trim()}
                    >
                      Save
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        setEditingComment(null)
                        setEditCommentText('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </Form>
              ) : (
                <>
                  <Card.Text style={{ whiteSpace: 'pre-wrap' }}>
                    {comment.text}
                  </Card.Text>
                  
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <small className="text-muted">
                        by <span className={comment.author === 'Anonymous' ? 'anonymous-author' : ''}>
                          {comment.author}
                        </span>
                        {' • '} {comment.createdAt}
                        {comment.createdAt !== comment.updatedAt && (
                          <span> (edited: {comment.updatedAt})</span>
                        )}
                      </small>
                      
                      {comment.interestingCount > 0 && (
                        <Badge bg="warning" text="dark" className="ms-2 interesting-badge">
                          ⭐ {comment.interestingCount} interesting
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      {user && (
                        <Button
                          variant={isCommentInteresting(comment) ? "warning" : "outline-warning"}
                          size="sm"
                          className="me-2"
                          onClick={() => handleToggleInteresting(comment.id)}
                        >
                          ⭐ {isCommentInteresting(comment) ? 'Interesting' : 'Mark Interesting'}
                        </Button>
                      )}
                      
                      {canEditComment(comment) && (
                        <>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => {
                              setEditingComment(comment.id)
                              setEditCommentText(comment.text)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget({ type: 'comment', id: comment.id })
                              setShowDeleteModal(true)
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        ))
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
          {deleteTarget?.type === 'post' && (
            <div className="mt-2">
              <strong>Warning:</strong> This will also delete all comments on this post.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={() => {
              if (deleteTarget?.type === 'post') {
                handleDeletePost()
              } else {
                handleDeleteComment(deleteTarget.id)
              }
            }}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default PostDetail
