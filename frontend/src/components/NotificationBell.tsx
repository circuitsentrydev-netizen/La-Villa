import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import "./NotificationBell.css";

interface Notification {
  id: string | number;
  type?: string;
  title?: string;
  message?: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  createdAt?: string;
  is_read?: boolean;
  isRead?: boolean;
  read_at?: string | null;
  readAt?: string | null;
}

interface NotificationApiResponse {
  notifications?: Notification[];
  unreadCount?: number;
  data?: {
    notifications?: Notification[];
    unreadCount?: number;
  };
  message?: string;
}

const getToken = (): string | null =>
  localStorage.getItem("lavilla_token") ||
  localStorage.getItem("token");

const isNotificationRead = (notification: Notification): boolean => {
  if (typeof notification.is_read === "boolean") {
    return notification.is_read;
  }

  if (typeof notification.isRead === "boolean") {
    return notification.isRead;
  }

  return Boolean(notification.read_at || notification.readAt);
};

const formatNotificationDate = (value?: string): string => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getNotificationIcon = (type?: string): string => {
  const normalized = (type || "").toUpperCase();

  if (normalized.includes("PAYMENT")) return "✓";
  if (normalized.includes("RESERVATION")) return "▣";
  if (normalized.includes("BOOKING")) return "▣";

  return "●";
};

export function NotificationBell() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    const activeToken = getToken();

    if (!activeToken) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications`,
        {
          headers: {
            Authorization: `Bearer ${activeToken}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (response.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load notifications.");
      }

      const result: NotificationApiResponse = await response.json();

      const notificationList =
        result.notifications ??
        result.data?.notifications ??
        [];

      const validNotifications = Array.isArray(notificationList)
        ? notificationList
        : [];

      setNotifications(validNotifications);

      const serverUnreadCount =
        result.unreadCount ??
        result.data?.unreadCount;

      setUnreadCount(
        typeof serverUnreadCount === "number"
          ? serverUnreadCount
          : validNotifications.filter(
              (item) => !isNotificationRead(item)
            ).length
      );

      setError("");
    } catch (err) {
      console.error("Notification loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications."
      );
    }
  }, []);

  useEffect(() => {
    const activeToken = getToken();

    if (!activeToken) return;

    setLoading(true);

    void fetchNotifications().finally(() => {
      setLoading(false);
    });

    const interval = window.setInterval(() => {
      void fetchNotifications();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const markAsRead = async (notification: Notification) => {
    if (isNotificationRead(notification)) return;

    const activeToken = getToken();

    if (!activeToken) return;

    const id = String(notification.id);

    try {
      setProcessingId(id);

      const response = await fetch(
        `${API_BASE_URL}/notifications/${encodeURIComponent(id)}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to mark notification as read.");
      }

      setNotifications((current) =>
        current.map((item) =>
          String(item.id) === id
            ? {
                ...item,
                is_read: true,
                isRead: true,
              }
            : item
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const markAllAsRead = async () => {
    const activeToken = getToken();

    if (!activeToken || unreadCount === 0) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to mark all notifications as read.");
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          isRead: true,
        }))
      );

      setUnreadCount(0);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string | number) => {
    const activeToken = getToken();

    if (!activeToken) return;

    const id = String(notificationId);

    const notification = notifications.find(
      (item) => String(item.id) === id
    );

    if (!notification) return;

    try {
      setProcessingId(id);

      const response = await fetch(
        `${API_BASE_URL}/notifications/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to delete notification.");
      }

      setNotifications((current) =>
        current.filter((item) => String(item.id) !== id)
      );

      if (!isNotificationRead(notification)) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }

      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete notification."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const openNotification = async (notification: Notification) => {
    if (!isNotificationRead(notification)) {
      await markAsRead(notification);
    }

    const destination = notification.link;

    setIsOpen(false);

    // Only navigate to internal application paths.
    if (
      destination &&
      destination.startsWith("/") &&
      !destination.startsWith("//")
    ) {
      navigate(destination);
      return;
    }

    navigate("/reservations");
  };

  if (!getToken()) {
    return null;
  }

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell-button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => {
          setIsOpen((current) => !current);

          if (!isOpen) {
            void fetchNotifications();
          }
        }}
      >
        <span className="notification-bell-icon" aria-hidden="true">
          ♧
        </span>

        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <h3>Notifications</h3>
              <p>
                {unreadCount > 0
                  ? `${unreadCount} unread notification${
                      unreadCount === 1 ? "" : "s"
                    }`
                  : "You're all caught up"}
              </p>
            </div>

            <button
              type="button"
              className="notification-close-button"
              aria-label="Close notifications"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          {unreadCount > 0 && (
            <div className="notification-toolbar">
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                disabled={loading}
              >
                Mark all as read
              </button>
            </div>
          )}

          {error && (
            <div className="notification-error" role="alert">
              {error}
              <button type="button" onClick={() => void fetchNotifications()}>
                Retry
              </button>
            </div>
          )}

          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="notification-empty">
                Loading notifications…
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="notification-empty-icon">♧</span>
                <strong>No notifications yet</strong>
                <p>
                  Reservation updates and payment alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const isRead = isNotificationRead(notification);
                const id = String(notification.id);

                return (
                  <article
                    key={id}
                    className={`notification-item ${
                      isRead ? "is-read" : "is-unread"
                    }`}
                  >
                    <button
                      type="button"
                      className="notification-item-main"
                      onClick={() => void openNotification(notification)}
                      disabled={processingId === id}
                    >
                      <span className="notification-item-icon">
                        {getNotificationIcon(notification.type)}
                      </span>

                      <span className="notification-item-content">
                        <strong>
                          {notification.title || "La Villa update"}
                        </strong>

                        <span className="notification-item-message">
                          {notification.message || ""}
                        </span>

                        <span className="notification-item-date">
                          {formatNotificationDate(
                            notification.created_at ??
                              notification.createdAt
                          )}
                        </span>
                      </span>

                      {!isRead && (
                        <span
                          className="notification-unread-dot"
                          aria-label="Unread"
                        />
                      )}
                    </button>

                    <button
                      type="button"
                      className="notification-delete-button"
                      aria-label="Delete notification"
                      title="Delete notification"
                      disabled={processingId === id}
                      onClick={() => void deleteNotification(id)}
                    >
                      ×
                    </button>
                  </article>
                );
              })
            )}
          </div>

          <div className="notification-dropdown-footer">
            <button
              type="button"
              onClick={() => void fetchNotifications()}
              disabled={loading}
            >
              ↻ Refresh notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;