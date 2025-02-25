"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Settings, RefreshCw, Copy, ThumbsUp, ThumbsDown, 
  PauseCircle, Sparkles, Cpu, BrainCircuit, Braces, 
  SlidersHorizontal, MessageSquare, Trash2, Download, 
  Moon, Sun, Loader2, Code, Clipboard, CheckCheck,
  ChevronDown, X, ArrowLeft, PanelLeftOpen, PanelLeftClose,
  FileImage, FileText, Film, FileVideo, File as FileIcon,
  Paperclip, ImageIcon, Upload, Menu, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { TextShimmerWave } from '@/components/ui/text-shimmer-wave';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { MarkdownContent } from "@/components/ui/markdown-content";

// In the gemini-chat.tsx file, modify the imports at the top to include createChatSession
import { 
  GEMINI_MODELS, 
  createGeminiChat, 
  createModel,
  createChatSession,  // Add this import
  sendMessageWithFilesStream,
  getThinkingProcess
} from '@/lib/gemini-api';

// Import file uploader component 
import { FileUploader, FileUploadButton } from '@/components/ui/file-uploader';

// Types for messages
interface Message {
  id: number;
  content: string;
  role: string;
  timestamp: Date;
  files?: File[];
  thinking?: string;
}

// Date formatter
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

// Available models
const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.0-flash-thinking-exp-01-21',
    name: 'Gemini 2.0 Flash Thinking',
    description: 'Supports visible reasoning process (Flash Thinking)',
    maxTokens: 65536,
    defaultTemp: 0.9,  // Increased temperature for more creative responses
    thinkingEnabled: true,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Fast, lightweight model for quick responses',
    maxTokens: 8192,
    defaultTemp: 1.0,
    thinkingEnabled: false,
  },
  {
    id: 'gemini-2.0-flash-lite-preview-02-05',
    name: 'Gemini 2.0 Flash Lite',
    description: 'Preview version for leaner, faster responses',
    maxTokens: 8192,
    defaultTemp: 1.0,
    thinkingEnabled: false,
  }
];

// Message types
export const MessageType = {
  USER: 'user',
  AI: 'model',
  SYSTEM: 'system',
  THINKING: 'thinking',
};

