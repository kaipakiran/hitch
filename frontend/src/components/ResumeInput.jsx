// src/components/ResumeInput.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';

const ResumeInput = ({ resume, setResume, onNext, onBack }) => {
  const [validationError, setValidationError] = useState('');

  const handleNext = () => {
    if (!resume || resume.trim().length < 50) {
      setValidationError('Please enter your resume (at least 50 characters).');
      return;
    }
    
    setValidationError('');
    onNext();
  };

  const handlePaste = () => {
    try {
      navigator.clipboard.readText().then(text => {
        if (text) {
          setResume(text);
          console.log('Resume pasted from clipboard.');
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
          <h2>Your Resume</h2>
          <p>Paste your current resume</p>
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
            <Form.Label>Resume</Form.Label>
            <Form.Control
              as="textarea"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume here..."
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
            className="me-2"
          >
            Back
          </Button>
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

export default ResumeInput;
