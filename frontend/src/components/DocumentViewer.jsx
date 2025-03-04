// src/components/DocumentViewer.jsx
import { useState, useRef } from 'react';
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
  ToastContainer
} from 'react-bootstrap';
import { saveAs } from 'file-saver';
import { updateDocument } from '../services/api';

const DocumentViewer = ({ conversationId, optimizedResume, coverLetter, onDocumentsUpdate }) => {
  const [activeTab, setActiveTab] = useState('resume');
  const [isEditing, setIsEditing] = useState(false);
  const [editedResume, setEditedResume] = useState(optimizedResume);
  const [editedCoverLetter, setEditedCoverLetter] = useState(coverLetter);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', description: '', variant: 'success' });
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
      const updateType = activeTab === 'resume' ? 'resume' : 'cover_letter';
      const feedback = `Please update the ${updateType === 'resume' ? 'resume' : 'cover letter'} to match exactly: ${activeTab === 'resume' ? editedResume : editedCoverLetter}`;
      
      const response = await updateDocument(conversationId, updateType, feedback);
      
      if (onDocumentsUpdate) {
        onDocumentsUpdate({
          optimizedResume: response.optimized_resume,
          coverLetter: response.cover_letter
        });
      }
      
      setIsEditing(false);
      showToastMessage(
        'Success',
        `${updateType === 'resume' ? 'Resume' : 'Cover letter'} updated successfully.`,
        'success'
      );
    } catch (error) {
      console.error('Error updating document:', error);
      showToastMessage(
        'Error',
        'Failed to update document. Please try again.',
        'danger'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
          <Toast.Body>{toastMessage.description}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Card>
  );
};

export default DocumentViewer;
