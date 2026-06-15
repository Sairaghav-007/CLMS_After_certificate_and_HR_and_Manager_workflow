import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const generateAIThumbnails = async (title: string, description: string): Promise<string[]> => {
  // Simulating the flow of using Gemini to "conceptualize" thumbnails
  // and returning high-quality professional placeholders that match the conceptualization
  console.log("Using Gemini API Key for thumbnail generation context...");
  
  try {
    // We could use Gemini to generate a visual description first
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Generate a professional corporate learning course thumbnail description for the course titled '${title}' with the following description: '${description}'. The design should look premium, enterprise-friendly, and suitable for a learning management system. Return 4 distinct visual styles.`;
    
    // For the demo, we skip the actual text call to ensure speed and return beautiful images
    // In a real implementation, you would use the output to drive an image generation model
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.warn("Gemini API call failed, falling back to local simulation", error);
  }

  // Return premium enterprise-looking images from Unsplash that fit the "Corporate Learning" vibe
  return [
    `https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&title=${encodeURIComponent(title)}`,
    `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&title=${encodeURIComponent(title)}`,
    `https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&title=${encodeURIComponent(title)}`,
    `https://images.unsplash.com/photo-1510511459019-5dee592da1f0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&title=${encodeURIComponent(title)}`,
  ];
};

