import React, { useState, useEffect } from 'react';
import { Bell, X, Mail, Calendar, Home, Dumbbell, Film, ArrowRight } from 'lucide-react';

interface Notification {
  id: string;
  type: 'email' | 'calendar' | 'ha' | 'yoga' | 'movie' | 'system';
  title: string;
  message: string;
  timestamp: string;
  action?: {
    label: string;
    url?: string;
    onClick?: () => void;
  };
  read: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load notifications from various sources
    loadNotifications();
    // Refresh every minute
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    const newNotifications: Notification[] = [];

    // 1. Recent emails
    try {
      const emailRes = await fetch('/api/emails/recent?limit=3');
      if (emailRes.ok) {
        const emailData = await emailRes.json();
        emailData.emails?.slice(0, 3).forEach((email: any) => {
          newNotifications.push({
            id: `email-${email.id}`,
            type: 'email',
            title: email.from_name || email.from_email,
            message: email.subject,
            timestamp: email.received_at,
            action: {
              label: 'View',
              url: `https://mail.google.com/mail/u/0/#inbox/${email.id}`,
            },
            read: false,
          });
        });
      }
    } catch (e) {
      console.log('Email notifications not available');
    }

    // 2. Home Assistant events
    try {
      const haRes = await fetch('/api/ha/presence');
      if (haRes.ok) {
        const haData = await haRes.json();
        if (haData.sarah?.isHome !== undefined) {
          newNotifications.push({
            id: 'ha-sarah',
            type: 'ha',
            title: haData.sarah.isHome ? 'Sarah arrived home' : 'Sarah left home',
            message: haData.sarah.location || 'Location updated',
            timestamp: new Date().toISOString(),
            read: true,
          });
        }
      }
    } catch (e) {
      console.log('HA notifications not available');
    }

    // 3. System notifications
    newNotifications.push({
      id: 'system-backup',
      type: 'system',
      title: 'Backup completed',
      message: 'Session backup saved to GitHub',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      read: true,
    });

    // Sort by timestamp, newest first
    newNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setNotifications(newNotifications.slice(0, 10));
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4 text-pink-400" />;
      case 'calendar': return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'ha': return <Home className="w-4 h-4 text-cyan-400" />;
      case 'yoga': return <Dumbbell className="w-4 h-4 text-orange-400" />;
      case 'movie': return <Film className="w-4 h-4 text-purple-400" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <>
      {/* Bell Button with Badge */}
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-surface-light rounded-lg transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-border z-[101] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-work" />
                <h2 className="text-lg font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Mark all read
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-surface-light rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No notifications yet</p>
                  <p className="text-sm mt-1">Check back later for updates</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      notification.read 
                        ? 'bg-surface-light border-border' 
                        : 'bg-work/5 border-work/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium text-sm truncate ${
                            notification.read ? 'text-gray-300' : 'text-white'
                          }`}>
                            {notification.title}
                          </h3>
                          <span className="text-xs text-gray-500 shrink-0">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.action && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (notification.action?.url) {
                                window.open(notification.action.url, '_blank');
                              }
                              notification.action?.onClick?.();
                            }}
                            className="flex items-center gap-1 text-xs text-work mt-2 hover:underline"
                          >
                            {notification.action.label}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-work rounded-full shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
