"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ClipboardList } from "lucide-react";
import { assessmentQuestions } from "@/lib/assessment-questions";
import { evaluatePatientAssessment } from "@/ai/flows/evaluate-patient-assessment";
import { useToast } from "@/hooks/use-toast";

type Answers = Record<string, string>;

export function PatientAssessment() {
  const [answers, setAnswers] = useState<Answers>({});
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState("");
  const { toast } = useToast();

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (Object.keys(answers).length !== assessmentQuestions.length) {
      toast({
        title: "Incomplete Assessment",
        description: "Please answer all questions before submitting.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setEvaluationResult("");
    try {
      const result = await evaluatePatientAssessment({
        assessmentData: JSON.stringify({
          questions: assessmentQuestions,
          answers,
        }),
      });
      setEvaluationResult(result.evaluation);
    } catch (error) {
      console.error(error);
      toast({
        title: "Evaluation Failed",
        description: "There was an error generating your assessment. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Ayurvedic Self-Assessment
          </CardTitle>
          <CardDescription>
            Answer these questions to help us understand your unique mind-body
            constitution (Prakriti).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {assessmentQuestions.map((q, index) => (
              <div key={q.id} className="space-y-4">
                <p className="font-medium">
                  {index + 1}. {q.question}
                </p>
                <RadioGroup
                  onValueChange={(value) => handleAnswerChange(q.id, value)}
                  className="space-y-2"
                  name={q.id}
                >
                  {q.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={`${q.id}-${option.value}`} />
                      <Label htmlFor={`${q.id}-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                "Evaluate My Prakriti"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {evaluationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Assessment Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-body text-sm">{evaluationResult}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
