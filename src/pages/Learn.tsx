import { Navigation } from "@/components/Navigation";

export default function Learn() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-foreground mb-4">Learn</h1>
        <p className="text-muted-foreground">Educational resources on food safety and sustainability. Coming soon!</p>
      </main>
    </div>
  );
}
