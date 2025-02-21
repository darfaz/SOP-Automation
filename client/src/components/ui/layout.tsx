import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  LogOut,
} from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden lg:flex h-screen w-64 flex-col fixed inset-y-0 bg-sidebar border-r">
          <div className="p-6">
            <h1 className="text-xl font-bold">FinanceFlow</h1>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="h-5 w-5 mr-3" />
                Dashboard
              </Button>
            </Link>
            <Link href="/workflows">
              <Button variant="ghost" className="w-full justify-start">
                <GitBranch className="h-5 w-5 mr-3" />
                Workflows
              </Button>
            </Link>
            <Link href="/sop-generator">
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="h-5 w-5 mr-3" />
                SOP Generator
              </Button>
            </Link>
          </nav>
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Logout
            </Button>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="container p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}