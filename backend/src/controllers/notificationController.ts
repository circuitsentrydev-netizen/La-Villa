
import { Request, Response } from "express";
import { NotificationService } from "../services/notificationService";

const notificationService = new NotificationService();

const authenticatedUserId = (req: Request): string | null =>
  req.user?.id ?? null;

// Safely retrieve a single notification ID from Express route parameters.
const getNotificationId = (req: Request): string | null => {
  const notificationId = req.params.id;

  if (
    typeof notificationId !== "string" ||
    !notificationId.trim()
  ) {
    return null;
  }

  return notificationId.trim();
};

// GET: Retrieve the authenticated user's notifications.
export const getMyNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        message: "Please sign in again.",
      });
      return;
    }

    const requestedLimit = Number(req.query.limit);
    const limit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), 100)
        : 50;

    const notifications = await notificationService.getForUser(
      userId,
      limit
    );

    const unreadCount =
      await notificationService.getUnreadCount(userId);

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications failed:", error);

    res.status(500).json({
      message: "Unable to load notifications.",
    });
  }
};

// PATCH: Mark one notification as read.
export const markNotificationAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        message: "Please sign in again.",
      });
      return;
    }

    const notificationId = getNotificationId(req);

    if (!notificationId) {
      res.status(400).json({
        message: "Invalid notification ID.",
      });
      return;
    }

    const notification = await notificationService.markAsRead(
      notificationId,
      userId
    );

    if (!notification) {
      res.status(404).json({
        message: "Notification not found.",
      });
      return;
    }

    const unreadCount =
      await notificationService.getUnreadCount(userId);

    res.status(200).json({
      message: "Notification marked as read.",
      notification,
      unreadCount,
    });
  } catch (error) {
    console.error("Mark notification as read failed:", error);

    res.status(500).json({
      message: "Unable to update notification.",
    });
  }
};

// PATCH: Mark all of the authenticated user's notifications as read.
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        message: "Please sign in again.",
      });
      return;
    }

    const updated =
      await notificationService.markAllAsRead(userId);

    res.status(200).json({
      message: "All notifications marked as read.",
      updated,
      unreadCount: 0,
    });
  } catch (error) {
    console.error("Mark all notifications as read failed:", error);

    res.status(500).json({
      message: "Unable to update notifications.",
    });
  }
};

// DELETE: Delete one notification belonging to the authenticated user.
export const deleteMyNotification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = authenticatedUserId(req);

    if (!userId) {
      res.status(401).json({
        message: "Please sign in again.",
      });
      return;
    }

    const notificationId = getNotificationId(req);

    if (!notificationId) {
      res.status(400).json({
        message: "Invalid notification ID.",
      });
      return;
    }

    const deleted = await notificationService.deleteNotification(
      notificationId,
      userId
    );

    if (!deleted) {
      res.status(404).json({
        message: "Notification not found.",
      });
      return;
    }

    const unreadCount =
      await notificationService.getUnreadCount(userId);

    res.status(200).json({
      message: "Notification deleted.",
      unreadCount,
    });
  } catch (error) {
    console.error("Delete notification failed:", error);

    res.status(500).json({
      message: "Unable to delete notification.",
    });
  }
};
