# Job Application Assistant

A React application built with Vite that helps users optimize their job applications by generating tailored resumes and cover letters based on job descriptions.

## Features

- Input job descriptions, resumes, and personal summaries
- Generate optimized resumes and cover letters
- Interactive chat interface for refining results
- Document viewer for previewing generated content
- Session management for ongoing conversations

## Tech Stack

- **Frontend**: React, React Bootstrap, React Router
- **Build Tool**: Vite with HMR (Hot Module Replacement)
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router for navigation between pages
- **UI Components**: React Bootstrap for responsive design
- **API Communication**: Fetch API for backend integration

## Dependencies

- React
- React Bootstrap
- React Router
- Vite
- React Hook Form
- React Quill
- React-pdf
- React-bootstrap
- React-router-dom
- React-icons
- React-toastify

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/job-application-assistant.git
   cd job-application-assistant/frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173` to view the application.

## Project Structure

- `src/pages`: Main application pages (InputPage, ResultsPage)
- `src/components`: Reusable UI components
- `src/services`: API service functions

## API Endpoints

- `POST /api/generate`: Generate optimized resumes and cover letters
- `POST /api/chat`: Interactive chat interface for refining results
