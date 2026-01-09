import type { ViewType } from './view';
import type { CalculatedWindowLayout } from './window';

export interface ResizeStartPayload {
  viewId: ViewType;
  targetLayout: CalculatedWindowLayout;
  estimatedDuration: number;
}

export interface ResizeCompletePayload {
  viewId: ViewType;
  actualLayout: CalculatedWindowLayout;
  actualDuration: number;
  success: boolean;
  error?: string;
}

export interface ViewConfig {
  viewId: string;
  widthPercent: number;
  heightPercent: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  verticalOffset: number;
  transitionDuration: number;
}

export interface CalculatedWindowLayout {
  width: number;
  height: number;
  x: number;
  y: number;
  animationRequired: boolean;
}
