import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Tabs, Tab, Modal } from 'react-bootstrap';
import { updateDocument } from '../services/api';
import DocumentHistory from './DocumentHistory';

export default function DocumentEditor({
  conversationId,
  optimizedResume,
  coverLetter,
  onDocumentUpdate
}) {
  const [activeTab, setActiveTab] = useState('resume');
  const [resumeContent, setResumeContent] = useState(optimizedResume || '');
  const [coverLetterContent, setCoverLetterContent] = useState(coverLetter || '');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeHistoryType, setActiveHistoryType] = useState('resume');
  
  // Update local state when props change
  useEffect(() => {
    if (optimizedResume) setResumeContent(optimizedResume);
    if (coverLetter) setCoverLetterContent(coverLetter);
  }, [optimizedResume, coverLetter]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleSaveResume = async () => {
    try {
      await updateDocument({
        conversation_id: conversationId,
        document_type: 'resume',
        content: resumeContent
      });
      onDocumentUpdate('resume', resumeContent);
    } catch (error) {
      console.error('Error saving resume:', error);
    }
  };

  const handleSaveCoverLetter = async () => {
    try {
      await updateDocument({
        conversation_id: conversationId,
        document_type: 'cover_letter',
        content: coverLetterContent
      });
      onDocumentUpdate('cover_letter', coverLetterContent);
    } catch (error) {
      console.error('Error saving cover letter:', error);
    }
  };

  const handleShowHistory = (type) => {
    setActiveHistoryType(type);
    setShowHistoryModal(true);
  };

  const handleRestoreVersion = (content) => {
    if (activeHistoryType === 'resume') {
      setResumeContent(content);
    } else {
      setCoverLetterContent(content);
    }
    setShowHistoryModal(false);
  };

  return (
    <Container className="p-0">
      <Tabs
        activeKey={activeTab}
        onSelect={handleTabChange}
        className="mb-3"
      >
        <Tab eventKey="resume" title="Resume">
          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <h4>Optimized Resume</h4>
              <div>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => handleShowHistory('resume')}
                  className="me-2"
                >
                  History
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveResume}
                >
                  Save
                </Button>
              </div>
            </Col>
          </Row>
          
          <Row>
            <Col>
              <Form.Control
                as="textarea"
                value={resumeContent}
                onChange={(e) => setResumeContent(e.target.value)}
                style={{ height: '500px' }}
              />
            </Col>
          </Row>
        </Tab>
        
        <Tab eventKey="cover_letter" title="Cover Letter">
          <Row className="mb-3">
            <Col className="d-flex justify-content-between align-items-center">
              <h4>Cover Letter</h4>
              <div>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => handleShowHistory('cover_letter')}
                  className="me-2"
                >
                  History
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSaveCoverLetter}
                >
                  Save
                </Button>
              </div>
            </Col>
          </Row>
          
          <Row>
            <Col>
              <Form.Control
                as="textarea"
                value={coverLetterContent}
                onChange={(e) => setCoverLetterContent(e.target.value)}
                style={{ height: '500px' }}
              />
            </Col>
          </Row>
        </Tab>
      </Tabs>
      
      {/* Document History Modal */}
      <Modal 
        show={showHistoryModal} 
        onHide={() => setShowHistoryModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {activeHistoryType === 'resume' ? 'Resume' : 'Cover Letter'} Revision History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <DocumentHistory
            conversationId={conversationId}
            documentType={activeHistoryType}
            onRestoreVersion={handleRestoreVersion}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
} 