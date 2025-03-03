# agent.py
import os
import logging
import json
from typing import List, Dict, Any, Optional, TypedDict, Annotated
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_core.tools import Tool, tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode  # Import ToolNode
from langgraph.checkpoint.memory import MemorySaver

# Set up logger
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


# Define the state
class AgentState(TypedDict):
    messages: Annotated[List[Any], add_messages]
    job_description: str
    resume: str
    personal_summary: str
    optimized_resume: str
    cover_letter: str


# Tool definitions with improved error handling and logging
@tool
def update_resume(resume: str, feedback: str) -> str:
    """
    Updates the resume based on user feedback.
    
    Args:
        resume: The current resume text
        feedback: User's feedback or instructions for updating the resume
        
    Returns:
        Updated resume text
    """
    logger.info(f"Executing update_resume tool with resume length {len(resume)} and feedback '{feedback}'")
    
    # Handle case when resume is not a string
    if not isinstance(resume, str):
        logger.warning(f"Expected string for resume but got {type(resume)}")
        resume = str(resume)
    
    # Handle case when feedback is not a string
    if not isinstance(feedback, str):
        logger.warning(f"Expected string for feedback but got {type(feedback)}")
        feedback = str(feedback)
    
    prompt = f"""
    You are a resume optimization expert. Your task is to update the following resume based on the feedback provided.
    
    Current Resume:
    {resume}
    
    Feedback/Instructions:
    {feedback}
    
    Please provide the complete updated resume. Maintain the original format but implement the requested changes.
    """
    
    # Use direct model invocation to avoid dependency on parent_run_id
    try:
        # Fix: Use HumanMessage instead of SystemMessage
        response = llm.invoke([HumanMessage(content=prompt)])
        result = response.content.strip("`")
        logger.info(f"Resume updated successfully, result length: {len(result)}")
        
        # Ensure we're returning a non-empty string
        if not result or len(result.strip()) == 0:
            logger.error("Got empty result from LLM")
            return "Error: Unable to update resume. Please try again with different instructions."
            
        return result
    except Exception as e:
        logger.error(f"Error during resume update: {str(e)}", exc_info=True)
        error_message = f"Error updating resume: {str(e)}"
        return error_message


@tool
def update_cover_letter(cover_letter: str, feedback: str) -> str:
    """
    Updates the cover letter based on user feedback.
    
    Args:
        cover_letter: The current cover letter text
        feedback: User's feedback or instructions for updating the cover letter
        
    Returns:
        Updated cover letter text
    """
    logger.info("Updating cover letter with feedback")
    
    # Handle case when cover_letter is not a string
    if not isinstance(cover_letter, str):
        logger.warning(f"Expected string for cover_letter but got {type(cover_letter)}")
        cover_letter = str(cover_letter)
    
    # Handle case when feedback is not a string
    if not isinstance(feedback, str):
        logger.warning(f"Expected string for feedback but got {type(feedback)}")
        feedback = str(feedback)
    
    prompt = f"""
    You are a cover letter writing expert. Your task is to update the following cover letter based on the feedback provided.
    
    Current Cover Letter:
    {cover_letter}
    
    Feedback/Instructions:
    {feedback}
    
    Please provide the complete updated cover letter. Maintain the original format but implement the requested changes.
    """
    
    # Use direct model invocation to avoid dependency on parent_run_id
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        logger.info("Cover letter updated successfully")
        return response.content.strip("`")
    except Exception as e:
        logger.error(f"Error during cover letter update: {str(e)}", exc_info=True)
        return f"Error updating cover letter: {str(e)}"


# Create tools list for LangGraph
tools = [update_resume, update_cover_letter]

# Initialize Gemini model with tools support
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",   
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.7,
    convert_system_message_to_human=True,
).bind_tools(tools)


