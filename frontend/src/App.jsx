// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import InputPage from './pages/InputPage';
import ResultsPage from './pages/ResultsPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';
// import HomePage from './pages/HomePage';   

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="danger">
          <Alert.Heading>Something went wrong</Alert.Heading>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <hr />
          <pre className="mb-0" style={{ overflow: 'auto', maxHeight: '200px' }}>
            {this.state.error?.stack}
          </pre>
        </Alert>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Container className="py-4">
          <Routes>
            {/* <Route path="/" element={<InputPage />} /> */}
            <Route path="/" element={<InputPage />} />
            <Route path="/input" element={<InputPage />} />
            <Route path="/results" element={<ResultsPage />} />
            {/* Add a route for index.html that redirects to the root */}
            <Route path="/index.html" element={<Navigate to="/" replace />} />
            {/* Catch-all route for any unmatched routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
