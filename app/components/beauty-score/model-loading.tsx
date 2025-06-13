import { Loader2 } from "lucide-react";

export function ModelLoading() {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        Loading AI models...
      </p>
    </div>
  );
}

export function ModelError({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <p className="text-sm text-destructive">
        Error loading models: {error.message}
      </p>
    </div>
  );
} 