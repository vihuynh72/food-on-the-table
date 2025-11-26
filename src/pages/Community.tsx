import { Navigation } from "@/components/Navigation";

export default function Community() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-foreground mb-4">Community</h1>
        <p className="text-muted-foreground">Share and discover food from your local community. Coming soon!</p>
      </main>
    </div>
  );
}
