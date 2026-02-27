import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationsApi } from '../services/api';
import type { NotificationItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const data = await notificationsApi.getAll(200);
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    loadNotifications();

    const streamUrl = `${API_BASE_URL}/api/notifications/stream?ngrok-skip-browser-warning=true`;
    const eventSource = new EventSource(streamUrl);
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as NotificationItem;
        setNotifications(prev => {
          if (prev.some(n => n.id === payload.id)) {
            return prev;
          }
          return [payload, ...prev].slice(0, 200);
        });
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

  const filteredNotifications = showUnreadOnly
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const handleMarkAllRead = async () => {
    try {
      const ids = notifications.map(n => n.id);
      await notificationsApi.markRead(ids);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markRead([id]);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('nl-NL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Laden...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notificaties</h1>
          <p className="text-gray-600">Reacties op uitnodigingen</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowUnreadOnly(prev => !prev)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showUnreadOnly ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showUnreadOnly ? 'Toon alle' : 'Alleen ongelezen'}
          </button>
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Alles gelezen
          </button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-600">Nog geen notificaties</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`card flex items-start justify-between gap-4 ${
                notification.is_read ? 'opacity-90' : 'border border-cyan-200'
              }`}
            >
              <div>
                <p className="text-gray-900 font-medium">{notification.message}</p>
                <p className="text-sm text-gray-500 mt-1">{formatNotificationTime(notification.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                {notification.event_id && (
                  <Link
                    to={`/events/${notification.event_id}`}
                    className="text-sm text-cyan-700 hover:text-cyan-800"
                  >
                    Bekijk event
                  </Link>
                )}
                {!notification.is_read && (
                  <button
                    onClick={() => handleMarkRead(notification.id)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Markeer gelezen
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
