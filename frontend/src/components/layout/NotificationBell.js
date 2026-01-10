import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { notificationsAPI } from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const NotificationBell = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationsAPI.list({ limit: 10 }),
        notificationsAPI.unreadCount()
      ]);
      setNotifications(notifRes.data.notifications || []);
      setUnreadCount(countRes.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
          data-testid="notification-bell"
        >
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${!notif.is_read ? 'bg-violet-50/50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notif.is_read ? 'bg-violet-500' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(notif.created_at)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {notif.link && (
                        <Link to={notif.link} className="text-xs text-violet-600 font-medium hover:underline">
                          View
                        </Link>
                      )}
                      {!notif.is_read && (
                        <button 
                          onClick={() => handleMarkRead(notif.id)}
                          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <DropdownMenuSeparator />
            <Link 
              to="/notifications" 
              className="block px-4 py-2 text-center text-sm text-violet-600 font-medium hover:bg-slate-50"
            >
              View all notifications
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
