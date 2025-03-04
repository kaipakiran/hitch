// src/components/JobDescriptionInput.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';

const JobDescriptionInput = ({ jobDescription, setJobDescription, onNext }) => {
  const [validationError, setValidationError] = useState('');
  
  const handleNext = () => {
    if (!jobDescription || jobDescription.trim().length < 20) {
      setValidationError('Please enter a detailed job description (at least 20 characters).');
      return;
    }
    
    setValidationError('');
    onNext();
  };

  const handlePaste = () => {
    try {
      navigator.clipboard.readText().then(text => {
        if (text) {
          setJobDescription(text);
          console.log('Job description pasted from clipboard.');
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
          <h2>Job Description</h2>
          <p>Paste the job description you're applying for</p>
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
            <Form.Label>Job Description</Form.Label>
            <Form.Control
              as="textarea"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              style={{ height: '300px' }}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col>
          <Button 
            variant="outline-primary" 
            onClick={handlePaste} 
            className="me-2"
          >
            Paste from Clipboard
          </Button>
          <Button 
            variant="primary" 
            onClick={handleNext}
          >
            Next
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default JobDescriptionInput;
