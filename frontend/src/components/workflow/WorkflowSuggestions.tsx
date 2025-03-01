import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Check, AlertCircle } from "lucide-react";

interface WorkflowSuggestion {
  name: string;
  description: string;
  confidence: number;
  reason: string;
  required_connections: string[];
  template_id: string;
}

interface WorkflowSuggestionsProps {
  suggestions: WorkflowSuggestion[];
  onEnableWorkflow: (templateId: string) => void;
}

export function WorkflowSuggestions({ suggestions, onEnableWorkflow }: WorkflowSuggestionsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recommended Workflows</h2>
      
      {suggestions.map((suggestion) => (
        <Card key={suggestion.template_id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{suggestion.name}</CardTitle>
              <Badge 
                variant={suggestion.confidence > 0.8 ? "default" : "secondary"}
                className="bg-emerald-100 text-emerald-800"
              >
                {Math.round(suggestion.confidence * 100)}% Match
              </Badge>
            </div>
            <CardDescription>{suggestion.description}</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Why this workflow: </span>
                {suggestion.reason}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {suggestion.required_connections.map((connection) => (
                  <Badge key={connection} variant="outline" className="flex items-center gap-1">
                    {connection}
                    <Check className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline">View Details</Button>
            <Button 
              onClick={() => onEnableWorkflow(suggestion.template_id)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Enable Workflow
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 