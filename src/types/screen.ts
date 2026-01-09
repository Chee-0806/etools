export interface ScreenInfo {
  screenWidth: number;
  screenHeight: number;
  availableWidth: number;
  availableHeight: number;
  scaleFactor: number;
}

export interface ScreenChangedPayload {
  oldScreenInfo: ScreenInfo | null;
  newScreenInfo: ScreenInfo;
  changeType: 'resolution' | 'display_disconnect' | 'display_connect' | 'scale_factor';
}
