import React, { useState } from 'react';
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { WorkflowSuggestions } from './WorkflowSuggestions';
import { Header } from '../layout/Header';
import { Workflow } from 'lucide-react';

export function TestWorkflowSuggestion() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSuggestion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sop/test-workflow-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) throw new Error('Failed to get suggestions');
      
      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableWorkflow = (templateId: string) => {
    console.log('Would enable workflow:', templateId);
    alert(`Would enable workflow: ${templateId}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header icon={<Workflow />} activeTab="workflows" />
      <main className="flex-1 p-4 md:p-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Test Workflow Suggestions</h2>
          
          <Button 
            onClick={testSuggestion}
            disabled={loading}
            className="mb-4"
          >
            {loading ? 'Testing...' : 'Test Suggestion'}
          </Button>

          {error && (
            <div className="text-red-500 mb-4">
              Error: {error}
            </div>
          )}

          {suggestions.length > 0 && (
            <WorkflowSuggestions 
              suggestions={suggestions}
              onEnableWorkflow={handleEnableWorkflow}
            />
          )}
        </Card>
      </main>
    </div>
  );
} 