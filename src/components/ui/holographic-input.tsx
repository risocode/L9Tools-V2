
"use client";
import React from 'react';
import { cn } from '@/lib/utils';

export interface HolographicInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
}

export const HolographicInput = React.forwardRef<HTMLInputElement, HolographicInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className={cn("input-container", className)}>
        <div className="input-field-container">
          <input
            ref={ref}
            type="text"
            className="holo-input"
            {...props}
          />
          <div className="input-border" />
          <div className="holo-scan-line" />
          <div className="input-glow" />
          <div className="input-active-indicator" />
          {/* These elements are decorative and don't need dynamic content for now */}
          {/* <div className="input-label">Search</div> */}
          <div className="input-data-visualization">
            {[...Array(20)].map((_, i) => (
              <div key={`data-segment-${i}`} className="data-segment" style={{ '--index': i + 1 } as React.CSSProperties} />
            ))}
          </div>
          <div className="input-particles">
            <div className="input-particle" style={{ '--index': 1, top: '20%', left: '10%' } as React.CSSProperties} />
            <div className="input-particle" style={{ '--index': 2, top: '65%', left: '25%' } as React.CSSProperties} />
            <div className="input-particle" style={{ '--index': 3, top: '40%', left: '40%' } as React.CSSProperties} />
            <div className="input-particle" style={{ '--index': 4, top: '75%', left: '60%' } as React.CSSProperties} />
            <div className="input-particle" style={{ '--index': 5, top: '30%', left: '75%' } as React.CSSProperties} />
            <div className="input-particle" style={{ '--index': 6, top: '60%', left: '90%' } as React.CSSProperties} />
          </div>
          <div className="input-holo-overlay" />
          <div className="interface-lines">
            <div className="interface-line" />
            <div className="interface-line" />
            <div className="interface-line" />
            <div className="interface-line" />
          </div>
          <div className="hex-decoration" />
          {/* <div className="input-status">Ready for input</div> */}
          <div className="power-indicator" />
          <div className="input-decoration">
            <div className="decoration-dot" />
            <div className="decoration-line" />
            <div className="decoration-dot" />
            <div className="decoration-line" />
            <div className="decoration-dot" />
            <div className="decoration-line" />
            <div className="decoration-dot" />
          </div>
        </div>
      </div>
    );
  }
);
HolographicInput.displayName = "HolographicInput";
