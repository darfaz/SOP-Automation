import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Calendar, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SOP, Automation } from "@shared/schema";

export default function SOPGenerator() {
  const [task, setTask] = useState("");
  const [selectedSopId, setSelectedSopId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: sops, isLoading: sopsLoading } = useQuery<SOP[]>({
    queryKey: ["/api/sops"],
  });

  const { data: automationSuggestions, isLoading: suggestionsLoading } = useQuery<{
    suggestions: Partial<Automation>[];
    message: string;
  }>({
    queryKey: ["/api/automations/suggest", selectedSopId],
    queryFn: async () => {
      if (!selectedSopId) return { suggestions: [], message: "" };
      const res = await apiRequest("GET", `/api/automations/suggest/${selectedSopId}`);
      return res.json();
    },
    enabled: !!selectedSopId,
  });

  const generateMutation = useMutation({
    mutationFn: async (task: string) => {
      const res = await apiRequest("POST", "/api/sops/generate", { task });
      const sop = await res.json();
      setSelectedSopId(sop.id); // Set the selected SOP ID to trigger suggestions query
      return sop;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sops"] });
      setTask("");
      toast({
        title: "Success",
        description: "SOP generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: async ({ sopId, connectedApps }: { sopId: string; connectedApps: string[] }) => {
      const res = await apiRequest("POST", "/api/automations", { sopId, connectedApps });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast({
        title: "Success",
        description: "Automation workflow created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SOP Generator</h2>
          <p className="text-muted-foreground">
            Create AI-powered Standard Operating Procedures with automation suggestions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate New SOP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Describe your task (e.g., Send weekly invoice reminders)"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => generateMutation.mutate(task)}
                disabled={!task || generateMutation.isPending}
              >
                {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate SOP
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="text-xl font-semibold mb-4">Your SOPs</h3>

          {sopsLoading ? (
            <div className="space-y-4">
              {Array(2).fill(0).map((_, i) => (
                <div key={i} className="h-[200px] rounded-lg animate-pulse bg-muted" />
              ))}
            </div>
          ) : sops?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-6">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No SOPs generated yet. Create your first one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sops?.map((sop) => (
                <Card key={sop.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{sop.title}</CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(sop.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {sop.description}
                    </p>
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4 mb-4">
                      <div className="space-y-2">
                        {sop.steps.map((step, index) => (
                          <p key={index} className="text-sm">
                            {index + 1}. {step}
                          </p>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Automation Suggestions Section */}
                    {selectedSopId === sop.id && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5" />
                          <h4 className="font-semibold">Automation Suggestions</h4>
                        </div>

                        {suggestionsLoading ? (
                          <div className="h-[100px] rounded-lg animate-pulse bg-muted" />
                        ) : automationSuggestions?.suggestions && automationSuggestions.suggestions.length > 0 ? (
                          <div className="space-y-2">
                            {automationSuggestions.suggestions.map((suggestion, index) => (
                              <Card key={index}>
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="font-medium">{suggestion.name}</h5>
                                      <p className="text-sm text-muted-foreground">
                                        {suggestion.description}
                                      </p>
                                      <p className="text-sm mt-1">
                                        Connected Apps: {suggestion.connectedApps?.join(", ")}
                                      </p>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => createAutomationMutation.mutate({
                                        sopId: sop.id,
                                        connectedApps: suggestion.connectedApps || []
                                      })}
                                      disabled={createAutomationMutation.isPending}
                                    >
                                      {createAutomationMutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      Enable
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No automation suggestions available for this SOP.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}