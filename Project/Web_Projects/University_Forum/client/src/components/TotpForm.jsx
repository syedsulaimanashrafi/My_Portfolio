import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function TotpForm({ verifyTotp }) {
  const [totpCode, setTotpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const doTotpVerify = () => {
    verifyTotp(totpCode)
      .then(() => {
        setErrorMessage('');
        navigate('/');
      })
      .catch(() => {
        // NB: Generic error message
        setErrorMessage('Wrong code, please try again');
      })
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrorMessage('');

    // Some validation
    let valid = true;
    if (totpCode === '' || totpCode.length !== 6)
      valid = false;
    
    if (valid) {
      doTotpVerify(totpCode);
    } else {
      setErrorMessage('Invalid content in form: either empty or not 6-char long');
    }
  };
  
  return (
    <Container>
      <Row>
        <Col xs={3}></Col>
        <Col xs={6}>
          <h2>Second Factor Authentication</h2>
          <h5>Please enter the code that you read on your device</h5>
          <Form onSubmit={handleSubmit}>
            {errorMessage ? <Alert variant='danger' dismissible onClick={() => setErrorMessage('')}>{errorMessage}</Alert> : ''}
            <Form.Group controlId='totpCode'>
              <Form.Label>Code</Form.Label>
              <Form.Control type='text' value={totpCode} onChange={ev => setTotpCode(ev.target.value)} />
            </Form.Group>
            <Button className='my-2' type='submit'>Validate</Button>
            <Button className='my-2 mx-2' variant='danger' onClick={() => navigate('/')}>Cancel</Button>
          </Form>
        </Col>
        <Col xs={3}></Col>
      </Row>
    </Container>
  )
}

export default TotpForm
