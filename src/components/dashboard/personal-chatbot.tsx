"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Send, User } from "lucide-react";
import { personalDietChatbot } from "@/ai/flows/personal-diet-chatbot";
import { dietPlansService } from "@/lib/firestore";
import { useAuth } from "@/lib/auth";

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export function PersonalChatbot() {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hello! I am your personal SolveAI assistant. Ask me any questions about your diet plan.",
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Fetch user's diet plan
      let dietPlanString = 'No diet plan available';
      if (userProfile?.patientId) {
        try {
          const plans = await dietPlansService.getByPatient(userProfile.patientId);
          const activePlan = plans.find(plan => plan.isActive) || plans[0];
          if (activePlan) {
            dietPlanString = JSON.stringify(activePlan);
          }
        } catch (planError) {
          console.warn('Could not fetch diet plan for chatbot:', planError);
        }
      }

      const response = await personalDietChatbot({
        patientName: userProfile?.displayName || 'User',
        carePlanDetails: `Here is the diet plan: ${dietPlanString}`,
        question: input,
      });

      const botMessage: Message = { sender: 'bot', text: response.answer };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = { sender: 'bot', text: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
      console.error("Chatbot error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Bot />
            Personal Health Bot
        </CardTitle>
        <CardDescription>Ask questions about your diet and get instant answers.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <ScrollArea className="flex-grow h-0 pr-4 mb-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                {message.sender === 'bot' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                  </Avatar>
                )}
                <div className={`rounded-lg px-4 py-2 max-w-[80%] ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <p className="text-sm">{message.text}</p>
                </div>
                {message.sender === 'user' && (
                   <Avatar className="h-8 w-8">
                    <AvatarFallback><User size={20}/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20}/></AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-secondary animate-pulse">
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
