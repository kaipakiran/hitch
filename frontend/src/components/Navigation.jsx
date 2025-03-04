// src/components/Navigation.jsx
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Navbar bg="light" expand="lg" className="border-bottom mb-3">
      <Container>
        <Navbar.Brand className="text-primary fw-bold">Job Application Assistant</Navbar.Brand>
        <Nav className="ms-auto">
          <div className="d-flex gap-2">
            <Button 
              variant={location.pathname === '/' ? 'primary' : 'outline-primary'} 
              onClick={() => navigate('/')}
            >
              Input
            </Button>
            <Button 
              variant={location.pathname === '/results' ? 'primary' : 'outline-primary'} 
              onClick={() => navigate('/results')}
              disabled={!localStorage.getItem('conversationId')}
            >
              Results
            </Button>
          </div>
        </Nav>
      </Container>
    </Navbar>
  );
};

export default Navigation;