// Code block component
const CodeBlock = ({ code, language }: { code: string, language: string }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="relative mt-2 mb-4 rounded-md overflow-hidden bg-zinc-950 dark:bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-800 text-xs text-zinc-100">
        <span>{language || 'Code'}</span>
        <button 
          onClick={copyToClipboard}
          className="flex items-center gap-1 hover:text-white"
        >
          {copied ? (
            <>
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Clipboard className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Thinking indicator component
const ThinkingIndicator = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-3 my-2 bg-muted/50 border border-muted rounded-md">
      <div className="flex items-center">
        <span className="animate-thinking-dot bg-primary h-1.5 w-1.5 rounded-full"></span>
        <span className="animate-thinking-dot bg-primary h-1.5 w-1.5 rounded-full mx-1"></span>
        <span className="animate-thinking-dot bg-primary h-1.5 w-1.5 rounded-full"></span>
      </div>
      <span>Thinking...</span>
    </div>
  );
};

// Add this new component for collapsible thinking process
const ThinkingProcessDisplay = ({ content, visible, onToggle }: { content: string, visible: boolean, onToggle: () => void }) => {
  if (!content) return null;
  
  return (
    <div className="flex flex-col gap-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 sm:p-4 mt-2">
      <div 
        className="flex items-center justify-between cursor-pointer hover:opacity-80"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BrainCircuit className="h-4 w-4" />
          <span>Thinking Process</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronDown className={cn("h-4 w-4 transition-transform", !visible && "-rotate-90")} />
        </Button>
      </div>
      
      {visible && (
        <div className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
};

// Add MediaPreviewModal component
const MediaPreviewModal = ({ 
  file, 
  previewUrl, 
  isOpen, 
  onClose 
}: { 
  file: File;
  previewUrl: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-white/80 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="relative rounded-lg overflow-hidden bg-background/5">
          {file.type.startsWith('image/') ? (
            <img
              src={previewUrl}
              alt={file.name}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          ) : file.type.startsWith('video/') ? (
            <div className="relative">
              <video
                ref={videoRef}
                src={previewUrl}
                className="w-full h-auto max-h-[80vh]"
                controls
                controlsList="nodownload"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={(e) => e.stopPropagation()}
              />
              <div 
                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={togglePlay}
                  className="p-4 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  {isPlaying ? (
                    <PauseCircle className="h-12 w-12" />
                  ) : (
                    <Play className="h-12 w-12" />
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-white text-sm">{file.name}</p>
        </div>
      </div>
    </div>
  );
};

// Update MessageFilePreview component
const MessageFilePreview = ({ file }: { file: File }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleClick = () => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div 
        className="relative group cursor-pointer"
        onClick={handleClick}
      >
        {file.type.startsWith('image/') ? (
          <div className="relative w-48 h-32 overflow-hidden rounded-md bg-muted">
            <img
              src={previewUrl}
              alt={file.name}
              className="object-cover w-full h-full transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : file.type.startsWith('video/') ? (
          <div className="relative w-48 h-32 overflow-hidden rounded-md bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
            <Film className="h-8 w-8 text-muted-foreground" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="h-8 w-8 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground mt-2">{file.name}</span>
          </div>
        ) : (
          <div className="relative w-48 h-32 overflow-hidden rounded-md bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-2">{file.name}</span>
          </div>
        )}
      </div>

      <MediaPreviewModal
        file={file}
        previewUrl={previewUrl}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

// Update the input area preview component
const InputFilePreview = ({ file, onRemove }: { file: File; onRemove: () => void }) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click from triggering when clicking the remove button
    if ((e.target as HTMLElement).closest('button')) return;
    
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div 
        className="relative flex-shrink-0 cursor-pointer"
        onClick={handleClick}
      >
        {file.type.startsWith('image/') ? (
          <div className="relative w-24 h-24 overflow-hidden rounded-lg bg-muted">
            <img
              src={previewUrl}
              alt={file.name}
              className="object-cover w-full h-full transition-transform hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity" />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1 right-1 p-1 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : file.type.startsWith('video/') ? (
          <div className="relative w-24 h-24 overflow-hidden rounded-lg bg-muted flex flex-col items-center justify-center hover:bg-muted/80 transition-colors">
            <Film className="h-8 w-8 text-muted-foreground" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Play className="h-8 w-8 text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 px-2 text-center line-clamp-2">{file.name}</span>
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1 right-1 p-1 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="relative w-24 h-24 overflow-hidden rounded-lg bg-muted flex flex-col items-center justify-center">
            {getFileIcon(file)}
            <span className="text-[10px] text-muted-foreground mt-1 px-2 text-center line-clamp-2">{file.name}</span>
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-1 right-1 p-1 rounded-full bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/90 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <MediaPreviewModal
        file={file}
        previewUrl={previewUrl}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

// Main chat component
export function GeminiAdvancedChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingContent, setThinkingContent] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Gemini settings
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful and knowledgeable AI assistant. You can engage with any topic and provide comprehensive information while maintaining factual accuracy. You should aim to be direct and thorough in your responses. When discussing complex or sensitive topics, provide balanced and well-reasoned explanations."
  );
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.95);
  const [topK, setTopK] = useState(64);
  const [maxOutputTokens, setMaxOutputTokens] = useState(65536);
  const [showThinking, setShowThinking] = useState(true);
  const [codeExecutionEnabled, setCodeExecutionEnabled] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatSessionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Inside GeminiAdvancedChat component, add this new state
  const [isThinkingVisible, setIsThinkingVisible] = useState(true);

  // Add state for sheet width
  const [sheetWidth, setSheetWidth] = useState<string>('md');

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          content: `Hello! I'm Gemini AI, ready to assist you. Feel free to ask me anything or upload images, documents, or other files for analysis.`,
          role: MessageType.SYSTEM,
          timestamp: new Date(),
        }
      ]);
    }
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamedResponse]);

  // Handle theme change
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle media query for mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // On mobile, default to closed sidebar
        setIsSidebarOpen(false);
      }
    };
    
    // Set initial state
    handleResize();
    
    // Listen for window resize events
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update sheet width based on window size
  useEffect(() => {
    const updateSheetWidth = () => {
      setSheetWidth(window.innerWidth < 640 ? '85vw' : 'md');
    };
    
    // Set initial width
    updateSheetWidth();
    
    // Add resize listener
    window.addEventListener('resize', updateSheetWidth);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateSheetWidth);
  }, []);

  // Initialize or reset Gemini chat session
  const initGeminiChat = () => {
    try {
      // Get the model with current settings
      const model = createModel({
        modelName: selectedModel.id,
        systemInstruction: `${systemPrompt}\nPlease provide direct, comprehensive responses. When encountering potentially sensitive topics, focus on providing factual, analytical insights while maintaining professionalism.`,
        enableCodeExecution: codeExecutionEnabled
      });
      
      // Create generation config with more permissive settings
      const generationConfig = {
        temperature: Math.max(temperature, 0.7), // Ensure minimum temperature of 0.7
        topP: Math.max(topP, 0.95), // Ensure minimum topP of 0.95
        topK: Math.max(topK, 40), // Ensure minimum topK of 40
        maxOutputTokens: maxOutputTokens,
        responseMimeType: "text/plain",
        candidateCount: 1,
        stopSequences: [],
      };
      
      // Format history for Gemini API - only include user/AI messages, skip system messages
      const history = messages
        .filter(msg => (msg.role === MessageType.USER || msg.role === MessageType.AI))
        .map(msg => ({
          role: msg.role as 'user' | 'model',
          parts: [{ text: msg.content }]
        }));
      
      // Only initialize chat with history if there's a valid user-first sequence
      if (history.length === 0 || history[0].role === 'model') {
        chatSessionRef.current = model.startChat({
          generationConfig,
        });
      } else {
        chatSessionRef.current = model.startChat({
          generationConfig,
          history
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error initializing chat:", error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session",
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;
    
    const userPrompt = input.trim();
    setInput('');
    
    // Handle response
    await generateResponse(userPrompt);
    
    // Focus input after sending
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle file selection
  const handleFileSelection = (files: File[]) => {
    setUploadedFiles(files);
    
    // Show notification about files using the correct toast API
    if (files.length > 0) {
      toast({
        title: "Files attached",
        description: `${files.length} file${files.length > 1 ? 's' : ''} ready to upload`,
      });
    }
  };
  
  // Get file type icon
  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />;
    if (type.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    if (type.includes('word') || type.includes('document')) return <FileText className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  // Generate response from Gemini
  const generateResponse = async (prompt: string) => {
    setIsLoading(true);
    setIsStreaming(true);
    setStreamedResponse('');
    setThinkingContent('');
    
    // Helper function to create a more permissive version of the prompt
    const createPermissivePrompt = (originalPrompt: string) => {
      return `Please provide a comprehensive analysis and your insights about the following, focusing on factual information and analytical perspectives: ${originalPrompt}`;
    };
    
    // Create a preview of files if any
    let promptWithFiles = prompt;
    if (uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map(f => f.name).join(', ');
      promptWithFiles = `${prompt}\n\n[Attached files: ${fileNames}]`;
    }
    
    // Add user message (including file info in display)
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: promptWithFiles,
      role: MessageType.USER,
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    }]);
    
    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      // Initialize chat if needed
      if (!chatSessionRef.current) {
        const initialized = initGeminiChat();
        if (!initialized) {
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }
      }
      
      // Handle thinking first if enabled
      if (showThinking && selectedModel.thinkingEnabled) {
        setIsThinking(true);
        
        try {
          // Get thinking process
          const thinkingText = await getThinkingProcess(prompt, selectedModel.id);
          
          // Store thinking content if there's any
          if (thinkingText) {
            setThinkingContent(thinkingText);
          }
        } catch (error) {
          console.error("Error generating thinking:", error);
        } finally {
          setIsThinking(false);
        }
      }
      
      let fullResponse = '';
      
      // Modified message sending to handle potential blocks
      if (uploadedFiles.length > 0) {
        try {
          fullResponse = await sendMessageWithFilesStream(
            chatSessionRef.current, 
            prompt,
            uploadedFiles,
            (chunk) => {
              setStreamedResponse(prev => prev + chunk);
            },
            abortController.signal
          );
        } catch (error: any) {
          if (error.message?.includes('RECITATION')) {
            // Retry with a modified prompt
            const modifiedPrompt = createPermissivePrompt(prompt);
            fullResponse = await sendMessageWithFilesStream(
              chatSessionRef.current,
              modifiedPrompt,
              uploadedFiles,
              (chunk) => {
                setStreamedResponse(prev => prev + chunk);
              },
              abortController.signal
            );
          } else {
            throw error;
          }
        }
      } else {
        try {
          const result = await chatSessionRef.current.sendMessageStream(
            prompt,
            { signal: abortController.signal }
          );
          
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            setStreamedResponse(prev => prev + chunkText);
          }
        } catch (error: any) {
          if (error.message?.includes('RECITATION')) {
            // Retry with a modified prompt
            const modifiedPrompt = createPermissivePrompt(prompt);
            const retryResult = await chatSessionRef.current.sendMessageStream(
              modifiedPrompt,
              { signal: abortController.signal }
            );
            
            for await (const chunk of retryResult.stream) {
              const chunkText = chunk.text();
              fullResponse += chunkText;
              setStreamedResponse(prev => prev + chunkText);
            }
          } else {
            throw error;
          }
        }
      }
      
      // Add final response to messages
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: fullResponse,
        role: MessageType.AI,
        timestamp: new Date(),
        thinking: thinkingContent // Store thinking content with the message
      }]);
      
      // Clear uploaded files after sending
      setUploadedFiles([]);
      
    } catch (error: any) {
      console.error('Error generating response:', error);
      
      // Only show error if not intentionally aborted
      if (!error.message?.includes('abort')) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: 'Sorry, I encountered an error. Please try again.',
          role: MessageType.SYSTEM,
          timestamp: new Date(),
        }]);
        
        toast({
          title: 'Error',
          description: `Failed to generate a response: ${error.message}`,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamedResponse('');
      abortControllerRef.current = null;
      setUploadedFiles([]); // Clear files regardless of outcome
    }
  };

  // Reset conversation
  const resetChat = () => {
    setMessages([]);
    chatSessionRef.current = null;
    
    // Add welcome message
    setTimeout(() => {
      setMessages([{
        id: Date.now(),
        content: `Hello! I'm Gemini AI, ready to assist you. Feel free to ask me anything or upload images, documents, or other files for analysis.`,
        role: MessageType.SYSTEM,
        timestamp: new Date(),
      }]);
    }, 100);
    
    toast({
      title: "Chat reset",
      description: "Started a new conversation",
    });
    
    // Close mobile menu if open
    setIsMobileMenuOpen(false);
  };

  // Cancel ongoing generation
  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsLoading(false);
    setIsStreaming(false);
    setStreamedResponse('');
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: "Response generation cancelled.",
      role: MessageType.SYSTEM,
      timestamp: new Date(),
    }]);
  };

  // Copy message to clipboard
  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard",
    });
  };

  // Handle model change
  const handleModelChange = (modelId: string) => {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    if (!model) return;
    
    setSelectedModel(model);
    
    // Update max tokens based on model
    setMaxOutputTokens(model.maxTokens);
    
    // Update temperature if needed
    setTemperature(model.defaultTemp);
    
    // Reset chat session when model changes
    chatSessionRef.current = null;
    
    toast({
      title: "Model changed",
      description: `Now using ${model.name}`,
    });
  };

  // Apply settings changes
  const applySettings = () => {
    // Reset chat session to apply new settings
    chatSessionRef.current = null;
    
    toast({
      title: "Settings updated",
      description: "New settings will apply to your next message",
    });
    
    // Close sidebar if open
    setIsSidebarOpen(false);
  };

  // Process message content for display (handle code blocks, etc)
  const processMessageContent = (content: string) => {
    // Pattern for code blocks: ```language\ncode\n```
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)\n```/g;
    
    // Split by code blocks
    const parts = content.split(codeBlockRegex);
    
    if (parts.length === 1) {
      // No code blocks, return the content directly
      return <span>{content}</span>;
    }
    
    const renderedContent = [];
    
    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0) {
        // Text part
        if (parts[i]) {
          renderedContent.push(<span key={`text-${i}`}>{parts[i]}</span>);
        }
      } else if (i % 3 === 2) {
        // Code part
        const language = parts[i - 1] || '';
        const code = parts[i];
        renderedContent.push(
          <CodeBlock key={`code-${i}`} code={code} language={language} />
        );
      }
    }
    
    return <>{renderedContent}</>;
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-[#f9fafb] dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background dark:bg-zinc-900 dark:border-zinc-800 px-2 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Settings button - hidden on mobile when menu is showing */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={cn(isMobileMenuOpen ? "hidden" : "block", "md:block")}
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <div className="hidden md:flex items-center gap-1.5">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">Gemini AI Chat</span>
            </div>
            
            <div className="hidden md:block">
              <Badge variant="outline" className="ml-2 font-mono text-xs">
                {selectedModel.name}
              </Badge>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 p-4 md:hidden">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Gemini AI</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      setIsSidebarOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={resetChat}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start"
                    onClick={() => {
                      setIsDarkMode(!isDarkMode);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {isDarkMode ? (
                      <>
                        <Sun className="h-4 w-4 mr-2" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 mr-2" />
                        Dark Mode
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="pt-2 border-t dark:border-zinc-800">
                  <p className="text-xs text-muted-foreground">Current Model:</p>
                  <p className="text-sm font-medium">{selectedModel.name}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {/* Hidden on mobile to save space */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={resetChat}
                    className="hidden md:flex"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">New Chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                  >
                    {isDarkMode ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>
      
      {/* Settings sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent 
          side="left" 
          className="sm:max-w-md"
          style={{ width: sheetWidth === 'md' ? undefined : sheetWidth }}
        >
          <SheetHeader className="px-1">
            <SheetTitle>Gemini AI Settings</SheetTitle>
            <SheetDescription>
              Configure your AI assistant settings
            </SheetDescription>
          </SheetHeader>
          
          <Tabs defaultValue="model" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="params">Parameters</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            <TabsContent value="model" className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Select Model</label>
                <Select
                  value={selectedModel.id}
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedModel.description}
                </p>
              </div>
              
              {selectedModel.thinkingEnabled && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      Show thinking process
                    </label>
                    <p className="text-xs text-muted-foreground">
                      See Gemini's reasoning before the answer
                    </p>
                  </div>
                  <Switch
                    checked={showThinking}
                    onCheckedChange={setShowThinking}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">
                    Enable code execution
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Allow the model to run code
                  </p>
                </div>
                <Switch
                  checked={codeExecutionEnabled}
                  onCheckedChange={setCodeExecutionEnabled}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="params" className="mt-4 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Temperature</label>
                    <span className="text-sm text-muted-foreground">
                      {temperature.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[temperature]}
                    min={0}
                    max={1.0}
                    step={0.1}
                    onValueChange={(value) => setTemperature(value[0])}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values make output more random
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Top P</label>
                    <span className="text-sm text-muted-foreground">
                      {topP.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[topP]}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onValueChange={(value) => setTopP(value[0])}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Top K</label>
                    <span className="text-sm text-muted-foreground">
                      {topK}
                    </span>
                  </div>
                  <Slider
                    value={[topK]}
                    min={1}
                    max={100}
                    step={1}
                    onValueChange={(value) => setTopK(value[0])}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Max Output Tokens
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {maxOutputTokens}
                    </span>
                  </div>
                  <Slider
                    value={[maxOutputTokens]}
                    min={1000}
                    max={selectedModel.maxTokens}
                    step={1000}
                    onValueChange={(value) => setMaxOutputTokens(value[0])}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="system" className="mt-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">System Prompt</label>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[150px] resize-y"
                  placeholder="Instructions for the AI assistant..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Guide the AI's behavior with specific instructions
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 flex justify-end">
            <Button onClick={applySettings}>
              Apply Settings
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto py-2 px-2 sm:py-4 sm:px-4 md:py-6">
        <div className="max-w-4xl mx-auto">
          <ScrollArea className="h-[calc(100vh-140px)] sm:h-[calc(100vh-160px)]">
            <div className="flex flex-col gap-4 sm:gap-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === MessageType.USER ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col max-w-[85%] sm:max-w-[80%] md:max-w-[70%] rounded-lg p-3 sm:p-4",
                      message.role === MessageType.USER && "bg-primary text-primary-foreground",
                      message.role === MessageType.AI && "bg-muted",
                      message.role === MessageType.SYSTEM && "bg-muted text-muted-foreground text-sm italic"
                    )}
                  >
                    {/* Message content section */}
                    <div>
                      {message.role === MessageType.AI ? (
                        <MarkdownContent content={message.content} />
                      ) : (
                        <>
                          <MarkdownContent 
                            content={(message.files && message.files.length > 0)
                              ? message.content.split('\n\n[Attached files:')[0]
                              : message.content
                            }
                          />
                          {/* Add file previews for user messages */}
                          {message.files && message.files.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 max-w-full">
                              {message.files.map((file, index) => (
                                <MessageFilePreview key={index} file={file} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Add thinking process display for AI messages */}
                    {message.role === MessageType.AI && message.thinking && selectedModel.thinkingEnabled && showThinking && (
                      <ThinkingProcessDisplay
                        content={message.thinking}
                        visible={isThinkingVisible}
                        onToggle={() => setIsThinkingVisible(!isThinkingVisible)}
                      />
                    )}
                    
                    {/* Existing message footer */}
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{formatDate(message.timestamp)}</span>
                      
                      {message.role !== MessageType.USER && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyMessageToClipboard(message.content)}
                            className="p-1 hover:text-foreground rounded-sm"
                            aria-label="Copy message"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          
                          {message.role === MessageType.AI && (
                            <>
                              <button
                                className="p-1 hover:text-foreground rounded-sm"
                                aria-label="Thumbs Up"
                              >
                                <ThumbsUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                className="p-1 hover:text-foreground rounded-sm"
                                aria-label="Thumbs Down"
                              >
                                <ThumbsDown className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="flex flex-col max-w-[85%] sm:max-w-[80%] md:max-w-[70%] rounded-lg p-3 sm:p-4 bg-muted">
                    <div className="prose prose-zinc dark:prose-invert max-w-none prose-sm sm:prose-base">
                      {streamedResponse ? (
                        <TextGenerateEffect
                          words={streamedResponse}
                          className="text-sm font-normal"
                          duration={0.5}
                          filter={false}
                        />
                      ) : (
                        <TextShimmerWave
                          className="text-sm font-normal"
                          duration={1}
                        >
                          Generating response...
                        </TextShimmerWave>
                      )}
                    </div>
                    
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 sm:h-8 px-2 text-xs"
                        onClick={cancelGeneration}
                      >
                        <PauseCircle className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {isThinking && (
                <div className="flex justify-start">
                  <div className="flex flex-col max-w-[85%] sm:max-w-[80%] md:max-w-[70%] rounded-lg p-3 sm:p-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <BrainCircuit className="h-3.5 w-3.5" />
                      <span>Thinking...</span>
                    </div>
                    <ThinkingIndicator visible={true} />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </main>
      
      {/* Input Area */}
      <div className="sticky bottom-0 z-10 border-t bg-background dark:bg-zinc-900 dark:border-zinc-800 px-2 sm:px-4 py-2 sm:py-4">
        <form 
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto"
        >
          {/* File preview if files are uploaded */}
          {uploadedFiles.length > 0 && (
            <div className="mb-3">
              <div className="flex gap-2 overflow-x-auto pb-2 max-w-full">
                {uploadedFiles.map((file, index) => (
                  <InputFilePreview
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => setUploadedFiles(files => files.filter((_, i) => i !== index))}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFiles([])}
                  className="text-xs h-6 px-2"
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
          
          <div className="relative flex items-center">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="pr-16 pl-10 py-5 sm:py-6 rounded-full border-zinc-300 dark:border-zinc-700 focus-visible:ring-primary"
              placeholder="Ask Gemini something..."
            />
            
            <div className="absolute left-2 sm:left-3 flex items-center">
              <FileUploadButton
                onFilesSelected={handleFileSelection}
                disabled={isLoading}
              />
            </div>
            
            <div className="absolute right-2 flex items-center">
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                className={cn(
                  "rounded-full h-8 w-8 sm:h-10 sm:w-10",
                  isLoading && "bg-primary/80"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="flex justify-between mt-2 text-xs text-muted-foreground px-2">
            <div className="flex items-center gap-2 flex-wrap text-[10px] sm:text-xs">
              <span className="truncate max-w-[80px] sm:max-w-none">{selectedModel.name.replace('gemini-', '')}</span>
              <span className="hidden xs:inline">•</span>
              <span>Temp: {temperature.toFixed(1)}</span>
              {uploadedFiles.length > 0 && (
                <>
                  <span className="hidden xs:inline">•</span>
                  <span>Files: {uploadedFiles.length}</span>
                </>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="hover:text-foreground transition-colors hidden sm:block"
            >
              Customize settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}