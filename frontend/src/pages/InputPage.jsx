// src/pages/InputPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row,
  Col,
  Card,
  Button,
  Form,
  Spinner,
  Toast,
  ToastContainer,
  ProgressBar
} from 'react-bootstrap';
import JobDescriptionInput from '../components/JobDescriptionInput';
import ResumeInput from '../components/ResumeInput';
import PersonalSummaryInput from '../components/PersonalSummaryInput';
import { processApplication } from '../services/api';

const steps = [
  { title: 'Job Description', description: 'Enter job details' },
  { title: 'Resume', description: 'Enter your resume' },
  { title: 'Personal Summary', description: 'Tell us about yourself' },
];

const InputPage = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [personalSummary, setPersonalSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '', variant: 'success' });
  const navigate = useNavigate();

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const showToastMessage = (title, description, variant) => {
    setToastMessage({ title, description, variant });
    setShowToast(true);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await processApplication(jobDescription, resume, personalSummary);
      
      // Save conversation ID and initial documents to localStorage
      localStorage.setItem('conversationId', response.conversation_id);
      localStorage.setItem('optimizedResume', response.optimized_resume);
      localStorage.setItem('coverLetter', response.cover_letter);
      
      showToastMessage(
        'Success',
        'Your application has been processed successfully.',
        'success'
      );
      
      // Navigate to results page
      navigate('/results');
    } catch (error) {
      console.error('Error processing application:', error);
      showToastMessage(
        'Error',
        'Failed to process your application. Please try again.',
        'danger'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col className="text-center">
          <h1 className="mb-2">Job Application Assistant</h1>
          <p className="text-muted">Optimize your resume and create a personalized cover letter</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <ProgressBar now={(activeStep + 1) * (100/steps.length)} className="mb-3" />
          <div className="d-flex justify-content-between">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 ${activeStep >= index ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: '40px', height: '40px' }}>
                  {activeStep > index ? '✓' : index + 1}
                </div>
                <div>
                  <strong>{step.title}</strong>
                  <div className="small text-muted">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Body className="p-4">
          {activeStep === 0 && (
            <JobDescriptionInput 
              jobDescription={jobDescription} 
              setJobDescription={setJobDescription} 
              onNext={handleNext} 
            />
          )}
          
          {activeStep === 1 && (
            <ResumeInput 
              resume={resume} 
              setResume={setResume} 
              onNext={handleNext} 
              onBack={handleBack} 
            />
          )}
          
          {activeStep === 2 && (
            <PersonalSummaryInput 
              personalSummary={personalSummary} 
              setPersonalSummary={setPersonalSummary} 
              onBack={handleBack} 
              onSubmit={handleSubmit} 
              isLoading={isLoading} 
            />
          )}
        </Card.Body>
      </Card>

      <ToastContainer position="top-end" className="p-3">
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={3000} 
          autohide
          bg={toastMessage.variant}
        >
          <Toast.Header>
            <strong className="me-auto">{toastMessage.title}</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage.description}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default InputPage;
