"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Leaf, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface Alternative {
  name: string;
  reason: string;
  ayurvedicBenefit: string;
}

interface AlternativeSuggestionsProps {
  foodName: string;
  reason: string;
  trigger?: React.ReactNode;
  className?: string;
}

export function AlternativeSuggestions({ foodName, reason, trigger, className }: AlternativeSuggestionsProps) {
  const { toast } = useToast();
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlternatives = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/suggest-alternatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodName,
          reason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alternatives');
      }

      const data = await response.json();

      if (data.success && data.data?.alternatives) {
        setAlternatives(data.data.alternatives);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching alternatives:', error);
      setError(error.message || 'Failed to load alternatives');
      toast({
        title: "Error",
        description: "Failed to load food alternatives. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (alternatives.length === 0 && !error) {
      fetchAlternatives();
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className={className}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Suggest Alternatives
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleOpen}>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            Alternatives for "{foodName}"
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Reason: {reason}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading alternatives...</span>
            </div>
          )}

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={fetchAlternatives}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && alternatives.length > 0 && (
            <div className="space-y-3">
              {alternatives.map((alternative, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-green-600" />
                        {alternative.name}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        Alternative #{index + 1}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Why this alternative?</h4>
                      <p className="text-sm">{alternative.reason}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Ayurvedic Benefits</h4>
                      <p className="text-sm">{alternative.ayurvedicBenefit}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        Use This Alternative
                      </Button>
                      <Button size="sm" variant="ghost">
                        View Nutrition Info
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && !error && alternatives.length === 0 && (
            <div className="text-center py-8">
              <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No alternatives available for this food.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}