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

    const rawApiKey = process.env.GEMINI_API_KEY;
    if (!rawApiKey) {
      return res.status(500).json({ 
        success: false, 
        message: 'AI Chatbot is not configured properly on the server.' 
      });
    }

    // Strip quotes and trim whitespace if they were mistakenly added in environment config
    const apiKey = rawApiKey.trim().replace(/^['"]|['"]$/g, '');

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message is required.' 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

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

    const systemInstruction = `Bạn là trợ lý ảo tìm kiếm phương tiện di chuyển thông minh cho nền tảng sinh viên StuGo.
Bạn đang trò chuyện với một sinh viên cao cấp (Premium).
Bạn chỉ được phép gợi ý và giới thiệu các phương tiện/nhà xe di chuyển nằm trong danh sách dịch vụ sau đây:
${contextStr}

LƯU Ý CỰC KỲ QUAN TRỌNG VỀ PHONG CÁCH NÓI CHUYỆN:
- Tuyệt đối KHÔNG sử dụng các từ ngữ mang tính kỹ thuật hoặc hệ thống như "cơ sở dữ liệu", "cơ sở dữ liệu của StuGo", "database", "trong danh sách", "hệ thống của tôi", v.v. Điều này làm mất đi tính tự nhiên và chuyên nghiệp.
- Nếu khách hàng hỏi về các chuyến xe/tuyến đường hoặc địa điểm không nằm trong danh sách dịch vụ phía trên, hãy trả lời một cách lịch sự và tự nhiên như một nhân viên hỗ trợ khách hàng thực thụ. Ví dụ:
  "Dạ, rất tiếc là hiện tại tuyến đường đến [địa điểm] vẫn chưa được các đối tác nhà xe của StuGo khai thác ạ. Bạn có muốn tham khảo thử các tuyến xe/nhà xe khác hiện đang có trên StuGo không?" hoặc "Dạ, StuGo hiện tại chưa hỗ trợ chuyến xe đến địa chỉ này. Bạn tham khảo thử danh sách các nhà xe đối tác khác đang hoạt động nhé!".
- Trả lời bằng tiếng Việt một cách rõ ràng, ngắn gọn, thân thiện và lịch sự.`;

    // 4. Generate response
    let responseText;
    try {
      console.log('🤖 Attempting AI generation using gemini-2.5-flash...');
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction
      });
      const result = await model.generateContent(message);
      responseText = result.response.text();
    } catch (error) {
      console.error('❌ Gemini 2.5 Flash generation failed:', error);
      throw error;
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