# Define the agent node for message processing
def process_message(state: AgentState):
    """Process the user message and generate a response"""
    logger.info("Processing user message")
    messages = state["messages"]
    job_description = state["job_description"]
    resume = state["resume"]
    personal_summary = state["personal_summary"]
    optimized_resume = state.get("optimized_resume", "")
    cover_letter = state.get("cover_letter", "")
    
    # Get the last message
    last_message = messages[-1]
    logger.info(f"Last message: {last_message}")
    
    # Add context to the messages
    context_message = SystemMessage(
        content=f"""You are a job application assistant. Your task is to help the user optimize their resume and generate a cover letter.
        
Job Description: {job_description}

Resume: {resume}

Personal Summary: {personal_summary}

Current Optimized Resume: {optimized_resume}

Current Cover Letter: {cover_letter}

User's Instructions:
{last_message.content}

IMPORTANT:
1. When the user asks to update their resume, use the update_resume tool.
2. When the user asks to update their cover letter, use the update_cover_letter tool.
3. ALWAYS use the appropriate tool for document changes instead of writing them yourself.
4. For any resume updates, call update_resume with current resume and user's feedback.
5. For any cover letter updates, call update_cover_letter with current cover letter and user's feedback.

If the user doesn't explicitly request an update, provide helpful advice about job applications.
"""
    )
    
    # Prepare messages for the model
    model_messages = [context_message] + messages
    logger.info(f"Sending context message and user message to model")
    
    # Call the model
    response = llm.invoke(model_messages)
    logger.info("Generated AI response")
    
    return {"messages": [response]}


# Define a function to handle tool results
def handle_tool_results(state: AgentState):
    """Handle tool execution results and update state accordingly"""
    logger.info("Handling tool results")
    messages = state["messages"]
    
    # Check if the last message is a tool message
    if isinstance(messages[-1], ToolMessage):
        tool_message = messages[-1]
        logger.info(f"Processing tool message: {tool_message}")
        
        # Extract tool name from the tool call ID if available
        tool_call_name = getattr(tool_message, "name", "unknown")
        logger.info(f"Tool call name: {tool_call_name}")
        
        # Update state based on which tool was called
        if "update_resume" in tool_call_name:
            logger.info("Updating optimized_resume in state")
            return {"optimized_resume": tool_message.content}
        elif "update_cover_letter" in tool_call_name:
            logger.info("Updating cover_letter in state")
            return {"cover_letter": tool_message.content}
    
    # If no updates needed, return empty dict
    return {}


# Add a new function to generate a response after tool execution
def generate_tool_response(state: AgentState):
    """Generate a response describing the action performed by the tool"""
    logger.info("Generating response about tool execution")
    
    # Get information about what changed
    messages = state["messages"]
    job_description = state["job_description"]
    resume = state["resume"]
    optimized_resume = state.get("optimized_resume", "")
    cover_letter = state.get("cover_letter", "")
    
    # Find the tool message (should be the most recent ToolMessage)
    tool_message = None
    tool_name = "unknown"
    for msg in reversed(messages):
        if isinstance(msg, ToolMessage):
            tool_message = msg
            tool_name = getattr(tool_message, "name", "unknown")
            if not tool_name or tool_name == "unknown":
                # Try to extract from tool_call_id
                tool_call_id = getattr(tool_message, "tool_call_id", "")
                if "update_resume" in tool_call_id:
                    tool_name = "update_resume"
                elif "update_cover_letter" in tool_call_id:
                    tool_name = "update_cover_letter"
            break
    
    if not tool_message:
        logger.warning("No tool message found to generate response for")
        return {"messages": [AIMessage(content="I've updated the document as requested.")]}
    
    # Find the user's request (previous HumanMessage)
    user_request = ""
    for msg in reversed(messages):
        if isinstance(msg, HumanMessage):
            user_request = msg.content
            break
    
    # Create prompt for the LLM to explain what was done
    summary_prompt = f"""
    You are a job application assistant. A user asked you to modify a document, and you need to explain what you did.
    
    User request: "{user_request}"
    
    Tool used: {tool_name}
    
    Document type: {"Resume" if "resume" in tool_name else "Cover Letter"}
    Original Document: {resume if "resume" in tool_name else cover_letter}
    Document after update: {tool_message.content}    
    Create a brief, helpful response (1-3 sentences) explaining what you changed in the document based on their request.
    Be specific about what was modified. Don't ask if they want to make more changes.
    """
    
    # Call the LLM to generate an explanation
    try:
        response = llm.invoke([HumanMessage(content=summary_prompt)])
        logger.info(f"Generated tool response: {response.content}")
        return {"messages": [AIMessage(content=response.content)]}
    except Exception as e:
        logger.error(f"Error generating tool response: {str(e)}", exc_info=True)
        return {"messages": [AIMessage(content="I've updated the document as requested.")]}


