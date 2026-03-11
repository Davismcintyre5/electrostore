import { useState, useEffect } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import api from '../../services/api'

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    fetchUnreadCount()
    // Poll every 30 seconds or use socket.io
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count')
      setUnreadCount(res.data.count)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const toggleDropdown = async () => {
    if (!showDropdown) {
      await fetchNotifications()
    }
    setShowDropdown(!showDropdown)
  }

  const markAsRead = async (ids) => {
    await api.patch('/notifications/mark-read', { ids })
    fetchUnreadCount()
    setNotifications(notifications.map(n => n.isRead ? n : { ...n, isRead: true }))
  }

  return (
    <div className="relative">
      <button onClick={toggleDropdown} className="relative">
        <BellIcon className="h-6 w-6 text-gray-700 hover:text-indigo-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-50">
          <div className="p-2 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead(notifications.filter(n => !n.isRead).map(n => n._id))}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No notifications</p>
            ) : (
              notifications.map(n => (
                <div key={n._id} className={`p-3 border-b hover:bg-gray-50 ${n.isRead ? 'opacity-75' : 'bg-blue-50'}`}>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-gray-600">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell