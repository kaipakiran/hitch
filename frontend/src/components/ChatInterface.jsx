// src/components/ChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, Card, InputGroup } from 'react-bootstrap';

const ChatInterface = ({ messages = [], onSendMessage }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(inputMessage);
      setInputMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container className="p-0">
      <Row>
        <Col>
          {/* Messages container */}
          <div 
            className="p-3 border rounded mb-3" 
            style={{ 
              height: '400px', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-muted my-auto">
                Start chatting with the AI assistant. Ask for suggestions on your resume or cover letter.
              </div>
            ) : (
              <div>
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`d-flex ${msg.role === 'human' ? 'justify-content-end' : 'justify-content-start'} mb-3`}
                  >
                    <Card 
                      style={{ 
                        maxWidth: '80%',
                        backgroundColor: msg.role === 'human' ? '#e3f2fd' : '#f5f5f5' 
                      }}
                    >
                      <Card.Body className="p-2">
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                          {msg.content}
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Input area */}
          <InputGroup>
            <Form.Control
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            />
            <Button 
              variant="primary" 
              onClick={handleSendMessage}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </InputGroup>
        </Col>
      </Row>
    </Container>
  );
};

export default ChatInterface;