# Create the graph using ToolNode
def create_agent():
    logger.info("Creating agent workflow with ToolNode")
    workflow = StateGraph(AgentState)
    
    # Add the nodes
    workflow.add_node("process_message", process_message)
    
    # Create ToolNode for tool execution
    tool_node = ToolNode(tools)
    workflow.add_node("tools", tool_node)
    
    # Add node for handling tool results
    workflow.add_node("handle_tool_results", handle_tool_results)
    
    # Add new node for generating a response after tool execution
    workflow.add_node("generate_tool_response", generate_tool_response)
    
    # Connect START to process_message
    workflow.add_edge(START, "process_message")
    
    # Define a helper function to check for tool calls
    def should_use_tools(state):
        """Check if the last message contains tool calls"""
        messages = state["messages"]
        if not messages:
            return END
            
        last_message = messages[-1]
        
        # Check various formats of tool calls
        has_tool_calls = False
        
        # Check direct tool_calls attribute
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            has_tool_calls = True
            
        # Check additional_kwargs for function_call or tool_calls
        if hasattr(last_message, "additional_kwargs"):
            if "function_call" in last_message.additional_kwargs:
                has_tool_calls = True
            if "tool_calls" in last_message.additional_kwargs:
                has_tool_calls = True
                
        # Check for empty content (often indicates a function call)
        if hasattr(last_message, "content") and not last_message.content:
            # Look for other indicators of a function call
            if hasattr(last_message, "additional_kwargs") and last_message.additional_kwargs:
                has_tool_calls = True
        
        logger.info(f"Message has tool calls: {has_tool_calls}")
        return "tools" if has_tool_calls else END
    
    # Connect process_message conditionally
    workflow.add_conditional_edges(
        "process_message",
        should_use_tools,
        {
            "tools": "tools",
            END: END
        }
    )
    
    # Connect tools to handle_tool_results
    workflow.add_edge("tools", "handle_tool_results")
    
    # Connect handle_tool_results to generate_tool_response
    workflow.add_edge("handle_tool_results", "generate_tool_response")
    
    # Connect generate_tool_response to END
    workflow.add_edge("generate_tool_response", END)
    
    # Compile the graph
    agent = workflow.compile()
    logger.info("Agent workflow compiled with ToolNode")
    
    return agent


def create_initial_documents(job_description: str, resume: str, personal_summary: str):
    """Create initial optimized resume and cover letter"""
    logger.info("Creating initial optimized resume and cover letter")
    # Generate optimized resume
    resume_prompt = f"""
    You are a resume optimization expert. Your task is to optimize the following resume to better match the job description.
    
    Job Description: {job_description}
    
    Resume: {resume}
    
    Personal Summary: {personal_summary}
    
    Optimize the resume to highlight relevant skills and experience that match the job requirements.
    Return the complete optimized resume. Do not include any other text or comments.
    """
    
    # Fix: Use HumanMessage instead of SystemMessage for Gemini
    optimized_resume_response = llm.invoke([HumanMessage(content=resume_prompt)])
    optimized_resume = optimized_resume_response.content
    logger.info("Initial optimized resume created")
    
    # Generate cover letter
    cover_letter_prompt = f"""
    You are a cover letter writing expert. Your task is to create a personalized cover letter based on the resume and job description.
    
    Job Description: {job_description}
    
    Resume: {resume}
    
    Personal Summary: {personal_summary}
    
    Create a professional cover letter that highlights relevant skills and experience while matching the applicant's personality.
    Return the complete cover letter. Do not include any other text or comments.
    """
    
    # Fix: Use HumanMessage instead of SystemMessage for Gemini
    cover_letter_response = llm.invoke([HumanMessage(content=cover_letter_prompt)])
    cover_letter = cover_letter_response.content
    logger.info("Initial cover letter created")
    
    summary_prompt = f"""
        You are a job application assistant. Summarize the key optimizations made to this resume
        for the job description below. Be specific about what was improved and why.
        
        Original Resume:
        {resume}
        
        Optimized Resume:
        {optimized_resume}
        
        Optimized Cover Letter:
        {cover_letter}

        Job Description:
        {job_description}
        
        Provide a concise summary of the changes and improvements.
        """
        
    summary_response = llm.invoke([HumanMessage(content=summary_prompt)])
    optimization_summary = summary_response.content
    logger.info("Optimization summary created")
    
    return optimized_resume, cover_letter, optimization_summary


# Initialize memory saver for conversation persistence
memory = MemorySaver()
logger.info("Memory saver initialized")
