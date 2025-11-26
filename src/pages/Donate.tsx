import { Navigation } from "@/components/Navigation";
import { DonationMap } from "@/components/DonationMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Phone, ExternalLink, Clock, CheckCircle2, Navigation2 } from "lucide-react";
import { useState } from "react";

interface DonationLocation {
  id: string;
  name: string;
  type: "Food Bank" | "Community Fridge" | "Pantry" | "Shelter";
  distance: string;
  address: string;
  hours: string;
  phone: string;
  website: string;
  acceptedItems: string[];
  lat: number;
  lng: number;
}

const mockLocations: DonationLocation[] = [
  {
    id: "1",
    name: "Central Food Bank",
    type: "Food Bank",
    distance: "0.8 mi",
    address: "123 Main St, Downtown",
    hours: "Mon-Fri 9AM-5PM, Sat 9AM-2PM",
    phone: "(555) 123-4567",
    website: "centralfoodbank.org",
    acceptedItems: ["Sealed items", "Canned goods", "Dry goods", "Fresh produce"],
    lat: 39.8283,
    lng: -98.5795,
  },
  {
    id: "2",
    name: "Community Sharing Fridge",
    type: "Community Fridge",
    distance: "1.2 mi",
    address: "456 Oak Ave, Northside",
    hours: "24/7 Access",
    phone: "N/A",
    website: "communityfridge.org",
    acceptedItems: ["Fresh produce", "Packaged meals", "Dairy", "Drinks"],
    lat: 39.8383,
    lng: -98.5695,
  },
  {
    id: "3",
    name: "Hope Shelter Pantry",
    type: "Shelter",
    distance: "2.1 mi",
    address: "789 Elm St, Southside",
    hours: "Daily 8AM-8PM",
    phone: "(555) 987-6543",
    website: "hopeshelter.org",
    acceptedItems: ["Sealed items", "Canned goods", "Hygiene products"],
    lat: 39.8183,
    lng: -98.5895,
  },
  {
    id: "4",
    name: "School District Pantry",
    type: "Pantry",
    distance: "2.5 mi",
    address: "321 Pine Rd, Westside",
    hours: "Tue-Thu 3PM-6PM",
    phone: "(555) 456-7890",
    website: "schoolpantry.org",
    acceptedItems: ["Kid-friendly items", "Sealed snacks", "Canned goods"],
    lat: 39.8083,
    lng: -98.5995,
  },
];

const typeColors = {
  "Food Bank": "bg-woodland text-white",
  "Community Fridge": "bg-asparagus text-white",
  "Pantry": "bg-pine-glade text-woodland",
  "Shelter": "bg-desert-sand text-woodland",
};

const filterOptions = [
  { label: "All", value: "all" },
  { label: "Food Bank", value: "Food Bank" },
  { label: "Community Fridge", value: "Community Fridge" },
  { label: "Pantry", value: "Pantry" },
  { label: "Shelter", value: "Shelter" },
];

export default function Donate() {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const filteredLocations = filterType === "all" 
    ? mockLocations 
    : mockLocations.filter(loc => loc.type === filterType);

  const handleGetDirections = (location: DonationLocation) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`;
    window.open(url, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-woodland mb-2">
            Donate Food Locally
          </h1>
          <p className="text-muted-foreground">
            Find nearby donation locations for your surplus food
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filterType === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(option.value)}
              className="whitespace-nowrap"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Map and List Layout */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Map Section */}
          <div className="h-[400px] lg:h-[600px] rounded-xl overflow-hidden border shadow-md">
            <DonationMap 
              locations={filteredLocations}
              selectedLocationId={selectedLocation || undefined}
              onLocationClick={setSelectedLocation}
            />
          </div>

          {/* Location List */}
          <div className="space-y-4 lg:max-h-[600px] lg:overflow-y-auto">
            {filteredLocations.map((location) => (
              <Card 
                key={location.id}
                className={`transition-all cursor-pointer hover:shadow-lg ${
                  selectedLocation === location.id ? 'ring-2 ring-woodland' : ''
                }`}
                onClick={() => setSelectedLocation(location.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-woodland">
                        {location.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-4 h-4" />
                          {location.distance} • {location.address}
                        </div>
                      </CardDescription>
                    </div>
                    <Badge className={typeColors[location.type]}>
                      {location.type}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Hours */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-asparagus" />
                    <span className="text-muted-foreground">{location.hours}</span>
                  </div>

                  {/* Accepted Items */}
                  <div>
                    <p className="text-sm font-medium text-woodland mb-2">
                      Accepts:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {location.acceptedItems.map((item, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-asparagus" />
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(location);
                      }}
                    >
                      <Navigation2 className="w-4 h-4 mr-2" />
                      Directions
                    </Button>
                    {location.phone !== "N/A" && (
                      <Button 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(location.phone);
                        }}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://${location.website}`, '_blank');
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Donation Guidelines */}
        <Card className="border-asparagus/20">
          <CardHeader>
            <CardTitle className="text-woodland">Donation Guidelines</CardTitle>
            <CardDescription>
              What you need to know before donating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-woodland">
                  What items can I donate?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Sealed, unopened packaged foods</li>
                    <li>Canned goods within date</li>
                    <li>Fresh produce in good condition</li>
                    <li>Dry goods (rice, pasta, beans)</li>
                    <li>Sealed dairy products (check location)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-woodland">
                  What items cannot be donated?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Opened or unsealed packages</li>
                    <li>Homemade or prepared foods (varies by location)</li>
                    <li>Expired items past "use by" date</li>
                    <li>Items showing signs of spoilage</li>
                    <li>Alcohol or supplements</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-woodland">
                  How should I prepare items for donation?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check all dates and ensure items are within guidelines</li>
                    <li>Keep items in original packaging when possible</li>
                    <li>Store cold items at safe temperatures during transport</li>
                    <li>Label items clearly if repackaged</li>
                    <li>Call ahead for large donations</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
