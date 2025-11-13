
"use client";

import { useState, useEffect } from "react";
import { Bell, ShoppingCart, AlertTriangle, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/firestore";
import type { Notification } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';


export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = getNotifications(setNotifications);
    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && unreadCount > 0) {
      // Optional: Mark all as read when closing the popover
      // markAllNotificationsAsRead();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    // Handle navigation if notification.link exists
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'new-order': return <ShoppingCart className="h-5 w-5 text-blue-500" />;
      case 'low-stock': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  }
  
  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
            <h4 className="font-medium text-sm">Notifications</h4>
            {unreadCount > 0 && (
                <Button variant="link" size="sm" onClick={handleMarkAllRead} className="h-auto p-0 text-xs">
                    Mark all as read
                </Button>
            )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-3 flex items-start gap-3 hover:bg-muted/50 cursor-pointer",
                    !notification.isRead && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                        </p>
                    </div>
                     {!notification.isRead && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                    )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-muted-foreground text-sm">
                <Bell className="h-10 w-10 mb-2" />
                <p>No new notifications</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
