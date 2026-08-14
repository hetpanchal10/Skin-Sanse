"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  IconMicrophone,
  IconPaperclip,
  IconPlus,
  IconSearch,
  IconSend,
  IconSparkles,
  IconWaveSine,
} from "@tabler/icons-react";
import { Star } from "lucide-react";
import { useRef, useState, useEffect } from "react";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Product[];
};

type Product = {
  id: string;
  name: string;
  brand: string;
  price: string;
  rating: number;
  reviews: number;
  image: string;
  url: string;
  category: string;
  skinType: string[];
  concern: string[];
  featured?: boolean;
};

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Foaming Facial Cleanser",
    brand: "CeraVe",
    price: "$14.99",
    rating: 4.6,
    reviews: 12450,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    url: "https://www.cerave.com/skincare/cleansers/foaming-facial-cleanser",
    category: "Cleanser",
    skinType: ["oily", "combination", "normal"],
    concern: ["acne", "pores"],
    featured: true
  },
  {
    id: "2",
    name: "Hyaluronic Acid 2% + B5",
    brand: "The Ordinary",
    price: "$7.99",
    rating: 4.4,
    reviews: 8920,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
    url: "https://theordinary.com/en-us/hyaluronic-acid-2-b5-hydration-support-serum-100419.html",
    category: "Serum",
    skinType: ["all"],
    concern: ["dryness", "fine-lines"],
    featured: true
  },
  {
    id: "3",
    name: "Anthelios UV Melt-in Milk SPF 60",
    brand: "La Roche-Posay",
    price: "$35.99",
    rating: 4.7,
    reviews: 15630,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop",
    url: "https://www.laroche-posay.us/our-products/sun/face-sunscreen/anthelios-melt-in-milk-sunscreen-spf-60-3606000437449.html",
    category: "Sunscreen",
    skinType: ["all"],
    concern: ["sun-protection"],
    featured: true
  },
  {
    id: "4",
    name: "Daily Moisturizing Lotion",
    brand: "CeraVe",
    price: "$16.99",
    rating: 4.6,
    reviews: 18920,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    url: "https://www.cerave.com/skincare/moisturizers/daily-moisturizing-lotion",
    category: "Moisturizer",
    skinType: ["dry", "normal", "sensitive"],
    concern: ["dryness", "sensitivity"]
  },
  {
    id: "5",
    name: "Niacinamide 10% + Zinc 1%",
    brand: "The Ordinary",
    price: "$5.99",
    rating: 4.3,
    reviews: 11240,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
    url: "https://theordinary.com/en-us/niacinamide-10-zinc-1-oil-control-serum-100436.html",
    category: "Serum",
    skinType: ["oily", "combination"],
    concern: ["pores", "acne", "texture"]
  },
  {
    id: "6",
    name: "C E Ferulic",
    brand: "SkinCeuticals",
    price: "$169.00",
    rating: 4.8,
    reviews: 5680,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop",
    url: "https://www.skinceuticals.com/c-e-ferulic-635494263008.html",
    category: "Serum",
    skinType: ["all"],
    concern: ["aging", "fine-lines", "brightness"],
    featured: true
  },
  {
    id: "7",
    name: "Skin Perfecting 2% BHA Liquid",
    brand: "Paula's Choice",
    price: "$32.00",
    rating: 4.5,
    reviews: 9870,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    url: "https://www.paulaschoice.com/skin-perfecting-2pct-bha-liquid-exfoliant/201.html",
    category: "Treatment",
    skinType: ["oily", "combination", "acne-prone"],
    concern: ["acne", "pores", "texture"]
  },
  {
    id: "8",
    name: "Retinol 0.5% in Squalane",
    brand: "The Ordinary",
    price: "$9.99",
    rating: 4.2,
    reviews: 7450,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
    url: "https://theordinary.com/en-us/retinol-0-5-in-squalane-age-support-serum-100383.html",
    category: "Treatment",
    skinType: ["normal", "dry"],
    concern: ["aging", "fine-lines", "texture"]
  }
];

