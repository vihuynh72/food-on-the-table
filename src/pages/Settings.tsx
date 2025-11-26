import { Navigation } from "@/components/Navigation";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-foreground mb-4">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and account settings. Coming soon!</p>
      </main>
    </div>
  );
}
