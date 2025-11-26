import { Navigation } from "@/components/Navigation";

export default function Donate() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-foreground mb-4">Donate Food</h1>
        <p className="text-muted-foreground">Find nearby donation locations for your surplus food. Coming soon!</p>
      </main>
    </div>
  );
}
