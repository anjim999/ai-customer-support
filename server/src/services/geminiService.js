import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048,
            }
        });
    }

    // Build system prompt with context
    buildSystemPrompt(companyContext = '', faqs = []) {
        let systemPrompt = `You are a helpful, friendly, and professional AI customer support assistant. 

Your key behaviors:
- Be concise but thorough in your responses
- If you don't know something, admit it and offer to connect with a human agent
- Always be polite and empathetic
- Use clear, simple language
- Format responses with markdown when helpful (lists, bold for emphasis, etc.)
- If the user seems frustrated, acknowledge their feelings first

`;

        if (companyContext) {
            systemPrompt += `\n### Company Knowledge Base:\n${companyContext}\n\n`;
            systemPrompt += `Use the above context to answer questions accurately. If the answer is in the context, use it. If not, say you'll need to check with the team.\n\n`;
        }

        if (faqs.length > 0) {
            systemPrompt += `\n### Frequently Asked Questions:\n`;
            faqs.forEach((faq, index) => {
                systemPrompt += `\nQ${index + 1}: ${faq.question}\nA${index + 1}: ${faq.answer}\n`;
            });
            systemPrompt += `\nUse these FAQs to answer common questions directly.\n`;
        }

        return systemPrompt;
    }

    // Regular chat (non-streaming)
    async chat(message, conversationHistory = [], context = {}) {
        try {
            const systemPrompt = this.buildSystemPrompt(context.companyContext, context.faqs);

            // Build chat history
            const history = conversationHistory.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const chat = this.model.startChat({
                history: [
                    { role: 'user', parts: [{ text: systemPrompt }] },
                    { role: 'model', parts: [{ text: 'I understand. I\'m ready to help as a customer support assistant.' }] },
                    ...history
                ]
            });

            const result = await chat.sendMessage(message);
            const response = result.response.text();

            return {
                success: true,
                message: response,
                tokensUsed: result.response.usageMetadata?.totalTokenCount || 0
            };
        } catch (error) {
            console.error('Gemini chat error:', error);
            throw new Error('Failed to get AI response');
        }
    }

    // Streaming chat
    async *streamChat(message, conversationHistory = [], context = {}) {
        try {
            const systemPrompt = this.buildSystemPrompt(context.companyContext, context.faqs);

            // Build chat history
            const history = conversationHistory.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const chat = this.model.startChat({
                history: [
                    { role: 'user', parts: [{ text: systemPrompt }] },
                    { role: 'model', parts: [{ text: 'I understand. I\'m ready to help as a customer support assistant.' }] },
                    ...history
                ]
            });

            const result = await chat.sendMessageStream(message);

            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    yield { type: 'chunk', content: text };
                }
            }

            const response = await result.response;
            yield {
                type: 'complete',
                tokensUsed: response.usageMetadata?.totalTokenCount || 0
            };
        } catch (error) {
            console.error('Gemini stream error:', error);
            yield { type: 'error', error: 'Failed to get AI response' };
        }
    }

    // Quick answer for simple queries
    async quickAnswer(question, context = '') {
        try {
            const prompt = context
                ? `Based on this context: ${context}\n\nAnswer this question concisely: ${question}`
                : `Answer this question concisely: ${question}`;

            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error('Gemini quick answer error:', error);
            throw new Error('Failed to get AI response');
        }
    }
}

export default new GeminiService();
