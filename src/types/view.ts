export type ViewType = 'search' | 'settings' | 'plugins' | 'plugin-ui';

export interface ViewHistoryEntry {
  viewId: ViewType;
  timestamp: number;
  stateData?: {
    scrollPosition?: number;
    focusedInputId?: string;
    [key: string]: any;
  };
}

export type Direction = 'forward' | 'backward' | 'none';
