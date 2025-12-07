import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ChatInputHandle {
  focus: () => void;
}

interface ChatInputProps {
  onSend: (content?: string, imageUrl?: string, imagePath?: string) => void;
  onImageUpload?: (file: File) => Promise<{ url: string; path: string } | null>;
  disabled?: boolean;
  placeholder?: string;
  isUploading?: boolean;
  autoFocus?: boolean;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  function ChatInput(
    {
      onSend,
      onImageUpload,
      disabled = false,
      placeholder = "Type a message...",
      isUploading = false,
      autoFocus = false,
    },
    ref
  ) {
    const [message, setMessage] = useState("");
    const [imagePreview, setImagePreview] = useState<{
      file: File;
      preview: string;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    // Auto-focus on mount if enabled
    useEffect(() => {
      if (autoFocus && !disabled) {
        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
        return () => clearTimeout(timeoutId);
      }
    }, [autoFocus, disabled]);

  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage && !imagePreview) return;

    let imageUrl: string | undefined;
    let imagePath: string | undefined;

    // Upload image if present
    if (imagePreview && onImageUpload) {
      const result = await onImageUpload(imagePreview.file);
      if (result) {
        imageUrl = result.url;
        imagePath = result.path;
      } else {
        // Upload failed, don't send
        return;
      }
    }

    onSend(trimmedMessage || undefined, imageUrl, imagePath);
    
    // Reset
    setMessage("");
    setImagePreview(null);
    
    // Focus back on textarea
    textareaRef.current?.focus();
  }, [message, imagePreview, onSend, onImageUpload]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview({
        file,
        preview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  return (
    <div className="border-t bg-background p-3">
      {/* Image preview */}
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img
            src={imagePreview.preview}
            alt="Preview"
            className="h-20 w-20 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
            onClick={removeImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Image upload button */}
        {onImageUpload && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
          </>
        )}

        {/* Text input */}
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className={cn(
            "min-h-[40px] max-h-[120px] resize-none",
            "rounded-2xl px-4 py-2"
          )}
          rows={1}
        />

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          className="h-10 w-10 flex-shrink-0 rounded-full"
          onClick={handleSend}
          disabled={disabled || isUploading || (!message.trim() && !imagePreview)}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
  }
);
