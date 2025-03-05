# server.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import logging
import json
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage

# Import the agent module
from agent import create_agent, create_initial_documents
from db import SQLiteConversationStore

# Create SQLite-based conversation store instead of in-memory dict
conversation_store = SQLiteConversationStore("conversations.db")

# Set up logger
logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("app.log")
    ]
)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Job Application Assistant API",
    description="API for optimizing resumes and generating cover letters",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create the agent
agent = create_agent()

# Request and response models
class JobApplicationInput(BaseModel):
    job_description: str = Field(..., description="The job description")
    resume: str = Field(..., description="The applicant's resume")
    personal_summary: str = Field(..., description="Brief personal summary about the applicant")

class ChatMessage(BaseModel):
    message: str = Field(..., description="The user's message")
    conversation_id: str = Field(..., description="Unique conversation identifier")

class UpdateRequest(BaseModel):
    conversation_id: str = Field(..., description="Unique conversation identifier")
    document_type: str = Field(..., description="Type of update (resume or cover_letter)")
    content: str = Field(..., description="User provided content for the update")

class ConversationResponse(BaseModel):
    conversation_id: str
    response: str
    optimized_resume: Optional[str] = None
    cover_letter: Optional[str] = None

@app.post("/api/process", response_model=ConversationResponse)
async def process_application(input_data: JobApplicationInput):
    """Process a new job application with resume and job description"""
    logger.info("Processing new job application")
    try:
        # Generate a unique conversation ID
        conversation_id = f"conv_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        logger.info(f"Created conversation ID: {conversation_id}")
        
        # Create initial drafts of optimized resume and cover letter
        logger.info("Creating initial document drafts")
        optimized_resume, cover_letter, optimization_summary = create_initial_documents(
            input_data.job_description,
            input_data.resume,
            input_data.personal_summary
        )
        
        # optimized_resume = initial_documents.get("optimized_resume", "")    
        # cover_letter = initial_documents.get("cover_letter", "")
        
        # Create a summary of the optimizations made
        logger.info("Creating optimization summary")
        
        
        # Create initial state with the generated documents
        initial_state = {
            "messages": [
                HumanMessage(content="I need help optimizing my resume and creating a cover letter for this job. Can you please help me with that?"),
                AIMessage(content=f"I've created an optimized version of your resume and a cover letter tailored to the job description. Here's a summary of the optimizations: \n\n{optimization_summary}\n\nHow would you like to proceed? Would you like to make any specific changes to either document?")
            ],
            "job_description": input_data.job_description,
            "resume": input_data.resume,
            "personal_summary": input_data.personal_summary,
            "optimized_resume": optimized_resume,
            "cover_letter": cover_letter
        }
        
        # Save state to SQLite store
        conversation_store.set(conversation_id, initial_state)
        
        logger.info(f"Successfully processed application for conversation: {conversation_id}")
        return {
            "conversation_id": conversation_id,
            "response": optimization_summary,
            "optimized_resume": optimized_resume,
            "cover_letter": cover_letter
        }
    except Exception as e:
        logger.error(f"Error processing application: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat", response_model=ConversationResponse)
async def chat(message_data: ChatMessage):
    """Continue a conversation with the assistant"""
    logger.info(f"Received chat message for conversation: {message_data.conversation_id}")
    try:
        # Get the conversation state from SQLite store
        conversation_id = message_data.conversation_id
        state = conversation_store.get(conversation_id)
        
        if not state:
            logger.warning(f"Conversation not found: {conversation_id}")
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Add the new message
        new_state = {
            **state,
            "messages": state["messages"] + [HumanMessage(content=message_data.message)]
        }
        
        # Run the agent
        logger.info(f"Invoking agent for chat in conversation: {conversation_id}")
        # First attempt to invoke the agent
        result = agent.invoke(
            new_state,
            config={"configurable": {"thread_id": conversation_id}}
        )
        
        # Check if there was a malformed function call
        has_malformed_call = any(hasattr(msg, "additional_kwargs") and 
                               msg.additional_kwargs.get("finish_reason") == "MALFORMED_FUNCTION_CALL" 
                               for msg in result["messages"])
        
        # Retry once if we got a malformed function call
        if has_malformed_call:
            logger.info("Detected MALFORMED_FUNCTION_CALL, attempting retry")
            # Retry with the same state
            result = agent.invoke(
                new_state,
                config={"configurable": {"thread_id": conversation_id}}
            )
        
        # Extract non-empty AI messages for the response
        ai_messages = [msg for msg in result["messages"] if isinstance(msg, AIMessage) and msg.content]
        
        # Handle case where there might still be issues after retry
        if not ai_messages:
            if has_malformed_call:
                response_content = "I'm having trouble processing your request. Let me try a different approach."
                # Add this message to the result so it's saved in the state
                result["messages"].append(AIMessage(content=response_content))
            else:
                response_content = "I couldn't process your request properly. Please try with different wording."
                # Add this message to the result so it's saved in the state
                result["messages"].append(AIMessage(content=response_content))
        else:
            response_content = ai_messages[-1].content
            
        # Save the updated state 
        conversation_store.set(conversation_id, result)
        
        logger.info(f"Successfully processed chat for conversation: {conversation_id}")
        return {
            "conversation_id": conversation_id,
            "response": response_content,
            "optimized_resume": result.get("optimized_resume", state.get("optimized_resume", "")),
            "cover_letter": result.get("cover_letter", state.get("cover_letter", ""))
        }
    except Exception as e:
        logger.error(f"Error processing chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/update", response_model=ConversationResponse)
