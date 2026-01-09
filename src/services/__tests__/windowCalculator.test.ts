/**
 * Unit Tests: Window Calculator Service
 * Tests for percentage-based window size calculation logic
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Window Calculator', () => {
  // Mock the Rust module for testing calculation logic
  const calculateLayout = (
    screenInfo: any,
    config: any,
    currentSize?: { width: number; height: number }
  ) => {
    // Simplified version of the Rust calculation logic
    let width = Math.floor(screenInfo.availableWidth * config.width_percent);
    let height = Math.floor(screenInfo.availableHeight * config.height_percent);

    // Apply min/max constraints
    width = Math.max(config.min_width, Math.min(config.max_width, width));
    height = Math.max(config.min_height, Math.min(config.max_height, height));

    // Apply margins (20px on all sides)
    const margin = 20;
    const maxX = screenInfo.availableWidth - width - margin;
    const maxY = screenInfo.availableHeight - height - margin;

    // Calculate position (centered by default)
    let x = Math.floor((screenInfo.availableWidth - width) / 2);
    let y = Math.floor((screenInfo.availableHeight - height) / 2);

    // Apply vertical offset if specified
    if (config.vertical_offset) {
      y = Math.floor(screenInfo.availableHeight * config.vertical_offset);
      y = Math.min(y, maxY);
    }

    // Ensure within bounds
    x = Math.max(margin, Math.min(maxX, x));
    y = Math.max(margin, Math.min(maxY, y));

    // Calculate animation requirement
    let animationRequired = false;
    if (currentSize) {
      const sizeDelta = Math.abs(width - currentSize.width) + Math.abs(height - currentSize.height);
      animationRequired = sizeDelta > 10;
    }

    return {
      targetWidth: width,
      targetHeight: height,
      targetX: x,
      targetY: y,
      animationRequired,
    };
  };

  describe('Percentage-based calculation', () => {
    it('should calculate window size as percentage of screen', () => {
      const screenInfo = {
        screenWidth: 1920,
        screenHeight: 1080,
        availableWidth: 1920,
        availableHeight: 1000,
        scaleFactor: 1.0,
      };

      const config = {
        view_id: 'test',
        width_percent: 0.5,
        height_percent: 0.5,
        min_width: 400,
        max_width: 1200,
        min_height: 300,
        max_height: 800,
        vertical_offset: 0.3,
      };

      const result = calculateLayout(screenInfo, config);

      expect(result.targetWidth).toBe(960); // 50% of 1920
      expect(result.targetHeight).toBe(500); // 50% of 1000
    });

    it('should respect min constraints', () => {
      const screenInfo = {
        screenWidth: 800,
        screenHeight: 600,
        availableWidth: 800,
        availableHeight: 550,
        scaleFactor: 1.0,
      };

      const config = {
        view_id: 'test',
        width_percent: 0.5, // Would be 400, but min is 500
        height_percent: 0.5,
        min_width: 500,
        max_width: 1200,
        min_height: 400,
        max_height: 800,
        vertical_offset: 0,
      };

      const result = calculateLayout(screenInfo, config);

      expect(result.targetWidth).toBeGreaterThanOrEqual(500);
      expect(result.targetHeight).toBeGreaterThanOrEqual(400);
    });

    it('should respect max constraints', () => {
      const screenInfo = {
        screenWidth: 3840,
        screenHeight: 2160,
        availableWidth: 3840,
        availableHeight: 2080,
        scaleFactor: 1.0,
      };

      const config = {
        view_id: 'test',
        width_percent: 0.5, // Would be 1920, but max is 1200
        height_percent: 0.5,
        min_width: 500,
        max_width: 1200,
        min_height: 400,
        max_height: 800,
        vertical_offset: 0,
      };

      const result = calculateLayout(screenInfo, config);

      expect(result.targetWidth).toBeLessThanOrEqual(1200);
      expect(result.targetHeight).toBeLessThanOrEqual(800);
    });
  });

  describe('Animation requirement detection', () => {
    it('should require animation when size delta > 10px', () => {
      const screenInfo = {
        screenWidth: 1920,
        screenHeight: 1080,
        availableWidth: 1920,
        availableHeight: 1000,
        scaleFactor: 1.0,
      };

      const config = {
        view_id: 'test',
        width_percent: 0.5,
        height_percent: 0.5,
        min_width: 500,
        max_width: 1200,
        min_height: 300,
        max_height: 800,
        vertical_offset: 0,
      };

      const currentSize = { width: 800, height: 500 };
      const result = calculateLayout(screenInfo, config, currentSize);

      // Delta: (960-800) + (500-500) = 160 > 10
      expect(result.animationRequired).toBe(true);
    });

    it('should not require animation when size delta <= 10px', () => {
      const screenInfo = {
        screenWidth: 1920,
        screenHeight: 1080,
        availableWidth: 1920,
        availableHeight: 1000,
        scaleFactor: 1.0,
      };

      const config = {
        view_id: 'test',
        width_percent: 0.5,
        height_percent: 0.5,
        min_width: 500,
        max_width: 1200,
        min_height: 300,
        max_height: 800,
        vertical_offset: 0,
      };

      const currentSize = { width: 955, height: 500 };
      const result = calculateLayout(screenInfo, config, currentSize);

      // Delta: (960-955) + (500-500) = 5 <= 10
      expect(result.animationRequired).toBe(false);
    });
  });

  describe('Position calculation', () => {
    it('should center window by default', () => {
      const screenInfo = {
        screenWidth: 1920,
        screenHeight: 1080,
        availableWidth: 1920,
        availableHeight: 1000,
        scaleFactor: 1.0,
      };

      const config = {
        view_id: 'test',
        width_percent: 0.5,
        height_percent: 0.5,
        min_width: 500,
        max_width: 1200,
        min_height: 300,
        max_height: 800,
        vertical_offset: 0,
      };

      const result = calculateLayout(screenInfo, config);

      // Centered: (1920-960)/2 = 480, (1000-500)/2 = 250
      expect(result.targetX).toBe(480);
      expect(result.targetY).toBe(250);
    });

    it('should apply vertical offset when specified', () => {
      const screenInfo = {
        screenWidth: 1920,
        screenHeight: 1080,
        availableWidth: 1920,
        availableHeight: 1000,
        scaleFactor: 1.0,
      };

      const config = {
        view_id: 'test',
        width_percent: 0.35,
        height_percent: 0.4,
        min_width: 500,
        max_width: 800,
        min_height: 300,
        max_height: 600,
        vertical_offset: 0.2, // Upper 20% of screen
      };

      const result = calculateLayout(screenInfo, config);

      // Y position: 20% of 1000 = 200
      expect(result.targetY).toBe(200);
    });
  });

  describe('Margin enforcement', () => {
    it('should keep window within screen bounds with margins', () => {
      const screenInfo = {
        screenWidth: 1000,
        screenHeight: 800,
        availableWidth: 1000,
        availableHeight: 750,
        scaleFactor: 1.0,
      };

      const config = {
        view_id: 'test',
        width_percent: 0.9, // Would be 900px
        height_percent: 0.9, // Would be 675px
        min_width: 500,
        max_width: 1200,
        min_height: 300,
        max_height: 800,
        vertical_offset: 0,
      };

      const result = calculateLayout(screenInfo, config);

      // With 20px margin, max size is 1000-40=960, 750-40=710
      expect(result.targetWidth).toBeLessThanOrEqual(960);
      expect(result.targetHeight).toBeLessThanOrEqual(710);
    });
  });
});
