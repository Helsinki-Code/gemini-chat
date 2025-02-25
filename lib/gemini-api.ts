// This file contains the actual implementation of the Gemini API calls
// Using the exact code structure provided in the examples

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerativeModel, ChatSession, Part } from '@google/generative-ai';

// Types for our configuration
interface GenerationConfig {
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  responseMimeType: string;
}

interface ChatMessage {
  role: 'user' | 'model' | 'system';
  parts: Part[];
}

// API key - in production, use environment variables properly
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyB8UaBLqyCGxJEJgmfvpSvx2Fk1tbWYBgs';

// Initialize the API client
const genAI = new GoogleGenerativeAI(API_KEY);

// Supported models
export const GEMINI_MODELS = {
  FLASH_THINKING: 'gemini-2.0-flash-thinking-exp-01-21',
  FLASH: 'gemini-2.0-flash',
  FLASH_LITE: 'gemini-2.0-flash-lite-preview-02-05'
};

/**
 * Creates a new model instance with the specified configurations
 */
export function createModel({ 
  modelName = GEMINI_MODELS.FLASH_THINKING, 
  systemInstruction = "You are a helpful AI assistant.",
  enableCodeExecution = true
}: {
  modelName?: string;
  systemInstruction?: string;
  enableCodeExecution?: boolean;
}): GenerativeModel {
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction,
    tools: enableCodeExecution ? [{ codeExecution: {} }] : [],
  });
}

/**
 * Creates a chat session with the specified model and configuration
 */
export function createChatSession({
  model,
  generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 65536,
    responseMimeType: "text/plain",
  },
  history = []
}: {
  model: GenerativeModel;
  generationConfig?: GenerationConfig;
  history?: ChatMessage[];
}): ChatSession {
  return model.startChat({
    generationConfig,
    history,
  });
}

/**
 * Prepares file data for sending to the Gemini API
 */
export async function prepareFilePart(file: File): Promise<{inlineData: {data: string, mimeType: string}}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      // Get the base64 data without the data URL prefix
      const base64Data = (reader.result as string).split(',')[1];
      
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  });
}

/**
 * Sends a message with files to the chat session and streams the response
 */
export async function sendMessageWithFilesStream(
  chatSession: ChatSession, 
  message: string, 
  files: File[] = [], 
  onChunk?: (chunk: string) => void, 
  signal?: AbortSignal
): Promise<string> {
  try {
    // Prepare message parts - start with text
    const parts: Part[] = [];
    
    // Add text part
    if (message.trim()) {
      parts.push({ text: message } as Part);
    }
    
    // Add file parts if any
    if (files && files.length > 0) {
      // Process files in parallel
      const fileParts = await Promise.all(files.map(file => prepareFilePart(file)));
      parts.push(...fileParts as Part[]);
    }
    
    // Send the message with all parts
    const result = await chatSession.sendMessageStream(
      parts,
      signal ? { signal } : undefined
    );
    
    let fullResponse = '';
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      if (onChunk) onChunk(chunkText);
    }
    
    return fullResponse;
  } catch (error: any) {
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }
    
    // Handle specific API errors
    if (error.message?.includes('Failed to process file')) {
      throw new Error('Failed to process one or more files. Please check the file format and size.');
    }
    
    throw error;
  }
}

/**
 * Sends a message to the chat session and streams the response
 */
export async function sendMessageStream(
  chatSession: ChatSession, 
  message: string, 
  onChunk?: (chunk: string) => void, 
  signal?: AbortSignal
): Promise<string> {
  try {
    const result = await chatSession.sendMessageStream(message, signal ? { signal } : undefined);
    let fullResponse = '';
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      if (onChunk) onChunk(chunkText);
    }
    
    return fullResponse;
  } catch (error: any) {
    if (signal?.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }
    throw error;
  }
}

/**
 * Sends a message to the chat session and returns the response
 */
export async function sendMessage(
  chatSession: ChatSession, 
  message: string, 
  signal?: AbortSignal
): Promise<string> {
  const result = await chatSession.sendMessage(message, signal ? { signal } : undefined);
  return result.response.text();
}

/**
 * Creates a full chat implementation based on the provided code samples
 */
