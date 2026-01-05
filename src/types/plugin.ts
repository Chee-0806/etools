/**
 * Plugin Types
 * Type definitions for plugin system
 */

// Import PluginPermission for internal use (also re-exported below)
import type { PluginPermission, PluginManifest, PluginSearchResult } from '@/lib/plugin-sdk/types';

// Re-export types from plugin-sdk
export type {
  PluginManifest,
  PluginPermission,
  PluginSearchResult,
  PluginContext,
  Plugin as SDKPlugin,
  PluginSDK
} from '@/lib/plugin-sdk/types';

  // ============================================================================
// Extended Plugin Types (with runtime state)
// ============================================================================

/**
 * Plugin health status
 */
export type PluginHealthStatus = 'healthy' | 'warning' | 'error' | 'unknown';

// ============================================================================
// Installation Types
// ============================================================================

/**
 * Plugin installation source
 */
export type PluginSource = 'marketplace' | 'local' | 'github-release';

/**
 * Plugin installation progress
 */
export type InstallProgress = {
  installId: string;
  stage: 'validating' | 'extracting' | 'installing' | 'complete' | 'error' | 'cancelled';
  progress: number; // 0-100
  message: string;
  error?: string;
};

/**
 * Package validation result
 */
export type PackageValidation = {
  isValid: boolean;
  manifest: PluginManifest | null;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

/**
 * Extraction result
 */
export type ExtractionResult = {
  path: string;
  manifest: PluginManifest;
  files: ExtractedFile[];
};

/**
 * Cancel installation response
 */
export type CancelInstallResponse = {
  success: boolean;
  message: string;
  cleanupRequired: boolean;
};

/**
 * Validation error
 */
export type ValidationError = {
  code: string;
  message: string;
  field: string | undefined;
};

/**
 * Validation warning
 */
export type ValidationWarning = {
  code: string;
  message: string;
  field: string | undefined;
};

/**
 * Extracted file information
 */
export type ExtractedFile = {
  path: string;
  size: number; // File size in bytes
  file_type: string; // "file" or "directory"
};

/**
 * Plugin health information
 */
export interface PluginHealth {
  status: PluginHealthStatus;
  message?: string;
  lastChecked: number; // timestamp (ms)
  errors?: PluginError[];
}

/**
 * Plugin error details
 */
export interface PluginError {
  code: string;
  message: string;
  timestamp: number; // timestamp (ms)
  context?: Record<string, unknown>;
}

/**
 * Plugin usage statistics
 */
export interface PluginUsageStats {
  lastUsed: number | null; // timestamp (ms)
  usageCount: number;
  lastExecutionTime?: number; // ms
  averageExecutionTime?: number; // ms
}

/**
 * Plugin abbreviation configuration (user-defined shortcuts)
 */
export interface PluginAbbreviation {
  keyword: string; // The abbreviation keyword (e.g., "hw" for hello-world)
  enabled: boolean;
}

/**
 * Extended Plugin interface with runtime state
 * Builds on Plugin from SDK, adding runtime state
 */
export interface Plugin {
  // === From SDK Plugin ===
  manifest: PluginManifest;
  onSearch?: (query: string) => PluginSearchResult[] | Promise<PluginSearchResult[]>;
  onLoad?: () => void | Promise<void>;
  onUnload?: () => void | Promise<void>;
  onEnable?: () => void | Promise<void>;
  onDisable?: () => void | Promise<void>;
  ui?: {
    component: React.ComponentType<any>;
  };

  // === Runtime state (added by plugin manager) ===
  enabled?: boolean;
  health?: PluginHealth;
  usageStats?: PluginUsageStats;
  installedAt?: number; // timestamp (ms)
  grantedPermissions?: Set<PluginPermission>;
  configValues?: Record<string, string | number | boolean>;

  // === User-defined abbreviations (custom shortcuts for quick search) ===
  abbreviations?: PluginAbbreviation[];
}

/**
 * Plugin setting definition
 */
export interface PluginSetting {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  default: string | number | boolean;
  options?: { label: string; value: string | number }[];
  description?: string;
}

// ============================================================================
// Marketplace Plugin Types
// ============================================================================

/**
 * Plugin category
 */
export type PluginCategory =
  | 'productivity'
  | 'developer'
  | 'utilities'
  | 'search'
  | 'media'
  | 'integration';

/**
 * Marketplace plugin (extends PluginManifest with market-specific fields)
 */
export interface MarketplacePlugin {
  // === From PluginManifest ===
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: PluginPermission[];
  triggers: string[];
  settings?: PluginSetting[];
  icon?: string;
  homepage?: string;
  repository?: string;

  // === Market-specific fields ===
  downloadCount: number;
  rating: number; // 0-5
  ratingCount: number;
  category: PluginCategory;

  // === Installation state ===
  installed: boolean;
  installedVersion?: string;
  updateAvailable: boolean;
  latestVersion: string;

  // === Metadata ===
  screenshots?: string[];
  tags: string[];
  publishedAt: number; // timestamp (ms)
  updatedAt: number; // timestamp (ms)
}

// ============================================================================
// Bulk Operation Types
// ============================================================================

/**
 * Bulk operation type
 */
export type BulkOperationType =
  | 'enable'
  | 'disable'
  | 'uninstall'
  | 'update';

/**
 * Bulk operation status
 */
export type BulkOperationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'partial_failure'
  | 'failed';

/**
 * Bulk operation
 */
export interface BulkOperation {
  type: BulkOperationType;
  targetPluginIds: string[];
  status: BulkOperationStatus;
  results: BulkOperationResult[];
  startedAt: number; // timestamp (ms)
  completedAt?: number; // timestamp (ms)
}

/**
 * Bulk operation result for a single plugin
 */
export interface BulkOperationResult {
  pluginId: string;
  success: boolean;
  error?: string;
}

// ============================================================================
// State Management Types
// ============================================================================

/**
 * Plugin notification type
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Plugin notification
 */
export interface PluginNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // ms
}

