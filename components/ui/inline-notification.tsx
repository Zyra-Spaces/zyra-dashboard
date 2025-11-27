"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationState {
  id: number;
  message: string;
  type: NotificationType;
}

let notificationId = 0;
const listeners: Set<(notification: NotificationState | null) => void> = new Set();

// Global notification functions
export const notify = {
  success: (message: string) => {
    const notification = { id: ++notificationId, message, type: "success" as const };
    listeners.forEach(listener => listener(notification));
  },
  error: (message: string) => {
    const notification = { id: ++notificationId, message, type: "error" as const };
    listeners.forEach(listener => listener(notification));
  },
  warning: (message: string) => {
    const notification = { id: ++notificationId, message, type: "warning" as const };
    listeners.forEach(listener => listener(notification));
  },
  info: (message: string) => {
    const notification = { id: ++notificationId, message, type: "info" as const };
    listeners.forEach(listener => listener(notification));
  },
};

interface InlineNotificationProps {
  className?: string;
}

export function InlineNotification({ className = "" }: InlineNotificationProps) {
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const listener = (newNotification: NotificationState | null) => {
      if (newNotification) {
        setNotification(newNotification);
        setIsVisible(true);
        
        // Auto hide after 3 seconds
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => setNotification(null), 300); // Wait for fade out
        }, 3000);
        
        return () => clearTimeout(timer);
      }
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => setNotification(null), 300);
  }, []);

  if (!notification) return null;

  const icons = {
    success: <CheckCircle className="w-4 h-4" />,
    error: <XCircle className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
  };

  const colors = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const iconColors = {
    success: "text-emerald-500",
    error: "text-red-500",
    warning: "text-amber-500",
    info: "text-blue-500",
  };

  return (
    <div
      className={`
        ${className}
        ${colors[notification.type]}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
        transition-all duration-300 ease-out
        flex items-center gap-2 px-3 py-2 rounded-lg border text-sm
      `}
    >
      <span className={iconColors[notification.type]}>{icons[notification.type]}</span>
      <span className="flex-1">{notification.message}</span>
      <button
        onClick={dismiss}
        className="p-0.5 hover:bg-black/5 rounded transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}