async def update_document(update_data: UpdateRequest):
    """Update the resume or cover letter with new content directly without LLM processing"""
    conversation_id = update_data.conversation_id
    document_type = update_data.document_type
    content = update_data.content
    
    logger.info(f"Received direct update request for conversation: {conversation_id}, type: {document_type}")
    
    try:
        # Get the conversation state from SQLite store
        state = conversation_store.get(conversation_id)
        
        if not state:
            logger.warning(f"Conversation not found: {conversation_id}")
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Update the appropriate document in the state directly
        if document_type == "resume":
            state["optimized_resume"] = content
            logger.info("Updated resume content directly")
        elif document_type == "cover_letter":
            state["cover_letter"] = content
            logger.info("Updated cover letter content directly")
        else:
            logger.warning(f"Invalid document type: {document_type}")
            raise HTTPException(status_code=400, detail="Invalid document type")
        
        # Save updated state to SQLite store
        conversation_store.set(conversation_id, state)
        
        logger.info(f"Successfully processed direct document update for conversation: {conversation_id}")
        return {
            "conversation_id": conversation_id,
            "response": f"{document_type.replace('_', ' ').title()} updated successfully",
            "optimized_resume": state.get("optimized_resume", ""),
            "cover_letter": state.get("cover_letter", "")
        }
    except Exception as e:
        logger.error(f"Error updating document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{conversation_id}")
async def get_documents(conversation_id: str):
    """Get the current optimized resume and cover letter for a conversation"""
    logger.info(f"Retrieving documents for conversation: {conversation_id}")
    try:
        # Get the conversation state from SQLite store
        state = conversation_store.get(conversation_id)
        
        if not state:
            logger.warning(f"Conversation not found: {conversation_id}")
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        logger.info(f"Successfully retrieved documents for conversation: {conversation_id}")
        return {
            "optimized_resume": state.get("optimized_resume", ""),
            "cover_letter": state.get("cover_letter", "")
        }
    except Exception as e:
        logger.error(f"Error retrieving documents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Add a new endpoint to list conversations
@app.get("/api/conversations")
async def list_conversations(limit: int = 100, offset: int = 0):
    """List all conversations with pagination"""
    logger.info(f"Retrieving conversation list (limit={limit}, offset={offset})")
    try:
        conversations = conversation_store.list_conversations(limit, offset)
        return {"conversations": conversations}
    except Exception as e:
        logger.error(f"Error listing conversations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Add a new endpoint to delete a conversation
@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    logger.info(f"Deleting conversation: {conversation_id}")
    try:
        success = conversation_store.delete(conversation_id)
        if not success:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return {"status": "success", "message": f"Conversation {conversation_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Add a new endpoint to view a specific conversation
@app.get("/api/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get details of a specific conversation"""
    logger.info(f"Retrieving details for conversation: {conversation_id}")
    try:
        # Get the conversation state from SQLite store
        state = conversation_store.get(conversation_id)
        
        if not state:
            logger.warning(f"Conversation not found: {conversation_id}")
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Extract messages and convert to serializable format
        messages = []
        for msg in state.get("messages", []):
            # Get message type (role)
            msg_type = getattr(msg, "type", "unknown")
            if msg_type != "tool":
                # Get content (handle empty content)
                content = getattr(msg, "content", "")
                
                # Get additional metadata
                additional_kwargs = getattr(msg, "additional_kwargs", {})
                if "function_call" not in additional_kwargs:
                    # Format message for response
                    formatted_msg = {
                        "role": msg_type,
                        "content": content,
                        "timestamp": additional_kwargs.get("timestamp", ""),
                        "metadata": additional_kwargs
                    }
                    messages.append(formatted_msg)
        
        # Prepare response
        response = {
            "conversation_id": conversation_id,
            "messages": messages,
            "documents": {
                "job_description": state.get("job_description", ""),
                "resume": state.get("resume", ""),
                "personal_summary": state.get("personal_summary", ""),
                "optimized_resume": state.get("optimized_resume", ""),
                "cover_letter": state.get("cover_letter", "")
            },
            "created_at": "", # This would come from metadata in the full implementation
            "updated_at": ""  # This would come from metadata in the full implementation
        }
        
        logger.info(f"Successfully retrieved details for conversation: {conversation_id}")
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving conversation details: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/document_history/{conversation_id}/{document_type}")
async def get_document_history(conversation_id: str, document_type: str):
    """Get revision history for a document"""
    logger.info(f"Retrieving {document_type} history for conversation: {conversation_id}")
    
    # Validate document_type
    if document_type not in ["resume", "cover_letter"]:
        raise HTTPException(status_code=400, detail="Invalid document type. Must be 'resume' or 'cover_letter'")
    
    try:
        revisions = conversation_store.get_document_revisions(conversation_id, document_type)
        
        if not revisions:
            logger.warning(f"No revisions found for {document_type} in conversation {conversation_id}")
            return {"revisions": []}
        
        # For each revision, get associated message content if available
        for revision in revisions:
            if revision.get("message_id"):
                message_info = conversation_store.get_message_by_id(revision["message_id"])
                if message_info:
                    revision["message"] = {
                        "content": message_info.get("content", ""),
                        "role": message_info.get("role", ""),
                        "timestamp": message_info.get("timestamp", "")
                    }
        
        logger.info(f"Successfully retrieved {len(revisions)} {document_type} revisions for conversation: {conversation_id}")
        return {
            "conversation_id": conversation_id,
            "document_type": document_type,
            "revisions": revisions
        }
    except Exception as e:
        logger.error(f"Error retrieving document history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Run the application
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Job Application Assistant API server")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
