/**
 * SkipLinks Component
 * Provides skip links for accessibility
 */

import React from 'react';

interface SkipLinksProps {
  /**
   * Target ID for the main content
   */
  targetId?: string;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({ targetId = 'main-content' }) => {
  return (
    <div style={{ position: 'absolute', left: '-10000px', width: '1px', height: '1px', overflow: 'hidden' }}>
      <a
        href={`#${targetId}`}
        style={{
          position: 'absolute',
          left: '0',
          top: '0',
          background: 'var(--accent-color)',
          color: 'white',
          padding: '8px 16px',
          zIndex: 9999,
          textDecoration: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '0';
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-10000px';
        }}
      >
        跳转到主内容
      </a>
    </div>
  );
};

export default SkipLinks;
