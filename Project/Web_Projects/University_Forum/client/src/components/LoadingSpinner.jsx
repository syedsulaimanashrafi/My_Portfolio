import { Spinner, Container } from 'react-bootstrap'

function LoadingSpinner() {
  return (
    <Container>
      <div className="loading-container">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <div className="mt-2">Loading...</div>
        </div>
      </div>
    </Container>
  )
}

export default LoadingSpinner
