import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserLocation } from "@/hooks/useUserLocation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Upload, X, Trash2 } from "lucide-react";
import { addDays, format } from "date-fns";
import { LocationSearchBar } from "@/components/donation/LocationSearchBar";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { CommunityPostWithUser } from "@/types/community";

import { Checkbox } from "@/components/ui/checkbox";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillData?: {
    title?: string;
    category?: string;
    expiryDate?: Date;
  };
  postToEdit?: CommunityPostWithUser | null;
  onDelete?: (post: CommunityPostWithUser) => void;
}

const DIETARY_TAGS = [
  { id: 'Vegetarian', label: 'Vegetarian' },
  { id: 'Vegan', label: 'Vegan' },
  { id: 'Gluten-Free', label: 'Gluten-Free' },
  { id: 'Dairy-Free', label: 'Dairy-Free' },
  { id: 'Nut-Free', label: 'Nut-Free' },
  { id: 'Halal', label: 'Halal' },
  { id: 'Kosher', label: 'Kosher' },
];

export function CreatePostModal({ open, onOpenChange, prefillData, postToEdit, onDelete }: CreatePostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { position: userPosition } = useUserLocation(open);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [type] = useState<'offer'>('offer');
  const [title, setTitle] = useState(prefillData?.title || "");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(prefillData?.category || "");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState<string>(
    prefillData?.expiryDate 
      ? format(prefillData.expiryDate, "yyyy-MM-dd'T'HH:mm") 
      : format(addDays(new Date(), 2), "yyyy-MM-dd'T'HH:mm")
  );
  const [locationLabel, setLocationLabel] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [zipCode, setZipCode] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Initialize location with user position if available
  useEffect(() => {
    if (userPosition && !selectedLocation && !postToEdit) {
      setSelectedLocation(userPosition);
    }
  }, [userPosition, postToEdit]);

  // Populate form when editing
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setDescription(postToEdit.description || "");
      setCategory(postToEdit.category || "");
      setQuantity(postToEdit.quantity_description || postToEdit.total_portions?.toString() || "");
      if (postToEdit.best_before_at) {
        setExpiryDate(format(new Date(postToEdit.best_before_at), "yyyy-MM-dd'T'HH:mm"));
      }
      setLocationLabel(postToEdit.location_label || "");
      if (postToEdit.location_lat && postToEdit.location_lng) {
        setSelectedLocation({ lat: postToEdit.location_lat, lng: postToEdit.location_lng });
      }
      if (postToEdit.community_post_photos) {
        setPhotoPreviews(postToEdit.community_post_photos.map(p => p.url));
      }
      if (postToEdit.tags) {
        setSelectedTags(postToEdit.tags);
      }
    } else if (!open) {
      // Reset form when closed
      setTitle("");
      setDescription("");
      setPhotos([]);
      setPhotoPreviews([]);
      setQuantity("");
      setLocationLabel("");
      setSelectedLocation(null);
      setSelectedTags([]);
    }
  }, [postToEdit, open]);

  const handleZipCodeBlur = async () => {
    if (zipCode.length >= 5) {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;
      
      try {
        await loadGoogleMaps(apiKey);
        if (window.google?.maps) {
          const geocoder = new (window.google.maps as any).Geocoder();
          geocoder.geocode({ address: zipCode }, (results: any, status: string) => {
            if (status === 'OK' && results && results[0]) {
              const location = results[0].geometry.location;
              setSelectedLocation({ lat: location.lat(), lng: location.lng() });
              setLocationLabel(zipCode); 
            }
          });
        }
      } catch (e) {
        console.error("Geocoding failed", e);
      }
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos([...photos, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPhotoPreviews([...photoPreviews, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);

    const newPreviews = [...photoPreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPhotoPreviews(newPreviews);
  };

  const handleTagToggle = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(t => t !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    if (!selectedLocation && !userPosition) {
      toast({ title: "Location is required", description: "Please select a location or use your current location.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create or Update Post
      const postData = {
        user_id: user.id,
        type,
        title,
        description: description || null,
        category: category || null, // Don't store empty string
        total_portions: parseInt(quantity) || 1,
        remaining_portions: parseInt(quantity) || 1,
        quantity_description: quantity || null,
        best_before_at: expiryDate ? new Date(expiryDate).toISOString() : null,
        location_lat: selectedLocation?.lat || userPosition?.lat || null,
        location_lng: selectedLocation?.lng || userPosition?.lng || null,
        location_label: locationLabel || "Nearby",
        status: 'active' as const,
        tags: selectedTags
      };
      
      console.log('Saving post with data:', postData);
      
      let post;
      let postError;

      if (postToEdit) {
        const { data, error } = await supabase
          .from('community_posts')
          .update(postData)
          .eq('id', postToEdit.id)
          .select()
          .single();
        post = data;
        postError = error;
      } else {
        const { data, error } = await supabase
          .from('community_posts')
          .insert(postData)
          .select()
          .single();
        post = data;
        postError = error;
      }

      if (postError) {
        console.error('Post creation error:', postError);
        throw postError;
      }
      
      console.log('Post created successfully:', post);

      // 2. Upload Photos (Only for offers)
      if (photos.length > 0 && post) {
        const uploadPromises = photos.map(async (photo) => {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${post.id}/${Math.random()}.${fileExt}`;
          
          // Try to upload to 'community_images' bucket
          const { error: uploadError } = await supabase.storage
            .from('community_images')
            .upload(fileName, photo);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('community_images')
              .getPublicUrl(fileName);

            return supabase
              .from('community_post_photos')
              .insert({
                post_id: post.id,
                url: publicUrl
              });
          } else {
             console.warn("Image upload failed:", uploadError);
             return null;
          }
        });

        await Promise.all(uploadPromises);
      }

      toast({
        title: "Success!",
        description: "Your post has been shared with the community.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
      
      onOpenChange(false);
      // Reset form
      setTitle("");
      setDescription("");
      setPhotos([]);
      setPhotoPreviews([]);
      setSelectedTags([]);

    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{postToEdit ? "Edit Post" : "Share with Community"}</DialogTitle>
          <DialogDescription>
            {postToEdit ? "Update details" : "What would you like to share?"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              placeholder="e.g., Fresh Tomatoes, Canned Beans" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="produce">Produce</SelectItem>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="pantry">Pantry</SelectItem>
                <SelectItem value="dairy_eggs">Dairy & Eggs</SelectItem>
                <SelectItem value="meat_seafood">Meat & Seafood</SelectItem>
                <SelectItem value="prepared_meals">Prepared Meals</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="beverages">Beverages</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe the food, quantity, and condition..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">How much?</Label>
              <Input 
                id="quantity" 
                type="text" 
                placeholder="e.g. 2 bags, 500g" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Best Before</Label>
              <Input 
                id="expiry" 
                type="datetime-local" 
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dietary Information</Label>
            <div className="flex flex-wrap gap-3">
              {DIETARY_TAGS.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`post-tag-${tag.id}`} 
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => handleTagToggle(tag.id)}
                  />
                  <Label htmlFor={`post-tag-${tag.id}`} className="text-sm font-normal cursor-pointer">
                    {tag.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="space-y-2">
              <LocationSearchBar 
                onLocationSelect={(loc) => {
                  setSelectedLocation({ lat: loc.lat, lng: loc.lng });
                  setLocationLabel(loc.address);
                }} 
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="shrink-0" 
                  type="button" 
                  onClick={async () => {
                    if (!userPosition) {
                      toast({ title: "Location not available", description: "Please enable location services.", variant: "destructive" });
                      return;
                    }

                    setSelectedLocation(userPosition);
                    setLocationLabel("Getting address...");
                    
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    if (!apiKey) {
                        setLocationLabel("Current Location");
                        return;
                    }

                    try {
                      await loadGoogleMaps(apiKey);
                      const geocoder = new window.google.maps.Geocoder();
                      const { results } = await geocoder.geocode({ location: userPosition });
                      if (results && results[0]) {
                        setLocationLabel(results[0].formatted_address);
                      } else {
                        setLocationLabel("Current Location");
                      }
                    } catch (error) {
                      console.error("Reverse geocoding failed:", error);
                      setLocationLabel("Current Location");
                    }
                  }}
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Use Current Location
                </Button>
                <Input 
                  placeholder="Location label (e.g. Near Central Park)" 
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            {selectedLocation && <p className="text-xs text-muted-foreground">Coordinates set: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</p>}
          </div>

          <div className="space-y-2">
            <Label>Photos</Label>
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-md overflow-hidden border">
                  <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photoPreviews.length < 5 && (
                <label className="flex flex-col items-center justify-center aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer bg-muted/5 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center">
          <div className="flex gap-2">
            {postToEdit && onDelete && (
              <Button 
                variant="ghost" 
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                onClick={() => {
                  if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
                    onDelete(postToEdit);
                    onOpenChange(false);
                  }
                }}
                title="Delete Post"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {postToEdit ? "Update Post" : "Share Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
