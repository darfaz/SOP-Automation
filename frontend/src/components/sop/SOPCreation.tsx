import { useState } from 'react';
import { Header } from '../layout/Header'
import { FileText } from "lucide-react"
import { WorkflowSuggestions } from '../workflow/WorkflowSuggestions';
import { useToast } from "../ui/use-toast";

export default function SOPCreation() {
  const [sop, setSop] = useState<{
    title: string;
    content: string;
    suggested_workflows: any[];
  } | null>(null);
  const { toast } = useToast();

  const handleEnableWorkflow = async (templateId: string) => {
    try {
      // Call your n8n API to enable the workflow
      const response = await fetch('/api/workflows/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId })
      });
      
      if (!response.ok) throw new Error('Failed to enable workflow');
      
      toast({
        title: "Workflow Enabled",
        description: "The automation workflow has been successfully enabled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enable workflow. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header icon={<FileText />} activeTab="sops" />
      <main className="flex-1 p-4 md:p-6">
        {/* Existing SOP creation UI */}
        
        {sop && (
          <div className="mt-8">
            <WorkflowSuggestions 
              suggestions={sop.suggested_workflows}
              onEnableWorkflow={handleEnableWorkflow}
            />
          </div>
        )}
      </main>
    </div>
  )
} 