// src/components/DocumentViewer.jsx
import { useState, useRef, useEffect } from 'react';
import { 
  Container,
  Row,
  Col,
  Card,
  Button,
  Tabs,
  Tab,
  Form,
  Stack,
  Toast,
  ToastContainer,
  Modal,
  Accordion,
  Badge,
  Alert
} from 'react-bootstrap';
import { saveAs } from 'file-saver';
import { updateDocument, getDocumentHistory } from '../services/api';

const DocumentViewer = ({ conversationId, optimizedResume, coverLetter, onDocumentsUpdate }) => {
  const [activeTab, setActiveTab] = useState('resume');
  const [isEditing, setIsEditing] = useState(false);
  const [editedResume, setEditedResume] = useState(optimizedResume);
  const [editedCoverLetter, setEditedCoverLetter] = useState(coverLetter);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '', variant: 'success' });
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [revisionsError, setRevisionsError] = useState(null);
  const resumeRef = useRef();
  const coverLetterRef = useRef();

  const handleExportTxt = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${filename}.txt`);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedResume(optimizedResume);
    setEditedCoverLetter(coverLetter);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const showToastMessage = (title, description, variant) => {
    setToastMessage({ title, description, variant });
    setShowToast(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const documentType = activeTab === 'resume' ? 'resume' : 'cover_letter';
      const content = activeTab === 'resume' ? editedResume : editedCoverLetter;
      
      const response = await updateDocument(
        conversationId,
        documentType,
        content
      );
      
      if (onDocumentsUpdate) {
        onDocumentsUpdate({
          optimizedResume: documentType === 'resume' ? content : optimizedResume,
          coverLetter: documentType === 'cover_letter' ? content : coverLetter
        });
      }
      
      setIsEditing(false);
      showToastMessage(
        'Success',
        `${documentType === 'resume' ? 'Resume' : 'Cover letter'} updated successfully.`,
        'success'
      );
    } catch (error) {
      console.error('Error updating document:', error);
      showToastMessage(
        'Error',
        `Failed to update document: ${error.response?.data?.detail || 'Unknown error'}`,
        'danger'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowRevisions = async () => {
    setShowRevisionsModal(true);
    await loadRevisions();
  };

  const loadRevisions = async () => {
    if (!conversationId) return;
    
    const documentType = activeTab === 'resume' ? 'resume' : 'cover_letter';
    setRevisionsLoading(true);
    setRevisionsError(null);
    
    try {
      const response = await getDocumentHistory(conversationId, documentType);
      setRevisions(response.revisions || []);
    } catch (error) {
      console.error('Error loading revisions:', error);
      setRevisionsError('Failed to load document revisions. Please try again.');
    } finally {
      setRevisionsLoading(false);
    }
  };

  const handleRestoreRevision = (content) => {
    if (activeTab === 'resume') {
      setEditedResume(content);
    } else {
      setEditedCoverLetter(content);
    }
    
    setIsEditing(true);
    setShowRevisionsModal(false);
    showToastMessage(
      'Revision Loaded',
      'The selected revision has been loaded into the editor. Click Save to apply the changes.',
      'info'
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <Card className="shadow">
        <Card.Body className="p-4">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="resume" title="Optimized Resume">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Optimized Resume</h4>
                <Stack direction="horizontal" gap={2}>
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={handleCancel}>Cancel</Button>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={handleSave}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline-secondary" 
                        onClick={handleShowRevisions}
                      >
                        Revisions
                      </Button>
                      <Button size="sm" variant="secondary" onClick={handleEdit}>Edit</Button>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => handleExportTxt(optimizedResume, 'optimized_resume')}
                      >
                        Export as TXT
                      </Button>
                    </>
                  )}
                </Stack>
              </div>
              
              <div 
                ref={resumeRef} 
                className="p-3 border rounded bg-light"
                style={{ minHeight: '400px', overflowY: 'auto' }}
              >
                {isEditing ? (
                  <Form.Control
                    as="textarea"
                    value={editedResume}
                    onChange={(e) => setEditedResume(e.target.value)}
                    style={{ height: '400px', resize: 'vertical' }}
                  />
                ) : (
                  <div>
                    {optimizedResume.split('\n').map((paragraph, index) => (
                      <p key={index} className={paragraph.trim() === '' ? 'm-0' : 'mb-2'}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </Tab>
            
            <Tab eventKey="coverLetter" title="Cover Letter">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Cover Letter</h4>
                <Stack direction="horizontal" gap={2}>
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={handleCancel}>Cancel</Button>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={handleSave}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline-secondary" 
                        onClick={handleShowRevisions}
                      >
                        Revisions
                      </Button>
                      <Button size="sm" variant="secondary" onClick={handleEdit}>Edit</Button>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => handleExportTxt(coverLetter, 'cover_letter')}
                      >
                        Export as TXT
                      </Button>
                    </>
                  )}
                </Stack>
              </div>
              
              <div 
                ref={coverLetterRef} 
                className="p-3 border rounded bg-light"
                style={{ minHeight: '400px', overflowY: 'auto' }}
              >
                {isEditing ? (
                  <Form.Control
                    as="textarea"
                    value={editedCoverLetter}
                    onChange={(e) => setEditedCoverLetter(e.target.value)}
                    style={{ height: '400px', resize: 'vertical' }}
                  />
                ) : (
                  <div>
                    {coverLetter.split('\n').map((paragraph, index) => (
                      <p key={index} className={paragraph.trim() === '' ? 'm-0' : 'mb-2'}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>

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
            <Toast.Body className={toastMessage.variant === 'success' ? 'text-white' : ''}>
              {toastMessage.description}
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </Card>

      {/* Revisions Modal */}
      <Modal 
        show={showRevisionsModal} 
        onHide={() => setShowRevisionsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {activeTab === 'resume' ? 'Resume' : 'Cover Letter'} Revision History
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {revisionsError && (
            <Alert variant="danger">{revisionsError}</Alert>
          )}

          {revisionsLoading ? (
            <div className="text-center my-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading revisions...</p>
            </div>
          ) : revisions.length > 0 ? (
            <Accordion>
              {revisions.map((revision, index) => (
                <Accordion.Item key={revision.id} eventKey={revision.id}>
                  <Accordion.Header>
                    <div className="d-flex w-100 justify-content-between align-items-center">
                      <span>
                        {index === 0 ? 'Current Version' : `Version ${revisions.length - index}`} - 
                        {' '}{formatDate(revision.timestamp)}
                      </span>
                      {index > 0 && (
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreRevision(revision.content);
                          }}
                        >
                          Restore This Version
                        </Button>
                      )}
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <div className="border p-3 bg-light rounded">
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {revision.content}
                      </pre>
                    </div>
                    {revision.feedback && (
                      <div className="mt-3">
                        <h6>Changes based on:</h6>
                        <div className="border p-2 rounded">
                          {revision.feedback}
                        </div>
                      </div>
                    )}
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          ) : (
            <div className="text-center my-4">
              <p>No revision history found for this document.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRevisionsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DocumentViewer;
