# Backend Documentation

## Overview

This backend serves a job application assistant that uses AI to help users optimize their resumes and create cover letters tailored to specific job descriptions. The system is built using FastAPI, SQLite, and LangGraph with Google's Gemini AI models.

## Features

- Process job descriptions and resumes to create optimized versions
- Generate tailored cover letters based on job requirements
- Maintain conversation history with AI assistant
- Update resumes and cover letters based on user feedback
- Persistent storage of conversations and documents

## Requirements

- Python 3.9+
- Google API key for Gemini models
- Required Python packages (see Installation)

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with your Google API key:

```bash
GOOGLE_API_KEY=<your_google_api_key>
```

## Usage

1. Start the FastAPI server:

```bash
uvicorn server:app --reload
```

2. Make API requests using the following endpoints:

### Process Job Application

```bash
curl -X POST "http://localhost:8000/api/process" \
     -H "Content-Type: application/json" \
     -d '{"job_description": "Software Engineer", "resume": "...", "personal_summary": "..."}'
```

### Chat with AI Assistant

```bash
curl -X POST "http://localhost:8000/api/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "...", "conversation_id": "..."}'
```

### Update Resume or Cover Letter

```bash
curl -X POST "http://localhost:8000/api/update" \
     -H "Content-Type: application/json" \
     -d '{"conversation_id": "...", "update_type": "resume", "feedback": "..."}'
```

### Get Documents

```bash
curl -X GET "http://localhost:8000/api/documents/{conversation_id}"
```

### List Conversations

```bash
curl -X GET "http://localhost:8000/api/conversations"
```

### Delete Conversation

```bash
curl -X DELETE "http://localhost:8000/api/conversations/{conversation_id}"
```

### Get Conversation

```bash
curl -X GET "http://localhost:8000/api/conversations/{conversation_id}"
```