const SKINCARE_RESPONSES = {
  greeting: [
    "Hello! I'm your AI skincare assistant. I can help you with skin type identification, product recommendations, routine building, and answer any skincare questions you have.",
    "Hi there! I'm here to help you achieve your best skin ever. What skincare concerns can I assist you with today?",
    "Welcome! I'm your personal skincare expert powered by AI. Ask me anything about skincare, from routines to product recommendations!"
  ],
  skinTypes: {
    dry: "Dry skin lacks moisture and can feel tight or flaky. Focus on hydrating products with hyaluronic acid, ceramides, and gentle cleansers. Avoid harsh exfoliants and hot showers.",
    oily: "Oily skin produces excess sebum. Use oil-free, mattifying products with salicylic acid or niacinamide. Cleanse twice daily and use blotting papers if needed.",
    combination: "Combination skin has oily T-zone and dry cheeks. Use balancing products that hydrate dry areas while controlling oil in the T-zone.",
    normal: "Normal skin is well-balanced. Maintain with gentle cleansing, moisturizing, and occasional exfoliation. Most products work well for this skin type.",
    sensitive: "Sensitive skin reacts easily. Use fragrance-free, hypoallergenic products. Patch test new products and avoid irritants like alcohol and retinoids initially."
  },
  routines: {
    morning: "Morning routine: Cleanse, treat (serums/vitamin C), moisturize, sunscreen. Keep it light and protective.",
    evening: "Evening routine: Remove makeup, cleanse, treat (retinoids/exfoliants), moisturize. Focus on repair and renewal.",
    general: "A basic routine includes: Cleanser → Toner (optional) → Serum → Moisturizer → Sunscreen (AM). Consistency is key!"
  }
};

function generateResponse(message: string, userSkinType?: string): { content: string; products?: Product[] } {
  const lowerMessage = message.toLowerCase();

  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const greeting = SKINCARE_RESPONSES.greeting[Math.floor(Math.random() * SKINCARE_RESPONSES.greeting.length)];
    return { content: greeting };
  }

  // Skin type questions
  if (lowerMessage.includes('skin type') || lowerMessage.includes('what type')) {
    if (lowerMessage.includes('dry')) return { content: SKINCARE_RESPONSES.skinTypes.dry };
    if (lowerMessage.includes('oily')) return { content: SKINCARE_RESPONSES.skinTypes.oily };
    if (lowerMessage.includes('combination')) return { content: SKINCARE_RESPONSES.skinTypes.combination };
    if (lowerMessage.includes('normal')) return { content: SKINCARE_RESPONSES.skinTypes.normal };
    if (lowerMessage.includes('sensitive')) return { content: SKINCARE_RESPONSES.skinTypes.sensitive };
    return { content: "I can help identify your skin type! Try uploading a photo in our skin analysis tool, or describe your skin concerns and I'll give you guidance." };
  }

  // Routine questions
  if (lowerMessage.includes('routine') || lowerMessage.includes('steps')) {
    if (lowerMessage.includes('morning')) return { content: SKINCARE_RESPONSES.routines.morning };
    if (lowerMessage.includes('evening') || lowerMessage.includes('night')) return { content: SKINCARE_RESPONSES.routines.evening };
    return { content: SKINCARE_RESPONSES.routines.general };
  }

  // Product recommendations with actual products
  if (lowerMessage.includes('recommend') || lowerMessage.includes('product') || lowerMessage.includes('what should i use') || lowerMessage.includes('suggest')) {
    let recommendedProducts: Product[] = [];
    let responseText = "";

    // Cleanser recommendations
    if (lowerMessage.includes('cleanser') || lowerMessage.includes('cleanse')) {
      recommendedProducts = PRODUCTS.filter(p => p.category === 'Cleanser');
      responseText = "Here are some excellent cleanser options for your skin type:";
    }
    // Moisturizer recommendations
    else if (lowerMessage.includes('moisturizer') || lowerMessage.includes('moisturize')) {
      if (userSkinType === 'dry' || lowerMessage.includes('dry')) {
        recommendedProducts = PRODUCTS.filter(p => p.category === 'Moisturizer' && p.skinType.includes('dry'));
      } else {
        recommendedProducts = PRODUCTS.filter(p => p.category === 'Moisturizer');
      }
      responseText = "These moisturizers would be perfect for your skin needs:";
    }
    // Serum recommendations
    else if (lowerMessage.includes('serum')) {
      if (lowerMessage.includes('hydration') || lowerMessage.includes('dry')) {
        recommendedProducts = PRODUCTS.filter(p => p.category === 'Serum' && p.concern.includes('dryness'));
      } else if (lowerMessage.includes('acne') || lowerMessage.includes('oil')) {
        recommendedProducts = PRODUCTS.filter(p => p.category === 'Serum' && p.concern.includes('acne'));
      } else {
        recommendedProducts = PRODUCTS.filter(p => p.category === 'Serum');
      }
      responseText = "These serums would work great for your concerns:";
    }
    // Sunscreen recommendations
    else if (lowerMessage.includes('sunscreen') || lowerMessage.includes('sun') || lowerMessage.includes('spf')) {
      recommendedProducts = PRODUCTS.filter(p => p.category === 'Sunscreen');
      responseText = "Daily sun protection is crucial! Here are some excellent options:";
    }
    // Acne treatment recommendations
    else if (lowerMessage.includes('acne') || lowerMessage.includes('pimple') || lowerMessage.includes('breakout')) {
      recommendedProducts = PRODUCTS.filter(p => p.concern.includes('acne'));
      responseText = "For acne concerns, these products can help:";
    }
    // Anti-aging recommendations
    else if (lowerMessage.includes('aging') || lowerMessage.includes('wrinkle') || lowerMessage.includes('fine line')) {
      recommendedProducts = PRODUCTS.filter(p => p.concern.includes('aging') || p.concern.includes('fine-lines'));
      responseText = "These anti-aging products can help with fine lines and aging concerns:";
    }
    // General recommendations based on skin type
    else {
      if (userSkinType) {
        recommendedProducts = PRODUCTS.filter(p =>
          p.skinType.includes(userSkinType) || p.skinType.includes('all')
        ).slice(0, 3);
        responseText = `Based on your ${userSkinType} skin type, here are some recommended products:`;
      } else {
        recommendedProducts = PRODUCTS.filter(p => p.featured).slice(0, 3);
        responseText = "I'd be happy to recommend products! Could you tell me your skin type and specific concerns? Here are some popular options to get you started:";
      }
    }

    return {
      content: responseText,
      products: recommendedProducts.slice(0, 3) // Limit to 3 products
    };
  }

  // Acne concerns
  if (lowerMessage.includes('acne') || lowerMessage.includes('pimple') || lowerMessage.includes('breakout')) {
    const acneProducts = PRODUCTS.filter(p => p.concern.includes('acne')).slice(0, 2);
    return {
      content: "For acne, use products with salicylic acid, benzoyl peroxide, or niacinamide. Cleanse twice daily, avoid picking, and use non-comedogenic products. Here are some effective options:",
      products: acneProducts
    };
  }

  // Anti-aging
  if (lowerMessage.includes('aging') || lowerMessage.includes('wrinkle') || lowerMessage.includes('fine line')) {
    const antiAgingProducts = PRODUCTS.filter(p => p.concern.includes('aging') || p.concern.includes('fine-lines')).slice(0, 2);
    return {
      content: "For anti-aging, incorporate retinoids, vitamin C, peptides, and sunscreen. Start slowly with retinoids to avoid irritation. Here are some great options:",
      products: antiAgingProducts
    };
  }

  // Hydration concerns
  if (lowerMessage.includes('hydration') || lowerMessage.includes('dry') || lowerMessage.includes('moisture')) {
    const hydrationProducts = PRODUCTS.filter(p => p.concern.includes('dryness')).slice(0, 2);
    return {
      content: "For better hydration, use hyaluronic acid serums, apply moisturizer immediately after cleansing, and consider a humidifier. Here are some hydrating products:",
      products: hydrationProducts
    };
  }

  // Default response
  return {
    content: "That's a great question about skincare! Based on what you've asked, I'd recommend focusing on gentle, consistent care. For personalized advice, try our skin analysis tool or tell me more about your specific concerns. I can also recommend specific products tailored to your needs!"
  };
}

