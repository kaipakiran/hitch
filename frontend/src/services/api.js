import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Process job application data
export const processApplication = async (jobDescription, resume, personalSummary) => {
  try {
    const response = await axios.post(`${API_URL}/process`, {
      job_description: jobDescription,
      resume: resume,
      personal_summary: personalSummary
    });
    return response.data;
  } catch (error) {
    console.error('API Error processing application:', error.response?.data || error.message);
    throw error;
  }
};

// Get conversation data by ID
export const getConversationData = async (conversationId) => {
  try {
    const response = await axios.get(`${API_URL}/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('API Error fetching conversation:', error.response?.data || error.message);
    throw error;
  }
};

// Send a message in a conversation
export const sendMessage = async (conversationId, message) => {
  try {
    const response = await axios.post(`${API_URL}/chat`, {
      conversation_id: conversationId,
      message: message
    });
    console.log('API: Send message response', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error sending message:', error.response?.data || error.message);
    throw error;
  }
};

// Get list of conversations/past applications
export const getConversationsList = async () => {
  try {
    const response = await axios.get(`${API_URL}/conversations`);
    return response.data;
  } catch (error) {
    console.error('API Error fetching conversations list:', error.response?.data || error.message);
    throw error;
  }
};

// Update document content
export const updateDocument = async (conversationId, documentType, content) => {
  try {
    const response = await axios.post(`${API_URL}/update`, {
      conversation_id: conversationId,
      document_type: documentType,
      content: content
    });
    return response.data;
  } catch (error) {
    console.error('API Error updating document:', error.response?.data || error.message);
    throw error;
  }
};

// Get document revision history
export const getDocumentHistory = async (conversationId, documentType) => {
  try {
    const response = await axios.get(
      `${API_URL}/document_history/${conversationId}/${documentType}`
    );
    return response.data;
  } catch (error) {
    console.error('API Error fetching document history:', error.response?.data || error.message);
    throw error;
  }
};