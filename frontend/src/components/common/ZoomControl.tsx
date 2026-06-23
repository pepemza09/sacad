import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/auth/AuthContext";
import { apiClient } from "../../api";

const ZOOM_OPTIONS = [75, 80, 90, 100, 110, 125, 150];

export const ZoomControl: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.zoom_level) {
      applyZoom(user.zoom_level);
      setZoom(user.zoom_level);
    }
  }, [user?.zoom_level]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyZoom = (value: number) => {
    document.documentElement.style.fontSize = `${value}%`;
  };

  const handleSelect = async (value: number) => {
    setZoom(value);
    applyZoom(value);
    setIsOpen(false);
    try {
      await apiClient.patch("/auth/update-zoom/", { zoom_level: value });
    } catch {
      // silently fail
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        title="Zoom"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.5 15.5L19 19M5 11C5 7.68629 7.68629 5 11 5C14.3137 5 17 7.68629 17 11C17 14.3137 14.3137 17 11 17C7.68629 17 5 14.3137 5 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-28 rounded-lg border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800">
          {ZOOM_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`flex w-full items-center justify-center px-3 py-1.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                zoom === opt
                  ? "font-semibold text-brand-500 dark:text-brand-400"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {opt}%
            </button>
          ))}
        </div>
      )}
    </div>
  );
};