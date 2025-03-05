import React, { useState, useEffect } from 'react';
import { 
  Offcanvas, 
  Button, 
  ListGroup, 
  Spinner, 
  Badge,
  Alert
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getConversationsList } from '../services/api';

const NavigationMenu = () => {
  const [show, setShow] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true);
    loadConversations();
  };

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConversationsList();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load past applications:', err);
      setError('Failed to load past applications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversationId) => {
    navigate(`/results?conversation_id=${conversationId}`);
    handleClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <Button 
        variant="outline-secondary" 
        onClick={handleShow} 
        className="me-2"
        aria-label="Menu"
      >
        <i className="bi bi-list"></i> {/* You may need to add Bootstrap Icons */}
      </Button>

      <Offcanvas show={show} onHide={handleClose} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Past Applications</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading applications...</p>
            </div>
          ) : conversations.length > 0 ? (
            <ListGroup>
              {conversations.map((conversation) => (
                <ListGroup.Item 
                  key={conversation.id}
                  action
                  onClick={() => handleConversationSelect(conversation.id)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <div className="fw-bold">{conversation.job_title || 'Untitled Application'}</div>
                    <small className="text-muted">
                      Created: {formatDate(conversation.created_at)}
                    </small>
                  </div>
                  <Badge bg="primary" pill>
                    {conversation.revisions_count || 0} revisions
                  </Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="text-center my-5">
              <p>No past applications found.</p>
              <Button 
                variant="primary"
                onClick={() => {
                  navigate('/');
                  handleClose();
                }}
              >
                Create New Application
              </Button>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default NavigationMenu; 