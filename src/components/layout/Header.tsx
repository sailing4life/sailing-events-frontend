import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../services/api';
import type { NotificationItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function Header() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Je bent uitgelogd');
    navigate('/login');
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await notificationsApi.getAll(50);
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    loadNotifications();

    const streamUrl = `${API_BASE_URL}/api/notifications/stream?ngrok-skip-browser-warning=true`;
    const eventSource = new EventSource(streamUrl);
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as NotificationItem;
        setNotifications(prev => [payload, ...prev].slice(0, 100));
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };
    eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleToggleNotifications = async () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && unreadCount > 0) {
      try {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        await notificationsApi.markRead(unreadIds);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (error) {
        console.error('Error marking notifications as read:', error);
      }
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('nl-NL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-ocean-500 to-ocean-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Team Heiner Event Manager</h1>
              <p className="text-xs text-gray-500">Event Management</p>
            </div>
          </Link>

          {/* Quick Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={handleToggleNotifications}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Notificaties"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Notificaties</p>
                      <p className="text-xs text-gray-500">Reacties op uitnodigingen</p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const ids = notifications.map(n => n.id);
                          await notificationsApi.markRead(ids);
                          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                        } catch (error) {
                          console.error('Error marking all notifications as read:', error);
                        }
                      }}
                      className="text-xs text-cyan-700 hover:text-cyan-800"
                    >
                      Alles gelezen
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-gray-500 text-center">
                        Nog geen notificaties
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <Link
                          key={notification.id}
                          to={notification.event_id ? `/events/${notification.event_id}` : '#'}
                          className={`block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                            notification.is_read ? 'bg-white' : 'bg-cyan-50'
                          }`}
                        >
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatNotificationTime(notification.created_at)}</p>
                        </Link>
                      ))
                    )}
                    <div className="px-4 py-3">
                      <Link to="/notifications" className="text-sm text-cyan-700 hover:text-cyan-800">
                        Bekijk alle notificaties →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Link
              to="/events/new"
              className="btn-primary flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nieuw Event</span>
            </Link>

            {/* User & Logout */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-600">{user?.username}</span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Uitloggen"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
