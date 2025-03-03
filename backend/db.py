import sqlite3
import json
import logging
from datetime import datetime
import os
from typing import Dict, Any, Optional, List

# Set up logger
logger = logging.getLogger(__name__)

class SQLiteConversationStore:
    """SQLite-based storage for conversation history and state"""
    
    def __init__(self, db_path="conversations.db"):
        """Initialize the SQLite conversation store"""
        logger.info(f"Initializing SQLite conversation store at {db_path}")
        self.db_path = db_path
        self._initialize_db()
    
    def _get_connection(self):
        """Get a connection to the SQLite database"""
        return sqlite3.connect(self.db_path)
    
    def _initialize_db(self):
        """Initialize the database schema if it doesn't exist"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Create conversations table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                conversation_id TEXT PRIMARY KEY,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                job_description TEXT,
                resume TEXT,
                personal_summary TEXT,
                optimized_resume TEXT,
                cover_letter TEXT,
                state_data TEXT
            )
            ''')
            
            # Create messages table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT,
                timestamp TIMESTAMP,
                role TEXT,
                content TEXT,
                metadata TEXT,
                FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id)
            )
            ''')
            
            # Create document revisions table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS document_revisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT,
                document_type TEXT,  -- 'resume' or 'cover_letter'
                content TEXT,
                timestamp TIMESTAMP,
                feedback TEXT,        -- The feedback that prompted this revision
                FOREIGN KEY (conversation_id) REFERENCES conversations (conversation_id)
            )
            ''')
            
            conn.commit()
            logger.info("Database schema initialized")
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}", exc_info=True)
        finally:
            if 'conn' in locals():
                conn.close()
    
    def set(self, conversation_id: str, state: Dict[str, Any]):
        """Save or update conversation state"""
        try:
            now = datetime.now().isoformat()
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # First, check if conversation exists
            cursor.execute("SELECT conversation_id, optimized_resume, cover_letter FROM conversations WHERE conversation_id = ?", (conversation_id,))
            existing = cursor.fetchone()
            
            # Convert LangChain message objects to serializable format
            messages = state.get("messages", [])
            serializable_messages = []
            for msg in messages:
                msg_dict = {
                    "role": getattr(msg, "type", "unknown"),
                    "content": getattr(msg, "content", ""),
                    "metadata": json.dumps(getattr(msg, "additional_kwargs", {}))
                }
                serializable_messages.append(msg_dict)
            
            # Remove messages from state data (we'll store them separately)
            state_copy = state.copy()
            if "messages" in state_copy:
                del state_copy["messages"]
            
            # Get current document versions
            current_resume = state.get("optimized_resume", "")
            current_cover_letter = state.get("cover_letter", "")
            
            # Check for document updates and save revisions if needed
            if existing:
                existing_id, existing_resume, existing_cover_letter = existing
                
                # Find the last human message to extract feedback
                feedback = ""
                for msg in reversed(messages):
                    if getattr(msg, "type", "") == "human":
                        feedback = getattr(msg, "content", "")
                        break
                
                # Check if resume was updated
                if current_resume and existing_resume != current_resume:
                    logger.info(f"Detected resume update for conversation {conversation_id}")
                    self._save_document_revision(
                        cursor, conversation_id, "resume", current_resume, now, feedback
                    )
                
                # Check if cover letter was updated
                if current_cover_letter and existing_cover_letter != current_cover_letter:
                    logger.info(f"Detected cover letter update for conversation {conversation_id}")
                    self._save_document_revision(
                        cursor, conversation_id, "cover_letter", current_cover_letter, now, feedback
                    )
            else:
                # For new conversations, save initial versions if they exist
                if current_resume:
                    self._save_document_revision(
                        cursor, conversation_id, "resume", current_resume, now, "Initial version"
                    )
                if current_cover_letter:
                    self._save_document_revision(
                        cursor, conversation_id, "cover_letter", current_cover_letter, now, "Initial version"
                    )
            
            if existing:
                # Update existing conversation
                cursor.execute('''
                UPDATE conversations SET
                    updated_at = ?,
                    job_description = ?,
                    resume = ?,
                    personal_summary = ?,
                    optimized_resume = ?,
                    cover_letter = ?,
                    state_data = ?
                WHERE conversation_id = ?
                ''', (
                    now,
                    state.get("job_description", ""),
                    state.get("resume", ""),
                    state.get("personal_summary", ""),
                    current_resume,
                    current_cover_letter,
                    json.dumps(state_copy),
                    conversation_id
                ))
                logger.info(f"Updated conversation {conversation_id} in database")
            else:
                # Insert new conversation
                cursor.execute('''
                INSERT INTO conversations (
                    conversation_id, created_at, updated_at, job_description, resume, 
                    personal_summary, optimized_resume, cover_letter, state_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    conversation_id,
                    now,
                    now,
                    state.get("job_description", ""),
                    state.get("resume", ""),
                    state.get("personal_summary", ""),
                    current_resume,
                    current_cover_letter,
                    json.dumps(state_copy)
                ))
                logger.info(f"Created new conversation {conversation_id} in database")
            
            # Clear existing messages and insert new ones
            cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
            
            for msg in serializable_messages:
                cursor.execute('''
                INSERT INTO messages (conversation_id, timestamp, role, content, metadata)
                VALUES (?, ?, ?, ?, ?)
                ''', (
                    conversation_id,
                    now,
                    msg["role"],
                    msg["content"],
                    msg["metadata"]
                ))
            
            conn.commit()
            logger.info(f"Saved {len(serializable_messages)} messages for conversation {conversation_id}")
        except Exception as e:
            logger.error(f"Error saving conversation {conversation_id}: {str(e)}", exc_info=True)
            if 'conn' in locals():
                conn.rollback()
        finally:
            if 'conn' in locals():
                conn.close()
    
    def _save_document_revision(self, cursor, conversation_id, document_type, content, timestamp, feedback):
        """Save a document revision"""
        cursor.execute('''
        INSERT INTO document_revisions (conversation_id, document_type, content, timestamp, feedback)
        VALUES (?, ?, ?, ?, ?)
        ''', (conversation_id, document_type, content, timestamp, feedback))
        logger.info(f"Saved {document_type} revision for conversation {conversation_id}")
    
    def get_document_revisions(self, conversation_id: str, document_type: str) -> List[Dict[str, Any]]:
        """Get revision history for a document"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT id, content, timestamp, feedback
            FROM document_revisions
            WHERE conversation_id = ? AND document_type = ?
            ORDER BY timestamp ASC
            ''', (conversation_id, document_type))
            
            revisions = [
                {
                    "id": row[0],
                    "content": row[1],
                    "timestamp": row[2],
                    "feedback": row[3],
                }
                for row in cursor.fetchall()
            ]
            
            logger.info(f"Retrieved {len(revisions)} {document_type} revisions for conversation {conversation_id}")
            return revisions
        except Exception as e:
            logger.error(f"Error retrieving document revisions: {str(e)}", exc_info=True)
            return []
        finally:
            if 'conn' in locals():
                conn.close()
    
    def get(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve conversation state by ID"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Get conversation data
            cursor.execute('''
            SELECT job_description, resume, personal_summary, optimized_resume, cover_letter, state_data
            FROM conversations
            WHERE conversation_id = ?
            ''', (conversation_id,))
            
            row = cursor.fetchone()
            if not row:
                logger.warning(f"Conversation {conversation_id} not found in database")
                return None
            
            job_description, resume, personal_summary, optimized_resume, cover_letter, state_data = row
            
            # Parse state data
            state = json.loads(state_data)
            
            # Add core fields
            state["job_description"] = job_description
            state["resume"] = resume
            state["personal_summary"] = personal_summary
            state["optimized_resume"] = optimized_resume
            state["cover_letter"] = cover_letter
            
            # Get messages
            cursor.execute('''
            SELECT role, content, metadata
            FROM messages
            WHERE conversation_id = ?
            ORDER BY id ASC
            ''', (conversation_id,))
            
            from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
            
            messages = []
            for role, content, metadata in cursor.fetchall():
                # Convert back to LangChain message objects
                metadata_dict = json.loads(metadata) if metadata else {}
                
                if role == "human":
                    msg = HumanMessage(content=content, additional_kwargs=metadata_dict)
                elif role == "ai":
                    msg = AIMessage(content=content, additional_kwargs=metadata_dict)
                elif role == "system":
                    msg = SystemMessage(content=content, additional_kwargs=metadata_dict)
                elif role == "tool":
                    msg = ToolMessage(content=content, tool_call_id=metadata_dict.get("tool_call_id", "unknown"))
                else:
                    # Default fallback
                    msg = AIMessage(content=content, additional_kwargs={"role": role, **metadata_dict})
                
                messages.append(msg)
            
            state["messages"] = messages
            logger.info(f"Retrieved conversation {conversation_id} with {len(messages)} messages")
            
            return state
        except Exception as e:
            logger.error(f"Error retrieving conversation {conversation_id}: {str(e)}", exc_info=True)
            return None
        finally:
            if 'conn' in locals():
                conn.close()
    
    def list_conversations(self, limit=100, offset=0):
        """List conversations with pagination"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT conversation_id, created_at, updated_at 
            FROM conversations
            ORDER BY updated_at DESC
            LIMIT ? OFFSET ?
            ''', (limit, offset))
            
            conversations = [
                {"id": row[0], "created_at": row[1], "updated_at": row[2]}
                for row in cursor.fetchall()
            ]
            
            return conversations
        except Exception as e:
            logger.error(f"Error listing conversations: {str(e)}", exc_info=True)
            return []
        finally:
            if 'conn' in locals():
                conn.close()
    
    def delete(self, conversation_id: str) -> bool:
        """Delete a conversation and its messages"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Delete messages first (foreign key constraint)
            cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conversation_id,))
            
            # Delete conversation
            cursor.execute("DELETE FROM conversations WHERE conversation_id = ?", (conversation_id,))
            
            conn.commit()
            deleted = cursor.rowcount > 0
            if deleted:
                logger.info(f"Deleted conversation {conversation_id}")
            else:
                logger.warning(f"Attempted to delete non-existent conversation {conversation_id}")
            
            return deleted
        except Exception as e:
            logger.error(f"Error deleting conversation {conversation_id}: {str(e)}", exc_info=True)
            if 'conn' in locals():
                conn.rollback()
            return False
        finally:
            if 'conn' in locals():
                conn.close() 