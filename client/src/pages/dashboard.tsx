import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/ui/layout";
import { MetricsCard } from "@/components/ui/metrics-card";
import { WorkflowCard } from "@/components/ui/workflow-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Workflow } from "@shared/schema";

export default function Dashboard() {
  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-muted-foreground">
            Here's an overview of your financial automation workflows
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="Active Workflows"
            value={workflows?.filter((w) => w.status === "active").length || 0}
            description="Currently running automations"
          />
          <MetricsCard
            title="Completed Tasks"
            value={workflows?.filter((w) => w.status === "completed").length || 0}
            description="Successfully finished"
          />
          <MetricsCard
            title="Pending Tasks"
            value={workflows?.filter((w) => w.status === "pending").length || 0}
            description="Waiting to start"
          />
          <MetricsCard
            title="Total SOPs"
            value={workflows?.length || 0}
            description="Standard procedures"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-[200px] w-full" />
              ))
          ) : (
            workflows?.map((workflow) => (
              <WorkflowCard key={workflow.id} workflow={workflow} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
