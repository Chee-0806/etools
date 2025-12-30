import { useState, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { register } from "@tauri-apps/plugin-global-shortcut";
import "./App.css";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  action: () => void;
}

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when window shows
  useEffect(() => {
    inputRef.current?.focus();

    // Register global shortcut
    const setupShortcut = async () => {
      try {
        // Detect platform for shortcut
        const isMac = navigator.userAgent.includes("Mac");
        const shortcut = isMac ? "Command+Space" : "Alt+Space";

        await register(shortcut, async () => {
          const window = getCurrentWindow();
          const isVisible = await window.isVisible();
          if (isVisible) {
            await window.hide();
          } else {
            await window.show();
            await window.setFocus();
          }
        });
      } catch (e) {
        console.error("Failed to register global shortcut:", e);
      }
    };

    setupShortcut();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        results[selectedIndex]?.action();
      } else if (e.key === "Escape") {
        e.preventDefault();
        hideWindow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [results, selectedIndex]);

  // Hide window
  const hideWindow = async () => {
    try {
      await invoke("hide_window");
    } catch (e) {
      console.error("Failed to hide window:", e);
    }
  };

  // Search logic (placeholder for now)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // TODO: Implement actual search
    // For now, just show some demo results
    const demoResults: SearchResult[] = [
      {
        id: "1",
        title: `Search for "${query}"`,
        subtitle: "Press Enter to search",
        action: () => {
          console.log("Searching for:", query);
          hideWindow();
        },
      },
    ];
    setResults(demoResults);
    setSelectedIndex(0);
  }, [query]);

  // Handle blur (hide window when clicking outside)
  const handleBlur = () => {
    setTimeout(() => {
      if (document.activeElement?.tagName !== "INPUT") {
        hideWindow();
      }
    }, 100);
  };

  return (
    <div className="app" onMouseDown={handleBlur}>
      <div className="search-container">
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search apps, files, plugins..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              className="clear-button"
              onClick={() => setQuery("")}
              aria-label="Clear"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="results-list">
            {results.map((result, index) => (
              <div
                key={result.id}
                className={`result-item ${
                  index === selectedIndex ? "selected" : ""
                }`}
                onClick={() => result.action()}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {result.icon && <span className="result-icon">{result.icon}</span>}
                <div className="result-content">
                  <div className="result-title">{result.title}</div>
                  {result.subtitle && (
                    <div className="result-subtitle">{result.subtitle}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
