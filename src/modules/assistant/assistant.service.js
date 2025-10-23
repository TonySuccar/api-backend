const axios = require('axios');

class AssistantService {
  constructor() {
    this.llmEndpoint = process.env.LLM_ENDPOINT || 'http://localhost:8000/assistant';
    this.timeout = 20000; // 5 seconds
    this.maxFunctionCalls = 2;
  }

  /**
   * Detect PII in text
   */
  detectPII(text) {
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      credit_card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    };

    const detected = {};
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        detected[type] = matches;
      }
    }

    return detected;
  }

  /**
   * Mask PII in text
   */
  maskPII(text) {
    const detected = this.detectPII(text);
    let masked = text;

    if (detected.email) {
      masked = masked.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');
    }
    if (detected.phone) {
      masked = masked.replace(/\b(?:\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');
    }
    if (detected.ssn) {
      masked = masked.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');
    }
    if (detected.credit_card) {
      masked = masked.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_REDACTED]');
    }

    return { masked, detected };
  }

  /**
   * Detect chitchat patterns
   */
  detectChitchat(text) {
    const textLower = text.toLowerCase().trim();
    
    const patterns = [
      /^(hi|hey|hello|yo)\b/,
      /\bhow are you\b/,
      /^(thanks|thank you)\b/,
      /\bwho are you\b/,
      /\bwhat'?s your name\b/,
      /^(bye|goodbye)\b/,
    ];

    return patterns.some(pattern => pattern.test(textLower));
  }

  /**
   * Detect jailbreak/violation attempts
   */
  detectViolation(text) {
    const textLower = text.toLowerCase().trim();
    
    const jailbreakPatterns = [
      /\bignore (all|any|previous) instructions\b/,
      /\boverride (the )?system\b/,
      /\bdeveloper mode\b/,
      /\bjailbreak\b/,
      /\bDAN\b/,
      /\bshow.*system prompt\b/,
      /\bbypass (safety|rules|guardrails)\b/,
    ];

    const toxicWords = ['fuck', 'shit', 'bitch', 'bastard', 'asshole', 'cunt'];
    const hasToxic = toxicWords.some(word => new RegExp(`\\b${word}\\b`).test(textLower));

    return jailbreakPatterns.some(pattern => pattern.test(textLower)) || hasToxic;
  }

  /**
   * Classify user intent
   */
  classifyIntent(text) {
    const textLower = text.toLowerCase().trim();

    // Violation (highest priority)
    if (this.detectViolation(text)) {
      return 'violation';
    }

    // Chitchat
    if (this.detectChitchat(text)) {
      return 'chitchat';
    }

    // Order status
    const orderIdPattern = /\b(ORD|ORDER)[_-]?[A-Z0-9]{6,}\b/i;
    const orderKeywords = ['track', 'order', 'package', 'delivery', 'shipment', 'where is my'];
    if (orderIdPattern.test(text) || orderKeywords.some(kw => textLower.includes(kw))) {
      if (['where', 'status', 'track', 'when'].some(w => textLower.includes(w))) {
        return 'order_status';
      }
    }

    // Product search
    const productKeywords = ['search', 'find', 'looking for', 'do you have', 'show me', 'product', 'buy'];
    if (productKeywords.some(kw => textLower.includes(kw))) {
      return 'product_search';
    }

    // Complaint
    const complaintKeywords = ['complaint', 'disappointed', 'angry', 'unacceptable', 'terrible', 
                               'horrible', 'damaged', 'broken', 'issue', 'problem', 'wrong'];
    if (complaintKeywords.some(kw => textLower.includes(kw))) {
      return 'complaint';
    }

    // Policy questions
    const policyKeywords = ['return', 'refund', 'exchange', 'ship', 'delivery', 'payment', 
                           'warranty', 'guarantee', 'privacy', 'data', 'account', 'register'];
    if (policyKeywords.some(kw => textLower.includes(kw))) {
      return 'policy_question';
    }

    return 'off_topic';
  }

  /**
   * Handle chitchat fast response
   */
  handleChitchat(text) {
    const textLower = text.toLowerCase();
    
    if (/^(hi|hey|hello|yo)\b/.test(textLower)) {
      return "Hi! I'm Shoppy, a Shoplite support specialist. How can I help you today?";
    }
    if (/\bwho are you\b/.test(textLower) || /\bwhat'?s your name\b/.test(textLower)) {
      return "I'm Shoppy, a Shoplite support specialist. I'm here to help with orders, returns, shipping, and account questions.";
    }
    if (/^(thanks|thank you)\b/.test(textLower)) {
      return "You're welcome! Let me know if you need anything else.";
    }
    if (/^(bye|goodbye)\b/.test(textLower)) {
      return "Goodbye! Feel free to reach out if you have more questions.";
    }

    return "Hi! I'm Shoppy, a Shoplite support specialist. How can I help you today?";
  }

  /**
   * Handle violation fast response
   */
  handleViolation() {
    return "I’m here to help, not upset you — sounds like you’re frustrated. If you have any questions about your orders, returns, or our policies, I’d be happy to assist.";
  }

  /**
   * Handle off-topic fast response
   */
  handleOffTopic() {
    return "I'm here to help with Shoplite questions about orders, returns, shipping, and policies. Please ask a relevant question and I'll be happy to assist.";
  }

  /**
   * Send request to LLM endpoint (Google Colab)
   */
  async queryLLM(userMessage, intent, context = {}, userId = 'TEMP_USER') {
    try {
      const response = await axios.post(
        this.llmEndpoint,
        {
          message: userMessage,
          intent,
          userId,
          context,
        },
        {
          timeout: this.timeout,
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
        }
      );

      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('LLM request timeout');
      }
      if (error.response) {
        throw new Error(`LLM error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
      }
      throw new Error(`Failed to connect to LLM: ${error.message}`);
    }
  }

  /**
   * Main processing method
   */
  async processMessage(userMessage, contextData = {}, userId = 'TEMP_USER') {
    const startTime = Date.now();

    // Step 1: PII Masking
    const { masked, detected: piiDetected } = this.maskPII(userMessage);

    // Step 2: Intent Classification
    const intent = this.classifyIntent(masked);

    // Step 3: Fast-path responses (no LLM needed)
    if (intent === 'chitchat') {
      return {
        response: this.handleChitchat(masked),
        intent,
        citations: [],
        functionsCalled: [],
        piiDetected: Object.keys(piiDetected).length > 0,
        piiTypes: Object.keys(piiDetected),
        processingTime: Date.now() - startTime,
        llmUsed: false,
      };
    }

    if (intent === 'violation') {
      return {
        response: this.handleViolation(),
        intent,
        citations: [],
        functionsCalled: [],
        piiDetected: Object.keys(piiDetected).length > 0,
        piiTypes: Object.keys(piiDetected),
        processingTime: Date.now() - startTime,
        llmUsed: false,
      };
    }

    if (intent === 'off_topic') {
      return {
        response: this.handleOffTopic(),
        intent,
        citations: [],
        functionsCalled: [],
        piiDetected: Object.keys(piiDetected).length > 0,
        piiTypes: Object.keys(piiDetected),
        processingTime: Date.now() - startTime,
        llmUsed: false,
      };
    }

    // Step 4: For other intents, query LLM (Google Colab)
    try {
      const llmResponse = await this.queryLLM(masked, intent, contextData, userId);

      return {
        response: llmResponse.response || llmResponse.text,
        intent: llmResponse.intent || intent,
        citations: llmResponse.citations || [],
        functionsCalled: llmResponse.functionsCalled || [],
        citationValidation: llmResponse.citationValidation,
        piiDetected: Object.keys(piiDetected).length > 0,
        piiTypes: Object.keys(piiDetected),
        processingTime: Date.now() - startTime,
        llmUsed: true,
      };
    } catch (error) {
      // Fallback if LLM fails
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment, or contact our support team directly.",
        intent,
        citations: [],
        functionsCalled: [],
        piiDetected: Object.keys(piiDetected).length > 0,
        piiTypes: Object.keys(piiDetected),
        processingTime: Date.now() - startTime,
        llmUsed: false,
        error: error.message,
      };
    }
  }
}

module.exports = new AssistantService();
