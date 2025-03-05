// src/pages/InputPage.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Card, Alert, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import JobDescriptionInput from '../components/JobDescriptionInput';
import ResumeInput from '../components/ResumeInput';
import PersonalSummaryInput from '../components/PersonalSummaryInput';
import { processApplication } from '../services/api';

const InputPage = () => {
  const [step, setStep] = useState(1);
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [personalSummary, setPersonalSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleNext = () => {
    setStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setStep(prevStep => prevStep - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await processApplication(jobDescription, resume, personalSummary);
      
      if (response && response.conversation_id) {
        navigate(`/results?conversation_id=${response.conversation_id}`);
      } else {
        setError('Server returned an invalid response. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Failed to process your application. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress percentage
  const progress = (step / 3) * 100;
  
  // Step titles
  const stepTitles = [
    "Job Description",
    "Your Resume",
    "Personal Summary"
  ];

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8} md={10}>
          <Card className="shadow border-0">
            <Card.Header className="bg-primary text-white py-3">
              <h3 className="mb-0">Job Application Assistant</h3>
            </Card.Header>
            
            <Card.Body className="p-4">
              {/* Progress indicator */}
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-bold">Step {step} of 3: {stepTitles[step-1]}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <ProgressBar now={progress} animated variant="success" />
              </div>
              
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}
              
              {step === 1 && (
                <JobDescriptionInput 
                  jobDescription={jobDescription}
                  setJobDescription={setJobDescription}
                  onNext={handleNext}
                />
              )}
              
              {step === 2 && (
                <ResumeInput 
                  resume={resume}
                  setResume={setResume}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              )}
              
              {step === 3 && (
                <PersonalSummaryInput 
                  personalSummary={personalSummary}
                  setPersonalSummary={setPersonalSummary}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              )}
            </Card.Body>
            
            <Card.Footer className="bg-light border-0 p-3">
              <div className="d-flex justify-content-center">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s}
                    className={`mx-2 rounded-circle d-flex align-items-center justify-content-center
                      ${s === step ? 'bg-primary text-white' : s < step ? 'bg-success text-white' : 'bg-light'}
                      ${s <= step ? 'border-0' : 'border'}`}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      transition: 'all 0.3s ease',
                      boxShadow: s === step ? '0 0 10px rgba(0,123,255,0.5)' : 'none'
                    }}
                  >
                    {s < step ? '✓' : s}
                  </div>
                ))}
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default InputPage;
