import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Process a new job application
export const processApplication = async (input) => {
  try {
    const response = await axios.post(`${API_URL}/process`, input);
    return response.data;
  } catch (error) {
    console.error('Error processing application:', error);
    throw error;
  }
};

// Send a chat message
export const sendChatMessage = async (message) => {
  try {
    const response = await axios.post(`${API_URL}/chat`, message);
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// Update a document (resume or cover letter)
export const updateDocument = async (update) => {
  try {
    const response = await axios.post(`${API_URL}/update`, {
      conversation_id: update.conversation_id,
      document_type: update.document_type,
      content: update.content
    });
    return response.data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Get document history (new endpoint)
export const getDocumentHistory = async (conversationId, documentType) => {
  try {
    const response = await axios.get(`${API_URL}/document_history/${conversationId}/${documentType}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${documentType} history:`, error);
    throw error;
  }
};

// Get conversation details
export const getConversation = async (conversationId) => {
  try {
    const response = await axios.get(`${API_URL}/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
};

// Get all conversations
export const getConversations = async () => {
  try {
    const response = await axios.get(`${API_URL}/conversations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

// Delete a conversation
export const deleteConversation = async (conversationId) => {
  try {
    const response = await axios.delete(`${API_URL}/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}; 