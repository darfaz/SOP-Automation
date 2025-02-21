import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import type { Workflow } from "@shared/schema";
import { CalendarDays } from "lucide-react";

const statusColors = {
  active: "bg-green-500",
  pending: "bg-yellow-500",
  completed: "bg-blue-500",
} as const;

export function WorkflowCard({ workflow }: { workflow: Workflow }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {workflow.name}
        </CardTitle>
        <Badge variant="outline" className={statusColors[workflow.status as keyof typeof statusColors]}>
          {workflow.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {workflow.description}
        </p>
        <div className="flex items-center text-sm text-muted-foreground">
          <CalendarDays className="mr-1 h-4 w-4" />
          {new Date(workflow.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
