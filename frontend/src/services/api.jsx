// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const processApplication = async (jobDescription, resume, personalSummary) => {
  try {
    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_description: jobDescription,
        resume: resume,
        personal_summary: personalSummary,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process application');
    }

    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

export const sendChatMessage = async (message, conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

export const updateDocument = async (conversationId, updateType, feedback) => {
  try {
    const response = await fetch(`${API_BASE_URL}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        update_type: updateType,
        feedback,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${updateType}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};

export const getDocuments = async (conversationId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${conversationId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get documents');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};
