// src/pages/ResultsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import DocumentViewer from '../components/DocumentViewer';
import ChatInterface from '../components/ChatInterface';
import { sendChatMessage, getConversation } from '../services/api';

const ResultsPage = () => {
  const [conversationId, setConversationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [optimizedResume, setOptimizedResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '', variant: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    // Get conversation ID from localStorage
    const storedConversationId = localStorage.getItem('conversationId');
    
    if (!storedConversationId) {
      // No conversation ID found, redirect to input page
      showToastMessage(
        'No active session',
        'Please start a new job application.',
        'warning'
      );
      navigate('/');
      return;
    }
    
    setConversationId(storedConversationId);
    
    // Load initial documents from localStorage
    const storedResume = localStorage.getItem('optimizedResume');
    const storedCoverLetter = localStorage.getItem('coverLetter');
    
    if (storedResume) setOptimizedResume(storedResume);
    if (storedCoverLetter) setCoverLetter(storedCoverLetter);
    
    setLoading(false);
  }, [navigate]);

  const showToastMessage = (title, description, variant) => {
    setToastMessage({ title, description, variant });
    setShowToast(true);
  };

  const handleSendMessage = async (message) => {
    if (!conversationId) return;
    
    try {
      // Optimistically update UI
      const newMessages = [...messages, { role: 'human', content: message }];
      setMessages(newMessages);
      
      // Send message to API
      const response = await sendChatMessage({
        conversation_id: conversationId,
        message
      });
      
      // Update with response
      setMessages([...newMessages, { role: 'ai', content: response.response }]);
      
      // Update documents if they changed
      if (response.optimized_resume) {
        setOptimizedResume(response.optimized_resume);
        localStorage.setItem('optimizedResume', response.optimized_resume);
      }
      
      if (response.cover_letter) {
        setCoverLetter(response.cover_letter);
        localStorage.setItem('coverLetter', response.cover_letter);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToastMessage(
        'Error',
        'Failed to send message. Please try again.',
        'danger'
      );
    }
  };

  const handleDocumentsUpdate = (documents) => {
    if (documents.optimizedResume) {
      setOptimizedResume(documents.optimizedResume);
      localStorage.setItem('optimizedResume', documents.optimizedResume);
    }
    
    if (documents.coverLetter) {
      setCoverLetter(documents.coverLetter);
      localStorage.setItem('coverLetter', documents.coverLetter);
    }
  };

  const handleStartNew = () => {
    // Clear localStorage and redirect to input page
    localStorage.removeItem('conversationId');
    localStorage.removeItem('optimizedResume');
    localStorage.removeItem('coverLetter');
    navigate('/');
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your documents...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h1 className="display-5">Your Job Application Documents</h1>
          <Button variant="primary" onClick={handleStartNew}>Start New Application</Button>
        </div>
        <p className="text-muted mt-2">
          Use the AI assistant to refine your documents or make edits directly
        </p>
      </div>
      
      <Row className="g-4">
        {/* Chat interface */}
        <Col lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h4 className="mb-3">AI Assistant</h4>
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
              />
            </Card.Body>
          </Card>
        </Col>
        
        {/* Document viewer */}
        <Col lg={6}>
          <DocumentViewer 
            conversationId={conversationId}
            optimizedResume={optimizedResume}
            coverLetter={coverLetter}
            onDocumentsUpdate={handleDocumentsUpdate}
          />
        </Col>
      </Row>

      <ToastContainer position="top-end" className="p-3">
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={5000} 
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

export default ResultsPage;
