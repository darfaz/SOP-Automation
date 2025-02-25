import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAutomationSchema } from "@shared/schema";
import type { Automation, SOP } from "@shared/schema";
import { PlusCircle, Loader2, PlayCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import * as z from 'zod';

const n8nNodes = [
  { value: "Email", label: "Email" },
  { value: "Slack", label: "Slack" },
  { value: "GoogleSheets", label: "Google Sheets" },
  { value: "Trello", label: "Trello" },
  { value: "Github", label: "GitHub" },
];

export default function Workflows() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Query for SOPs
  const { data: sops } = useQuery<SOP[]>({
    queryKey: ["/api/sops"],
  });

  // Query for suggested automations for the first SOP
  const { data: suggestedAutomations, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["/api/automations/suggest", sops?.[0]?.id],
    enabled: !!sops?.[0]?.id,
  });

  const { data: automations, isLoading } = useQuery<Automation[]>({
    queryKey: ["/api/automations"],
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: async (data: { sopId: string, nodes: string[] }) => {
      const res = await apiRequest("POST", "/api/automations/deploy", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to deploy workflow");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      toast({
        title: "Success",
        description: "Workflow deployed successfully",
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

  const form = useForm({
    resolver: zodResolver(insertAutomationSchema.extend({
      workflowId: z.string().optional(),
    })),
    defaultValues: {
      name: "",
      status: "pending",
      connectedApps: [],
      sopId: "",
    },
  });

  // Set sopId when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && sops?.length > 0) {
      form.setValue("sopId", sops[0].id);
    }
    setOpen(open);
  };

  const onSubmit = async (data: any) => {
    // Debug log form state
    console.log("Form errors:", form.formState.errors);
    console.log("Submitting form data:", data);

    if (!data.sopId && sops?.length > 0) {
      data.sopId = sops[0].id;
    }

    createMutation.mutate(data);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting data:", data); // Debug log
      const res = await apiRequest("POST", "/api/automations", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create workflow");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/automations"] });
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Automation workflow created successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error); // Debug log
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
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">n8n Workflows</h2>
            <p className="text-muted-foreground">
              Automate your SOPs with n8n workflows
            </p>
          </div>

          {/* Show suggestions if available */}
          {suggestedAutomations && suggestedAutomations.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-3">Suggested Automations</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {suggestedAutomations.map((suggestion: any) => (
                  <Card key={suggestion.name}>
                    <CardHeader>
                      <CardTitle className="text-lg">{suggestion.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      <div className="mt-4">
                        <div className="text-sm font-medium">Suggested Nodes</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {suggestion.connectedApps.map((app: string) => (
                            <Button key={app} variant="secondary" size="sm" disabled>
                              {app}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => deployMutation.mutate({
                          sopId: sops![0].id,
                          nodes: suggestion.connectedApps
                        })}
                        disabled={deployMutation.isPending}
                      >
                        {deployMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <PlayCircle className="mr-2 h-4 w-4" />
                        )}
                        Deploy Workflow
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New n8n Workflow</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workflow Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Weekly Invoice Processing Workflow" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="connectedApps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>n8n Nodes</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange([...field.value, value])}
                          value={field.value[field.value.length - 1] || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select nodes to connect" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {n8nNodes.map((node) => (
                              <SelectItem key={node.value} value={node.value}>
                                {node.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {field.value.map((node: string) => (
                            <Button
                              key={node}
                              variant="secondary"
                              size="sm"
                              onClick={() => field.onChange(field.value.filter((n: string) => n !== node))}
                            >
                              {node} ×
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <input type="hidden" {...form.register("sopId")} /> {/* Added hidden sopId field */}
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Workflow
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-[200px] rounded-lg animate-pulse bg-muted" />
            ))}
          </div>
        ) : automations?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <PlusCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No workflows yet. Create your first n8n workflow!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {automations?.map((automation) => (
              <Card key={automation.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{automation.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium">Connected Nodes</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {automation.connectedApps.map((node) => (
                          <Button key={node} variant="secondary" size="sm" disabled>
                            {node}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Status</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {automation.status}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}