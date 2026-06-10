import { GoogleGenerativeAI } from '@google/generative-ai';
import Service from '../models/service.model.js';

// Initialize the Google Generative AI with the API key
// We create it dynamically in the function or here if it exists.
// We'll init inside to ensure process.env is fully loaded

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    
    // 1. Validate if user is premium student
    // The route will use protect middleware, so req.user exists
    if (!req.user?.isPro) {
      return res.status(403).json({ 
        success: false, 
        message: 'This premium feature is only available to Pro students. Please upgrade your subscription.' 
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'AI Chatbot is not configured properly on the server.' 
      });
    }

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required.' 
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // 2. Fetch all transportation services from the database
    const transports = await Service.find({ type: 'transport', status: 'active' }).select('-ownerId -__v');

    // 3. Construct the context prompt
    const contextStr = transports.map(t => {
      const routesStr = t.routes && t.routes.length > 0 
        ? t.routes.map(r => `- ${r.name}: ${r.price} VND`).join('\n      ')
        : 'N/A';
        
      return `
      Name: ${t.name}
      Description: ${t.description}
      Address: ${t.address}, ${t.district}, ${t.city}
      Vehicle Type: ${t.vehicleType || 'N/A'}
      Seats: ${t.seats || 'N/A'}
      Rating: ${t.rating} / 5 (${t.reviewCount} reviews)
      Routes: 
      ${routesStr}
      `;
    }).join('\n');

    const systemInstruction = `You are a helpful transportation assistant for a student platform called StuGo. 
You are talking to a premium student user.
You MUST ONLY recommend transportation options from the following database of available transport services:
${contextStr}

If the user asks for something outside of this database, politely inform them that you only have information about the transports listed in StuGo's database.
Do not make up any transportation services.
Answer the user's query clearly, concisely, and in a friendly manner.`;

    // 4. Generate response with fallback
    let responseText;
    try {
      console.log('🤖 Attempting AI generation using gemini-1.5-flash...');
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
      });
      const result = await model.generateContent(message);
      responseText = result.response.text();
    } catch (flashError) {
      console.warn('⚠️ Gemini 1.5 Flash generation failed, falling back to gemini-1.5-pro:', flashError.message);
      try {
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-pro",
          systemInstruction: systemInstruction
        });
        const result = await model.generateContent(message);
        responseText = result.response.text();
      } catch (proError) {
        console.error('❌ Both Gemini Flash and Pro models failed:', proError);
        throw proError; // Let the outer catch handle it
      }
    }

    res.json({
      success: true,
      data: responseText
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response from AI',
      error: error.message
    });
  }
};
