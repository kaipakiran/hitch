import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Card, Accordion, Badge } from 'react-bootstrap';
import { getDocumentHistory } from '../services/api';

// Helper function for date formatting
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

export default function DocumentHistory({ conversationId, documentType, onRestoreVersion }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState([]);

  const documentTitle = documentType === 'resume' ? 'Resume' : 'Cover Letter';

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const history = await getDocumentHistory(conversationId, documentType);
        setRevisions(history.revisions);
        setError('');
      } catch (err) {
        setError('Failed to load revision history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [conversationId, documentType]);

  const handleRestoreVersion = (content) => {
    onRestoreVersion(content);
  };

  const handleCompareToggle = (revisionId) => {
    if (compareVersions.includes(revisionId)) {
      setCompareVersions(compareVersions.filter(id => id !== revisionId));
    } else {
      if (compareVersions.length < 2) {
        setCompareVersions([...compareVersions, revisionId]);
      } else {
        // Replace the oldest selection
        setCompareVersions([compareVersions[1], revisionId]);
      }
    }
  };

  const getCompareContent = () => {
    if (compareVersions.length !== 2) return null;
    
    const v1 = revisions.find(r => r.id === compareVersions[0]);
    const v2 = revisions.find(r => r.id === compareVersions[1]);
    
    if (!v1 || !v2) return null;
    
    return (
      <Card className="mt-4">
        <Card.Header as="h5">Comparing Versions</Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Version from {formatDate(v1.timestamp)}</h6>
              <div className="border p-2 bg-light" style={{ maxHeight: '300px', overflow: 'auto' }}>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{v1.content}</pre>
              </div>
            </Col>
            <Col md={6}>
              <h6>Version from {formatDate(v2.timestamp)}</h6>
              <div className="border p-2 bg-light" style={{ maxHeight: '300px', overflow: 'auto' }}>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{v2.content}</pre>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  if (loading) {
    return <div className="text-center p-4">Loading revision history...</div>;
  }

  if (error) {
    return <div className="text-danger p-4">{error}</div>;
  }

  if (revisions.length === 0) {
    return <div className="text-center p-4">No revision history available.</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>{documentTitle} Revision History</h5>
        <Button
          variant={compareMode ? "primary" : "outline-primary"}
          size="sm"
          onClick={() => {
            setCompareMode(!compareMode);
            setCompareVersions([]);
          }}
        >
          {compareMode ? "Exit Compare" : "Compare Versions"}
        </Button>
      </div>
      
      <hr />
      
      <Accordion>
        {revisions.map((revision, index) => (
          <Accordion.Item key={revision.id} eventKey={revision.id}>
            <Accordion.Header>
              <div className="d-flex justify-content-between w-100 me-3">
                <span>
                  {index === revisions.length - 1 ? 'Current Version' : `Version ${index + 1}`} - 
                  {' '}{formatDate(revision.timestamp)}
                </span>
                <div>
                  {compareMode && (
                    <Badge
                      bg={compareVersions.includes(revision.id) ? "primary" : "secondary"}
                      className="me-2"
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompareToggle(revision.id);
                      }}
                    >
                      {compareVersions.includes(revision.id) ? "Selected" : "Select"}
                    </Badge>
                  )}
                  
                  {!compareMode && index < revisions.length - 1 && (
                    <Button 
                      size="sm" 
                      variant="outline-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreVersion(revision.content);
                      }}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              <div>
                {revision.message && (
                  <div className="mb-3">
                    <small className="text-muted">
                      Changes based on: {revision.message.content}
                    </small>
                  </div>
                )}
                <h6>Feedback/Request:</h6>
                <div className="p-2 mb-3 bg-light border rounded">
                  {revision.feedback || "No feedback recorded"}
                </div>
                
                <h6>Content:</h6>
                <div className="p-2 bg-light border rounded" style={{ maxHeight: '300px', overflow: 'auto' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{revision.content}</pre>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>
      
      {compareMode && compareVersions.length === 2 && getCompareContent()}
    </div>
  );
} 