/**
 * Plugin manager state (global state)
 */
export interface PluginManagerState {
  // === Core data ===
  plugins: Plugin[];
  marketplacePlugins: MarketplacePlugin[];

  // === UI state ===
  currentView: 'installed' | 'marketplace' | 'install';
  selectedPluginIds: Set<string>;
  detailPanelPluginId: string | null;

  // === Filter and search ===
  searchQuery: string;
  statusFilter: 'all' | 'enabled' | 'disabled';
  categoryFilter: PluginCategory | 'all';

  // === Loading state ===
  loading: boolean;
  error: string | null;

  // === Bulk operations ===
  bulkOperation: BulkOperation | null;

  // === Notifications ===
  notifications: PluginNotification[];
}

/**
 * Plugin manager action type
 */
export type PluginManagerAction =
  // === Data loading ===
  | { type: 'LOAD_PLUGINS_START' }
  | { type: 'LOAD_PLUGINS_SUCCESS'; payload: Plugin[] }
  | { type: 'LOAD_PLUGINS_ERROR'; payload: string }

  // === Plugin operations ===
  | { type: 'ENABLE_PLUGIN'; payload: string }
  | { type: 'DISABLE_PLUGIN'; payload: string }
  | { type: 'UNINSTALL_PLUGIN'; payload: string }

  // === Bulk operations ===
  | { type: 'BULK_ENABLE_START'; payload: string[] }
  | { type: 'BULK_ENABLE_PROGRESS'; payload: { pluginId: string; success: boolean } }
  | { type: 'BULK_ENABLE_COMPLETE' }

  // === Selection and filter ===
  | { type: 'TOGGLE_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: PluginManagerState['statusFilter'] }
  | { type: 'SET_CATEGORY_FILTER'; payload: PluginManagerState['categoryFilter'] }

  // === UI state ===
  | { type: 'SET_VIEW'; payload: PluginManagerState['currentView'] }
  | { type: 'SHOW_DETAILS'; payload: string }
  | { type: 'HIDE_DETAILS' }

  // === Notifications ===
  | { type: 'SHOW_NOTIFICATION'; payload: Omit<PluginNotification, 'id'> }
  | { type: 'DISMISS_NOTIFICATION'; payload: string };

// ============================================================================
// Service Types
// ============================================================================

/**
 * Plugin filter options
 */
export interface PluginFilters {
  status?: 'all' | 'enabled' | 'disabled';
  health?: PluginHealthStatus;
  category?: PluginCategory;
}

/**
 * Permission status map
 */
export type PermissionStatusMap = Map<PluginPermission, boolean>;

/**
 * Plugin config map
 */
export type PluginConfigMap = Record<string, string | number | boolean>;

/**
 * Marketplace query options
 */
export interface MarketplaceQueryOptions {
  category?: PluginCategory;
  page?: number; // starts from 1
  pageSize?: number; // default 20
  sortBy?: 'name' | 'rating' | 'downloads' | 'updated';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Marketplace search options
 */
export interface MarketplaceSearchOptions extends MarketplaceQueryOptions {
  searchIn?: ('name' | 'description' | 'author' | 'tags')[];
}

/**
 * Marketplace plugin page result
 */
export interface MarketplacePluginPage {
  plugins: MarketplacePlugin[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Install result
 */
export interface InstallResult {
  success: boolean;
  plugin?: Plugin;
  error?: string;
}

/**
 * Update result
 */
export interface UpdateResult {
  success: boolean;
  previousVersion?: string;
  newVersion?: string;
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Plugin error exception class
 */
export class PluginException extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PluginError';
  }
}
