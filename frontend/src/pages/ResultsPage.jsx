// src/pages/ResultsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Toast,
  ToastContainer,
  Alert,
  Navbar,
  Form,
  InputGroup,
  Nav,
  Tab,
  Dropdown,
  Modal,
  ListGroup
} from 'react-bootstrap';
import DocumentViewer from '../components/DocumentViewer';
import ChatInterface from '../components/ChatInterface';
import { getConversationData, sendMessage, getDocumentHistory } from '../services/api';
import NavigationMenu from '../components/NavigationMenu';
import ReactMarkdown from 'react-markdown';
import { saveAs } from 'file-saver';
import { 
  Packer, 
  Document, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  BorderStyle,
  WidthType,
  TableRow,
  TableCell,
  Table,
  UnderlineType
} from 'docx';
import { jsPDF } from 'jspdf';
import { marked } from 'marked';

// CSS styles for fixed layout and scrollable panes
const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa'
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
    paddingBottom: '10px'
  },
  columnContainer: {
    height: 'calc(100vh - 80px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
  },
  scrollableContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px'
  },
  columnHeader: {
    fontSize: '18px',
    fontWeight: '600',
    padding: '15px 20px',
    borderBottom: '1px solid #dee2e6',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  messageContainer: {
    maxWidth: '85%', 
    textAlign: 'left',
    wordBreak: 'break-word',
    margin: '10px 0'
  },
  chatInputContainer: {
    padding: '15px 20px',
    backgroundColor: '#fff',
    borderTop: '1px solid #dee2e6'
  },
  documentContainer: {
    padding: '20px',
    backgroundColor: '#fff'
  },
  documentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  tabContent: {
    padding: '20px 0'
  },
  resumeSection: {
    marginBottom: '20px'
  },
  resumeHeader: {
    marginBottom: '5px',
    fontWeight: 'bold'
  },
  jobDescriptionBox: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #dee2e6'
  },
  markdownContent: {
    textAlign: 'left',
    width: '100%',
    overflowWrap: 'break-word',
    wordWrap: 'break-word',
    hyphens: 'auto'
  }
};

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversationData, setConversationData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [optimizedResume, setOptimizedResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeHistory, setResumeHistory] = useState([]);
  const [coverLetterHistory, setCoverLetterHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('resume'); // 'resume' or 'coverLetter'
  const [currentResumeRevision, setCurrentResumeRevision] = useState(0);
  const [currentCoverLetterRevision, setCurrentCoverLetterRevision] = useState(0);
  const [conversationId, setConversationId] = useState(null);

  // Create wrapper functions to debug state updates
  const debugSetOptimizedResume = (value) => {
    console.log('Setting optimizedResume to:', value);
    console.log('Previous optimizedResume was:', optimizedResume);
    setOptimizedResume(value);
    // Force a check after state update
    setTimeout(() => {
      console.log('After update, optimizedResume is now:', optimizedResume);
    }, 100);
  };

  const debugSetCoverLetter = (value) => {
    console.log('Setting coverLetter to:', value);
    console.log('Previous coverLetter was:', coverLetter);
    setCoverLetter(value);
    // Force a check after state update
    setTimeout(() => {
      console.log('After update, coverLetter is now:', coverLetter);
    }, 100);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const convId = new URLSearchParams(location.search).get('conversation_id');
        if (!convId) {
          navigate('/');
          return;
        }
        
        console.log('Conversation ID:', convId);
        setConversationId(convId);

        // Fetch conversation data
        const data = await getConversationData(convId);
        console.log('Conversation data:', data);
        setConversationData(data);
        
        if (data.messages) {
          console.log('Setting messages:', data.messages);
          setMessages(data.messages);
          
          // Scroll to the latest message
          setTimeout(() => {
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
          }, 100);
        }
        
        // Check if documents are directly available in the conversation data
        if (data.documents) {
          console.log('Documents in conversation data:', data.documents);
          
          if (data.documents.resume) {
            console.log('Setting resume from conversation data');
            debugSetOptimizedResume(data.documents.resume);
          }
          
          if (data.documents.cover_letter) {
            console.log('Setting cover letter from conversation data');
            debugSetCoverLetter(data.documents.cover_letter);
          }
        }
        
        // Fetch resume history
        try {
          console.log('Fetching resume history...');
          const resumeData = await getDocumentHistory(convId, 'resume');
          console.log('Resume history:', resumeData);
          
          if (resumeData && resumeData.revisions && Array.isArray(resumeData.revisions) && resumeData.revisions.length > 0) {
            setResumeHistory(resumeData.revisions);
            // Update to latest version
            const latestResume = resumeData.revisions[resumeData.revisions.length - 1].content;
            console.log('Setting latest resume from history:', latestResume);
            debugSetOptimizedResume(latestResume);
            setCurrentResumeRevision(resumeData.revisions.length - 1);
            } else if (resumeData && resumeData.content) {      
            // Handle case where API returns a single document instead of array
            console.log('Setting resume from single document:', resumeData.content);
            debugSetOptimizedResume(resumeData.content);
            setResumeHistory([resumeData]);
          } else if (resumeData && typeof resumeData === 'string') {
            // Handle case where API returns just a string
            console.log('Setting resume from string:', resumeData);
            debugSetOptimizedResume(resumeData);
            setResumeHistory([{ content: resumeData, timestamp: new Date().toISOString() }]);
          }
        } catch (err) {
          console.error('Error loading resume history:', err);
        }
        
        // Fetch cover letter history
        try {
          console.log('Fetching cover letter history...');
          const coverLetterData = await getDocumentHistory(convId, 'cover_letter');
          console.log('Cover letter history:', coverLetterData);
          
          if (coverLetterData && coverLetterData.revisions && Array.isArray(coverLetterData.revisions) && coverLetterData.revisions.length > 0) {
            setCoverLetterHistory(coverLetterData.revisions);
            // Update to latest version
            const latestCoverLetter = coverLetterData.revisions[coverLetterData.revisions.length - 1].content;
            console.log('Setting latest cover letter from history:', latestCoverLetter);
            debugSetCoverLetter(latestCoverLetter);
            setCurrentCoverLetterRevision(coverLetterData.revisions.length - 1);
          } else if (coverLetterData && coverLetterData.content) {
            // Handle case where API returns a single document instead of array
            console.log('Setting cover letter from single document:', coverLetterData.content);
            debugSetCoverLetter(coverLetterData.content);
            setCoverLetterHistory([coverLetterData]);
          } else if (coverLetterData && typeof coverLetterData === 'string') {
            // Handle case where API returns just a string
            console.log('Setting cover letter from string:', coverLetterData);
            debugSetCoverLetter(coverLetterData);
            setCoverLetterHistory([{ content: coverLetterData, timestamp: new Date().toISOString() }]);
          }
        } catch (err) {
          console.error('Error loading cover letter history:', err);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError('Failed to load conversation data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [location.search, navigate]);

  // Add a useEffect to monitor state changes
  useEffect(() => {
    console.log('optimizedResume changed:', optimizedResume);
  }, [optimizedResume]);

  useEffect(() => {
    console.log('coverLetter changed:', coverLetter);
  }, [coverLetter]);

  // Update the refreshDocumentHistory function to be more robust
  const refreshDocumentHistory = async () => {
    if (!conversationId) {
      console.error('Cannot refresh document history: No conversation ID');
      return;
    }
    
    console.log('Refreshing document history for conversation:', conversationId);
    
    // Fetch updated resume history
    try {
      console.log('Fetching resume history...');
      const resumeData = await getDocumentHistory(conversationId, 'resume');
      console.log('Resume history response:', resumeData);
      
      if (resumeData) {
        // Handle array response
        if (Array.isArray(resumeData.revisions) && resumeData.revisions.length > 0) {
          console.log('Setting resume history (array):', resumeData);
          setResumeHistory(resumeData.revisions);
          
          // Get the latest revision
          const latestRevision = resumeData.revisions[resumeData.revisions.length - 1];
          console.log('Latest resume revision:', latestRevision);
          
          if (latestRevision && latestRevision.content) {
            console.log('Setting optimizedResume to:', latestRevision.content);
            setOptimizedResume(latestRevision.content);
            setCurrentResumeRevision(resumeData.revisions.length - 1);
          }
        } 
        // Handle single object response
        else if (typeof resumeData === 'object' && resumeData.content) {
          console.log('Setting resume history (single object):', [resumeData]);
          setResumeHistory([resumeData]);
          console.log('Setting optimizedResume to:', resumeData.content);
          setOptimizedResume(resumeData.content);
          setCurrentResumeRevision(0);
        }
        // Handle string response
        else if (typeof resumeData === 'string') {
          const newRevision = {
            content: resumeData,
            timestamp: new Date().toISOString()
          };
          console.log('Setting resume history (string):', [newRevision]);
          setResumeHistory([newRevision]);
          console.log('Setting optimizedResume to:', resumeData);
          setOptimizedResume(resumeData);
          setCurrentResumeRevision(0);
        }
      }
    } catch (err) {
      console.error('Error refreshing resume history:', err);
    }
    
    // Fetch updated cover letter history
    try {
      console.log('Fetching cover letter history...');
      const coverLetterData = await getDocumentHistory(conversationId, 'cover_letter');
      console.log('Cover letter history response:', coverLetterData);
      
      if (coverLetterData) {
        // Handle array response
        if (Array.isArray(coverLetterData.revisions) && coverLetterData.revisions.length > 0) {
          console.log('Setting cover letter history (array):', coverLetterData);
          setCoverLetterHistory(coverLetterData.revisions);
          
          // Get the latest revision
          const latestRevision = coverLetterData.revisions[coverLetterData.revisions.length - 1];
          console.log('Latest cover letter revision:', latestRevision);
          
          if (latestRevision && latestRevision.content) {
            console.log('Setting coverLetter to:', latestRevision.content);
            setCoverLetter(latestRevision.content);
            setCurrentCoverLetterRevision(coverLetterData.revisions.length - 1);
          }
        } 
        // Handle single object response
        else if (typeof coverLetterData === 'object' && coverLetterData.content) {
          console.log('Setting cover letter history (single object):', [coverLetterData]);
          setCoverLetterHistory([coverLetterData]);
          console.log('Setting coverLetter to:', coverLetterData.content);
          setCoverLetter(coverLetterData.content);
          setCurrentCoverLetterRevision(0);
        }
        // Handle string response
        else if (typeof coverLetterData === 'string') {
          const newRevision = {
            content: coverLetterData,
            timestamp: new Date().toISOString()
          };
          console.log('Setting cover letter history (string):', [newRevision]);
          setCoverLetterHistory([newRevision]);
          console.log('Setting coverLetter to:', coverLetterData);
          setCoverLetter(coverLetterData);
          setCurrentCoverLetterRevision(0);
        }
      }
    } catch (err) {
      console.error('Error refreshing cover letter history:', err);
    }
    
    console.log('Document history refresh complete');
  };

  // Add a direct test function to verify state updates
  const testStateUpdates = () => {
    console.log('Testing state updates...');
    const testResume = "# Test Resume\n\nThis is a test resume to verify state updates.";
    const testCoverLetter = "# Test Cover Letter\n\nThis is a test cover letter to verify state updates.";
    
    debugSetOptimizedResume(testResume);
    debugSetCoverLetter(testCoverLetter);
  };

  // Add a button to test state updates
  const TestButton = () => (
    <Button 
      variant="outline-danger" 
      size="sm" 
      className="ms-2"
      onClick={testStateUpdates}
      title="Test state updates"
    >
      Test
    </Button>
  );

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Update the handleSendMessage function to better handle document updates
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      
      // Add user message to UI immediately
      const userMessage = { role: 'user', content: newMessage };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      setNewMessage('');
      
      // Send message to API
      console.log('Sending message to API:', newMessage);
      const response = await sendMessage(conversationId, newMessage);
      console.log('Message response from API:', response);
      
      // Update messages with assistant response
      if (response.message) {
        setMessages(prevMessages => [...prevMessages, response.message]);
      }
      
      // Check if documents were updated in the response
      if (response.documents) {
        console.log('Documents in response:', response.documents);
        
        // Update resume if available
        if (response.documents.resume) {
          console.log('New resume from response:', response.documents.resume);
          setOptimizedResume(response.documents.resume);
          
          // Add to resume history
          const newRevision = {
            content: response.documents.resume,
            timestamp: new Date().toISOString()
          };
          setResumeHistory(prevHistory => [...prevHistory, newRevision]);
          setCurrentResumeRevision(resumeHistory.length);
        }
        
        // Update cover letter if available
        if (response.documents.cover_letter) {
          console.log('New cover letter from response:', response.documents.cover_letter);
          setCoverLetter(response.documents.cover_letter);
          
          // Add to cover letter history
          const newRevision = {
            content: response.documents.cover_letter,
            timestamp: new Date().toISOString()
          };
          setCoverLetterHistory(prevHistory => [...prevHistory, newRevision]);
          setCurrentCoverLetterRevision(coverLetterHistory.length);
        }
      }
      
      // Always refresh document history after a message exchange
      console.log('Refreshing document history after message exchange');
      await refreshDocumentHistory();
      
      setSending(false);
      
      // Scroll to bottom of messages
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setSending(false);
    }
  };

  const handleExportAsWord = (content, filename) => {
    // Parse markdown to get structured content
    const tokens = marked.lexer(content);
    
    // Convert tokens to docx elements
    const docElements = [];
    
    // Helper function to process inline formatting
    const processInlineFormatting = (text) => {
      const textRuns = [];
      
      // Process bold and italic
      // Bold with ** or __
      if (text.includes('**') || text.includes('__')) {
        const parts = text.split(/(\*\*.*?\*\*|__.*?__)/g);
        parts.forEach(part => {
          if ((part.startsWith('**') && part.endsWith('**')) || 
              (part.startsWith('__') && part.endsWith('__'))) {
            textRuns.push(
              new TextRun({
                text: part.slice(2, -2),
                bold: true
              })
            );
          } else if (part) {
            // Check for italic in remaining parts
            if (part.includes('*') || part.includes('_')) {
              const italicParts = part.split(/(\*.*?\*|_.*?_)/g);
              italicParts.forEach(italicPart => {
                if ((italicPart.startsWith('*') && italicPart.endsWith('*') && !italicPart.startsWith('**')) || 
                    (italicPart.startsWith('_') && italicPart.endsWith('_') && !italicPart.startsWith('__'))) {
                  textRuns.push(
                    new TextRun({
                      text: italicPart.slice(1, -1),
                      italics: true
                    })
                  );
                } else if (italicPart) {
                  textRuns.push(
                    new TextRun({
                      text: italicPart
                    })
                  );
                }
              });
            } else {
              textRuns.push(
                new TextRun({
                  text: part
                })
              );
            }
          }
        });
      } 
      // Italic with * or _
      else if (text.includes('*') || text.includes('_')) {
        const parts = text.split(/(\*.*?\*|_.*?_)/g);
        parts.forEach(part => {
          if ((part.startsWith('*') && part.endsWith('*')) || 
              (part.startsWith('_') && part.endsWith('_'))) {
            textRuns.push(
              new TextRun({
                text: part.slice(1, -1),
                italics: true
              })
            );
          } else if (part) {
            textRuns.push(
              new TextRun({
                text: part
              })
            );
          }
        });
      } 
      // Plain text
      else {
        textRuns.push(
          new TextRun({
            text: text
          })
        );
      }
      
      return textRuns;
    };
    
    tokens.forEach(token => {
      switch (token.type) {
        case 'heading':
          docElements.push(
            new Paragraph({
              children: processInlineFormatting(token.text),
              heading: token.depth === 1 ? HeadingLevel.HEADING_1 : 
                      token.depth === 2 ? HeadingLevel.HEADING_2 : 
                      token.depth === 3 ? HeadingLevel.HEADING_3 : 
                      HeadingLevel.HEADING_4,
              spacing: {
                before: 200,
                after: 120
              }
            })
          );
          break;
          
        case 'paragraph':
          docElements.push(
            new Paragraph({
              children: processInlineFormatting(token.text),
              spacing: {
                after: 120
              }
            })
          );
          break;
          
        case 'list':
          token.items.forEach((item, i) => {
            docElements.push(
              new Paragraph({
                children: processInlineFormatting(item.text),
                bullet: {
                  level: 0
                },
                spacing: {
                  after: 80
                }
              })
            );
          });
          break;
          
        case 'hr':
          docElements.push(
            new Paragraph({
              text: "",
              border: {
                bottom: {
                  color: "auto",
                  space: 1,
                  style: BorderStyle.SINGLE,
                  size: 6
                }
              },
              spacing: {
                before: 120,
                after: 120
              }
            })
          );
          break;
          
        case 'code':
          docElements.push(
            new Paragraph({
              text: token.text,
              style: "Code",
              spacing: {
                before: 120,
                after: 120
              }
            })
          );
          break;
          
        case 'space':
          docElements.push(
            new Paragraph({
              text: "",
              spacing: {
                before: 80,
                after: 80
              }
            })
          );
          break;
          
        default:
          // Handle other token types or just add as plain text
          if (token.text) {
            docElements.push(
              new Paragraph({
                text: token.text
              })
            );
          }
      }
    });
    
    // Create a new document with the processed elements
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docElements
        }
      ]
    });

    // Generate and save the document
    Packer.toBlob(doc).then(blob => {
      saveAs(blob, filename);
    });
  };

  const handleExportAsPdf = (content, filename) => {
    const pdf = new jsPDF();
    
    // Use marked to parse markdown
    const tokens = marked.lexer(content);
    let y = 20; // Start a bit lower for margin
    const baseFontSize = 11; // Slightly smaller base font for better fit
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 15; // Smaller margins
    const textWidth = pageWidth - (margin * 2);
    
    // Helper function to process text with markdown formatting
    const renderFormattedText = (text, x, y, maxWidth) => {
      // Parse the text for markdown formatting
      const inlineTokens = marked.lexer(text).filter(t => t.type !== 'space');
      let xOffset = x;
      let currentY = y;
      let lineHeight = baseFontSize + 2;
      let spaceWidth = pdf.getStringUnitWidth(' ') * baseFontSize / pdf.internal.scaleFactor;
      
      // Process each token
      inlineTokens.forEach(token => {
        if (token.type === 'paragraph' && token.tokens) {
          token.tokens.forEach(inlineToken => {
            let tokenText = inlineToken.text || '';
            let tokenWidth = pdf.getStringUnitWidth(tokenText) * baseFontSize / pdf.internal.scaleFactor;
            
            // Check if we need to wrap to next line
            if (xOffset + tokenWidth > x + maxWidth) {
              currentY += lineHeight;
              xOffset = x;
            }
            
            // Apply formatting based on token type
            if (inlineToken.type === 'strong') {
              pdf.setFont('helvetica', 'bold');
            } else if (inlineToken.type === 'em') {
              pdf.setFont('helvetica', 'italic');
            } else {
              pdf.setFont('helvetica', 'normal');
            }
            
            // Render the text
            pdf.text(tokenText, xOffset, currentY);
            xOffset += tokenWidth + spaceWidth; // Add space after token
            
            // Reset font
            pdf.setFont('helvetica', 'normal');
          });
        } else if (token.type === 'text') {
          // Simple text token
          let tokenText = token.text || '';
          let words = tokenText.split(' ');
          
          words.forEach(word => {
            let wordWidth = pdf.getStringUnitWidth(word) * baseFontSize / pdf.internal.scaleFactor;
            
            // Check if we need to wrap to next line
            if (xOffset + wordWidth > x + maxWidth) {
              currentY += lineHeight;
              xOffset = x;
            }
            
            // Render the word
            pdf.text(word, xOffset, currentY);
            xOffset += wordWidth + spaceWidth;
          });
        }
      });
      
      return currentY + lineHeight; // Return the new Y position
    };
    
    // Process each token
    tokens.forEach(token => {
      // Check if we need a new page
      if (y > pdf.internal.pageSize.height - margin) {
        pdf.addPage();
        y = margin;
      }
      
      switch (token.type) {
        case 'heading':
          // Adjust font size based on heading level
          const headingSize = 18 - (token.depth * 2); // h1=16, h2=14, h3=12, etc.
          pdf.setFontSize(headingSize);
          pdf.setFont('helvetica', 'bold');
          
          // Render heading with wrapping
          const headingLines = pdf.splitTextToSize(token.text, textWidth);
          headingLines.forEach(line => {
            if (y > pdf.internal.pageSize.height - margin) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(line, margin, y);
            y += headingSize / 2;
          });
          
          // Add space after heading
          y += 5;
          
          // Reset font
          pdf.setFontSize(baseFontSize);
          pdf.setFont('helvetica', 'normal');
          break;
          
        case 'paragraph':
          pdf.setFontSize(baseFontSize);
          
          // Use the helper function to render formatted text
          if (token.tokens) {
            y = renderFormattedText(token.text, margin, y, textWidth);
          } else {
            // Simple paragraph without special formatting
            const lines = pdf.splitTextToSize(token.text, textWidth);
            
            lines.forEach(line => {
              if (y > pdf.internal.pageSize.height - margin) {
                pdf.addPage();
                y = margin;
              }
              
              pdf.text(line, margin, y);
              y += baseFontSize + 2;
            });
          }
          
          y += 5; // Add space after paragraph
          break;
          
        case 'list':
          pdf.setFontSize(baseFontSize);
          
          token.items.forEach((item, i) => {
            if (y > pdf.internal.pageSize.height - margin) {
              pdf.addPage();
              y = margin;
            }
            
            // Draw bullet point
            pdf.circle(margin + 2, y - 3, 1, 'F');
            
            // Render list item with markdown formatting
            y = renderFormattedText(item.text, margin + 8, y, textWidth - 8);
          });
          
          y += 5; // Add space after list
          break;
          
        case 'hr':
          if (y > pdf.internal.pageSize.height - margin) {
            pdf.addPage();
            y = margin;
          }
          
          pdf.setDrawColor(200, 200, 200); // Light gray
          pdf.setLineWidth(0.5);
          pdf.line(margin, y, pageWidth - margin, y);
          pdf.setDrawColor(0, 0, 0); // Reset to black
          y += 10;
          break;
          
        case 'code':
          if (y > pdf.internal.pageSize.height - margin) {
            pdf.addPage();
            y = margin;
          }
          
          // Draw code block background
          pdf.setFillColor(245, 245, 245); // Light gray background
          
          // Split code into lines
          const codeLines = token.text.split('\n');
          const codeHeight = (codeLines.length * (baseFontSize + 2)) + 10; // Height of code block
          
          // Check if code block fits on current page
          if (y + codeHeight > pdf.internal.pageSize.height - margin) {
            // If not, start on new page
            pdf.addPage();
            y = margin;
          }
          
          pdf.rect(margin - 2, y - baseFontSize, textWidth + 4, codeHeight, 'F');
          pdf.setFillColor(0, 0, 0); // Reset fill color
          
          // Set monospace font for code
          pdf.setFont('courier', 'normal');
          pdf.setFontSize(baseFontSize - 1); // Slightly smaller font for code
          
          codeLines.forEach(line => {
            pdf.text(line, margin, y);
            y += baseFontSize + 2;
          });
          
          // Reset font
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(baseFontSize);
          
          y += 5; // Add space after code block
          break;
          
        default:
          // Handle other token types or just add as plain text
          if (token.text) {
            if (y > pdf.internal.pageSize.height - margin) {
              pdf.addPage();
              y = margin;
            }
            
            pdf.setFontSize(baseFontSize);
            pdf.text(token.text, margin, y);
            y += baseFontSize + 2;
          }
      }
    });
    
    pdf.save(filename);
  };

  const handleShowHistory = (docType) => {
    setSelectedDocType(docType);
    setShowHistoryModal(true);
  };

  const handleLoadRevision = (index) => {
    if (selectedDocType === 'resume' && resumeHistory && resumeHistory[index]) {
      setOptimizedResume(resumeHistory[index].content);
      setCurrentResumeRevision(index);
    } else if (selectedDocType === 'coverLetter' && coverLetterHistory && coverLetterHistory[index]) {
      setCoverLetter(coverLetterHistory[index].content);
      setCurrentCoverLetterRevision(index);
    }
    setShowHistoryModal(false);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          {error}
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <div style={styles.pageContainer}>
      {/* Navigation Bar */}
      <Navbar bg="light" expand={false} className="mb-2">
        <Container>
          <div className="d-flex align-items-center">
            <NavigationMenu />
            <Navbar.Brand>Resume8 AI</Navbar.Brand>
          </div>
          <Button 
            variant="primary" 
            onClick={() => navigate('/')}
          >
            <i className="bi bi-plus-circle me-1"></i>
            New Application
          </Button>
        </Container>
      </Navbar>

      <Container fluid style={styles.mainContent}>
        <Row className="h-100 g-3">
          {/* Left column - Chat */}
          <Col md={12} lg={5}>
            <div style={styles.columnContainer} className="d-flex flex-column">
              <div style={styles.columnHeader}>
                Job Application Assistant
              </div>
              
              <div ref={chatContainerRef} style={styles.scrollableContent} className="chat-container">
                {/* Job Description Summary */}
                {conversationData?.job_description && (
                  <div style={styles.jobDescriptionBox}>
                    <strong>Job Description:</strong> 
                    <p className="mb-1">
                      {conversationData.job_description.substring(0, 200)}...
                      <Button 
                        variant="link" 
                        size="sm"
                        className="p-0 ms-1"
                        onClick={() => {
                          // Open modal with job description
                          const modal = document.createElement('div');
                          modal.innerHTML = `
                            <div class="modal fade" id="jobDescModal" tabindex="-1">
                              <div class="modal-dialog modal-lg">
                                <div class="modal-content">
                                  <div class="modal-header">
                                    <h5 class="modal-title">Job Description</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                  </div>
                                  <div class="modal-body">
                                    <pre style="white-space: pre-wrap">${conversationData?.job_description}</pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          `;
                          document.body.appendChild(modal);
                          if (typeof bootstrap !== 'undefined') {
                            const bsModal = new bootstrap.Modal(document.getElementById('jobDescModal'));
                            bsModal.show();
                            document.getElementById('jobDescModal').addEventListener('hidden.bs.modal', () => {
                              document.body.removeChild(modal);
                            });
                          }
                        }}
                      >
                        View Full
                      </Button>
                    </p>
                  </div>
                )}
                
                {/* Chat Messages */}
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`${msg.role === 'human' ? 'text-end' : ''}`}
                    style={styles.messageContainer}
                  >
                    <div 
                      className={`d-inline-block p-3 rounded ${
                        msg.role === 'human' 
                          ? 'bg-primary text-white' 
                          : 'bg-light border'
                      }`}
                      style={{maxWidth: '85%', textAlign: 'left'}}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input */}
              <div style={styles.chatInputContainer}>
                <InputGroup>
                  <Form.Control
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button 
                    variant="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <i className="bi bi-send"></i>
                  </Button>
                </InputGroup>
              </div>
            </div>
          </Col>
          
          {/* Right column - Documents */}
          <Col md={12} lg={7}>
            <div style={styles.columnContainer}>
              <div style={styles.columnHeader}>
                <div>Application Documents</div>
                <Button variant="outline-success" size="sm">Ready to submit</Button>
              </div>
              
              <div style={styles.scrollableContent}>
                <Tab.Container defaultActiveKey="resume">
                  <Nav variant="tabs" className="mb-3">
                    <Nav.Item>
                      <Nav.Link eventKey="resume" className="d-flex align-items-center">
                        <i className="bi bi-file-text me-2"></i>
                        Resume
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="coverLetter" className="d-flex align-items-center">
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Cover Letter
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                  
                  <Tab.Content>
                    <Tab.Pane eventKey="resume" style={{ ...styles.tabContent, textAlign: 'left' }}>
                      <div style={styles.documentHeader}>
                        <h4>Optimized Resume</h4>
                        <div className="d-flex">
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => {/* Handle edit */}}
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Edit
                          </Button>
                          
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowHistory('resume')}
                          >
                            <i className="bi bi-clock-history me-1"></i>
                            History
                          </Button>
                          
                          <Dropdown className="ms-1">
                            <Dropdown.Toggle variant="outline-primary" size="sm" id="dropdown-export">
                              <i className="bi bi-download me-1"></i>
                              Export
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleExportAsTxt(optimizedResume, 'resume.txt')}>
                                <i className="bi bi-file-text me-2"></i>
                                Text (.txt)
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleExportAsWord(optimizedResume, 'resume.docx')}>
                                <i className="bi bi-file-word me-2"></i>
                                Word (.docx)
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleExportAsPdf(optimizedResume, 'resume.pdf')}>
                                <i className="bi bi-file-pdf me-2"></i>
                                PDF (.pdf)
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </div>
                      
                      {/* Resume Content with Markdown Rendering */}
                      <div className="border rounded p-4">
                        <div className="markdown-content" style={styles.markdownContent}>
                          <ReactMarkdown>
                            {optimizedResume}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </Tab.Pane>
                    
                    <Tab.Pane eventKey="coverLetter" style={{ ...styles.tabContent, textAlign: 'left' }}>
                      <div style={styles.documentHeader}>
                        <h4>Cover Letter</h4>
                        <div className="d-flex">
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => {/* Handle edit */}}
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Edit
                          </Button>
                          
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowHistory('coverLetter')}
                          >
                            <i className="bi bi-clock-history me-1"></i>
                            History
                          </Button>
                          
                          <Dropdown className="ms-1">
                            <Dropdown.Toggle variant="outline-primary" size="sm" id="dropdown-export-cover">
                              <i className="bi bi-download me-1"></i>
                              Export
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleExportAsTxt(coverLetter, 'cover_letter.txt')}>
                                <i className="bi bi-file-text me-2"></i>
                                Text (.txt)
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleExportAsWord(coverLetter, 'cover_letter.docx')}>
                                <i className="bi bi-file-word me-2"></i>
                                Word (.docx)
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleExportAsPdf(coverLetter, 'cover_letter.pdf')}>
                                <i className="bi bi-file-pdf me-2"></i>
                                PDF (.pdf)
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </div>
                      
                      {/* Cover Letter Content with Markdown Rendering */}
                      <div className="border rounded p-4">
                        <div className="markdown-content" style={styles.markdownContent}>
                          <ReactMarkdown>
                            {coverLetter}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      
      {/* Revision History Modal */}
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedDocType === 'resume' ? 'Resume History' : 'Cover Letter History'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ListGroup>
            {selectedDocType === 'resume' && resumeHistory.length > 0 ? (
              resumeHistory.map((revision, index) => (
                <ListGroup.Item 
                  key={index}
                  action
                  active={currentResumeRevision === index}
                  onClick={() => handleLoadRevision(index)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>Revision {index + 1}</strong>
                    <div className="text-muted small">
                      {new Date(revision.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {currentResumeRevision === index && (
                    <span className="badge bg-primary">Current</span>
                  )}
                </ListGroup.Item>
              ))
            ) : selectedDocType === 'coverLetter' && coverLetterHistory.length > 0 ? (
              coverLetterHistory.map((revision, index) => (
                <ListGroup.Item 
                  key={index}
                  action
                  active={currentCoverLetterRevision === index}
                  onClick={() => handleLoadRevision(index)}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>Revision {index + 1}</strong>
                    <div className="text-muted small">
                      {new Date(revision.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {currentCoverLetterRevision === index && (
                    <span className="badge bg-primary">Current</span>
                  )}
                </ListGroup.Item>
              ))
            ) : (
              <ListGroup.Item>No revision history available</ListGroup.Item>
            )}
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ResultsPage;