export function createGeminiChat({
  modelName = GEMINI_MODELS.FLASH_THINKING,
  systemInstruction = "You are a helpful AI assistant.",
  temperature = 0.7,
  topP = 0.95,
  topK = 64,
  maxOutputTokens = 65536,
  enableCodeExecution = true,
  initialHistory = []
}: {
  modelName?: string;
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  enableCodeExecution?: boolean;
  initialHistory?: ChatMessage[];
}) {
  // Use the exact structure from the provided code
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction,
    tools: enableCodeExecution ? [{ codeExecution: {} }] : [],
  });
  
  const generationConfig = {
    temperature,
    topP,
    topK,
    maxOutputTokens,
    responseMimeType: "text/plain",
  };
  
  let chatSession = model.startChat({
    generationConfig,
    history: initialHistory,
  });
  
  return {
    // Send a message and get the response (non-streaming)
    async sendMessage(message: string) {
      const result = await chatSession.sendMessage(message);
      return result.response.text();
    },
    
    // Send a message and stream the response
    async sendMessageStream(message: string, onChunk?: (chunk: string) => void, signal?: AbortSignal) {
      return sendMessageStream(chatSession, message, onChunk, signal);
    },
    
    // Send a message with files and stream the response
    async sendMessageWithFiles(message: string, files: File[], onChunk?: (chunk: string) => void, signal?: AbortSignal) {
      return sendMessageWithFilesStream(chatSession, message, files, onChunk, signal);
    },
    
    // Get the current chat session
    getChatSession() {
      return chatSession;
    },
    
    // Reset the chat session
    resetChat(newHistory: ChatMessage[] = []) {
      chatSession = model.startChat({
        generationConfig,
        history: newHistory,
      });
    },
    
    // Update configuration and reset chat session
    updateConfig({
      newModelName = modelName,
      newSystemInstruction = systemInstruction,
      newTemperature = temperature,
      newTopP = topP,
      newTopK = topK,
      newMaxOutputTokens = maxOutputTokens,
      newEnableCodeExecution = enableCodeExecution,
      newHistory = []
    }: {
      newModelName?: string;
      newSystemInstruction?: string;
      newTemperature?: number;
      newTopP?: number;
      newTopK?: number;
      newMaxOutputTokens?: number;
      newEnableCodeExecution?: boolean;
      newHistory?: ChatMessage[];
    }) {
      // Update local variables
      modelName = newModelName;
      systemInstruction = newSystemInstruction;
      temperature = newTemperature;
      topP = newTopP;
      topK = newTopK;
      maxOutputTokens = newMaxOutputTokens;
      enableCodeExecution = newEnableCodeExecution;
      
      // Create new model and config
      const updatedModel = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
        tools: enableCodeExecution ? [{ codeExecution: {} }] : [],
      });
      
      const updatedConfig = {
        temperature,
        topP,
        topK,
        maxOutputTokens,
        responseMimeType: "text/plain",
      };
      
      // Update chat session
      chatSession = updatedModel.startChat({
        generationConfig: updatedConfig,
        history: newHistory,
      });
      
      return {
        modelName,
        systemInstruction,
        temperature,
        topP,
        topK,
        maxOutputTokens,
        enableCodeExecution
      };
    }
  };
}

/**
 * Creates a model specifically for showing the thinking process
 */
export function createThinkingModel(modelName = GEMINI_MODELS.FLASH_THINKING): GenerativeModel {
  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: "Show your step-by-step thinking process before answering. Break down complex problems methodically.",
  });
}

/**
 * Gets the thinking process for a prompt
 */
export async function getThinkingProcess(prompt: string, modelName = GEMINI_MODELS.FLASH_THINKING): Promise<string | null> {
  try {
    const thinkingModel = createThinkingModel(modelName);
    const result = await thinkingModel.generateContent(prompt);
    const fullText = result.response.text();
    
    // Extract just the thinking part
    const thinkingSections = fullText.split(/\n\nTherefore,|\n\nIn conclusion,|\n\nTo summarize,|\n\nSo,/i);
    return thinkingSections[0] || fullText;
  } catch (error) {
    console.error("Error generating thinking process:", error);
    return null;
  }
}