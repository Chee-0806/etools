/**
 * Clipboard Types
 * Type definitions for clipboard history management
 */

/**
 * Clipboard content types
 */
export type ClipboardContentType = 'Text' | 'Image' | 'Html' | 'File';

/**
 * Clipboard item - represents a single clipboard history entry
 */
export interface ClipboardItem {
  id: string;                    // Unique identifier (UUID)
  content_type: ClipboardContentType;  // Type of clipboard content
  text?: string;                 // Text content (for Text/Html types)
  image_path?: string;           // Path to stored image file
  hash: string;                  // Content hash for deduplication (SHA-256)
  timestamp: number;             // When the content was copied (Unix timestamp)
  is_sensitive: boolean;         // Whether content is sensitive (passwords, API keys)
  app_source?: string;           // Application that copied the content
}

/**
 * Clipboard settings
 */
export interface ClipboardSettings {
  max_items: number;                    // Maximum clipboard history items (default: 1000)
  retention_days: number;               // Days to keep non-sensitive items (default: 30)
  sensitive_retention_minutes: number;  // Minutes to keep sensitive items (default: 2)
  enable_image_support: boolean;        // Whether to support image clipboard items
}