async function callGeminiAPI(
  userMessage: string,
  skinAnalysisResult?: { predicted_class: string; confidence: number }
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "YOUR_API_KEY_HERE";

  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return generateResponse(userMessage, skinAnalysisResult?.predicted_class).content;
  }

  const skinContext = skinAnalysisResult
    ? `The user has ${skinAnalysisResult.predicted_class} skin with ${(skinAnalysisResult.confidence * 100).toFixed(0)}% confidence.`
    : "";

  const prompt = `You are a helpful skincare AI assistant. ${skinContext} Answer clearly and provide friendly skincare advice. User question: ${userMessage}`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("No text in API response");
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return generateResponse(userMessage, skinAnalysisResult?.predicted_class).content;
  }
}

export default function Ai01({ skinAnalysisResult }: { skinAnalysisResult?: { predicted_class: string; confidence: number } }) {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: skinAnalysisResult
        ? `Great! I can see you have ${skinAnalysisResult.predicted_class} skin type with ${(skinAnalysisResult.confidence * 100).toFixed(0)}% confidence. How can I help you with your skincare routine today?`
        : SKINCARE_RESPONSES.greeting[0],
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [userSkinType, setUserSkinType] = useState<string | undefined>(skinAnalysisResult?.predicted_class);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      // Try to detect skin type from user message
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('skin type') || lowerMsg.includes('my skin is')) {
        if (lowerMsg.includes('dry')) setUserSkinType('dry');
        else if (lowerMsg.includes('oily')) setUserSkinType('oily');
        else if (lowerMsg.includes('combination')) setUserSkinType('combination');
        else if (lowerMsg.includes('normal')) setUserSkinType('normal');
        else if (lowerMsg.includes('sensitive')) setUserSkinType('sensitive');
      }

      setMessage("");
      setIsExpanded(false);
      setIsTyping(true);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      const aiText = await callGeminiAPI(userMessage.content, skinAnalysisResult);
      const localResponse = generateResponse(userMessage.content, userSkinType);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
        products: localResponse.products,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    setIsExpanded(e.target.value.length > 100 || e.target.value.includes("\n"));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === 'user'
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                  : "bg-gray-100 text-gray-800"
              )}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>

              {/* Product Recommendations */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-4 space-y-3">
                  {msg.products.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs text-gray-600">{product.brand}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-gray-700 ml-1">{product.rating}</span>
                            </div>
                            <span className="text-xs text-gray-500">({product.reviews.toLocaleString()})</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-pink-600">{product.price}</div>
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            View Product
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className={cn(
                "text-xs mt-2 opacity-70",
                msg.role === 'user' ? "text-right" : "text-left"
              )}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Skin Type Selector */}
      {!userSkinType && messages.length > 1 && (
        <div className="px-4 pb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-blue-700 mb-2">Select your skin type for personalized recommendations:</div>
            <div className="flex flex-wrap gap-2">
              {['dry', 'oily', 'combination', 'normal', 'sensitive'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setUserSkinType(type);
                    setMessages(prev => [...prev, {
                      id: Date.now().toString(),
                      role: 'assistant',
                      content: `Great! I've noted that you have ${type} skin. Now I can give you more personalized skincare recommendations. What would you like to know about?`,
                      timestamp: new Date()
                    }]);
                  }}
                  className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors capitalize"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skin Type Indicator */}
      {userSkinType && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                Skin Type: <span className="font-semibold capitalize">{userSkinType}</span>
              </span>
            </div>
            <button
              onClick={() => setUserSkinType(undefined)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Change
            </button>
          </div>
        </div>
      )}

      {/* Quick Suggestions */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <div className="text-xs text-gray-500 mb-2">Try asking:</div>
          <div className="flex flex-wrap gap-2">
            {userSkinType ? [
              `Best products for ${userSkinType} skin`,
              `Skincare routine for ${userSkinType} skin`,
              "Help with acne",
              "Anti-aging recommendations"
            ] : [
              "What products do you recommend for dry skin?",
              "How to build a skincare routine?",
              "Best moisturizers for sensitive skin",
              "Help with acne treatment"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setMessage(suggestion)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="group/composer w-full">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {}}
          />

          <div
            className={cn(
              "w-full max-w-2xl mx-auto bg-transparent dark:bg-muted/50 cursor-text overflow-clip bg-clip-padding p-2.5 shadow-lg border border-border transition-all duration-200",
              {
                "rounded-3xl grid grid-cols-1 grid-rows-[auto_1fr_auto]":
                  isExpanded,
                "rounded-[28px] grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr_auto]":
                  !isExpanded,
              }
            )}
            style={{
              gridTemplateAreas: isExpanded
                ? "'header' 'primary' 'footer'"
                : "'header header header' 'leading primary trailing' '. footer .'",
            }}
          >
            <div
              className={cn(
                "flex min-h-14 items-center overflow-x-hidden px-1.5",
                {
                  "px-2 py-1 mb-0": isExpanded,
                  "-my-2.5": !isExpanded,
                }
              )}
              style={{ gridArea: "primary" }}
            >
              <div className="flex-1 overflow-auto max-h-52">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about skincare..."
                  className="min-h-0 resize-none rounded-none border-0 p-0 text-base placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin dark:bg-transparent"
                  rows={1}
                />
              </div>
            </div>

            <div
              className={cn("flex", { hidden: isExpanded })}
              style={{ gridArea: "leading" }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-accent outline-none ring-0"
                  >
                    <IconPlus className="size-6 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="max-w-xs rounded-2xl p-1.5"
                >
                  <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem
                      className="rounded-[calc(1rem-6px)]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <IconPaperclip size={20} className="opacity-60" />
                      Add photos & files
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="rounded-[calc(1rem-6px)]"
                      onClick={() => {}}
                    >
                      <div className="flex items-center gap-2">
                        <IconSparkles size={20} className="opacity-60" />
                        Agent mode
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="rounded-[calc(1rem-6px)]"
                      onClick={() => {}}
                    >
                      <IconSearch size={20} className="opacity-60" />
                      Deep Research
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div
              className="flex items-center gap-2"
              style={{ gridArea: isExpanded ? "footer" : "trailing" }}
            >
              <div className="ms-auto flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-accent"
                >
                  <IconMicrophone className="size-5 text-muted-foreground" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full hover:bg-accent relative"
                >
                  <IconWaveSine className="size-5 text-muted-foreground" />
                </Button>

                {message.trim() && (
                  <Button
                    type="submit"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                  >
                    <IconSend className="size-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
