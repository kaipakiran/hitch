// src/components/PersonalSummaryInput.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';

const PersonalSummaryInput = ({ 
  personalSummary, 
  setPersonalSummary, 
  onBack, 
  onSubmit, 
  isLoading 
}) => {
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    if (!personalSummary || personalSummary.trim().length < 30) {
      setValidationError('Please enter your personal summary (at least 30 characters).');
      return;
    }
    
    setValidationError('');
    onSubmit();
  };

  const handlePaste = () => {
    try {
      navigator.clipboard.readText().then(text => {
        if (text) {
          setPersonalSummary(text);
          console.log('Personal summary pasted from clipboard.');
        }
      });
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      console.error('Unable to access clipboard. Please paste manually.');
    }
  };

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h2>Personal Summary</h2>
          <p>Tell us a bit about yourself and your career goals</p>
        </Col>
      </Row>

      {validationError && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger">
              {validationError}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Form.Group>
            <Form.Label>Personal Summary</Form.Label>
            <Form.Control
              as="textarea"
              value={personalSummary}
              onChange={(e) => setPersonalSummary(e.target.value)}
              placeholder="Describe your background, skills, and career goals..."
              style={{ height: '300px' }}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col>
          <Button 
            variant="outline-secondary" 
            onClick={onBack} 
            disabled={isLoading}
            className="me-2"
          >
            Back
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={handlePaste} 
            disabled={isLoading}
            className="me-2"
          >
            Paste from Clipboard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : 'Submit'}
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default PersonalSummaryInput;
