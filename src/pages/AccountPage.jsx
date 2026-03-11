import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import ProfileForm from '../components/account/ProfileForm'
import PasswordForm from '../components/account/PasswordForm'

const AccountPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const handleProfileUpdate = (updatedUser) => {
    // Optionally update local user state if needed
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Account</h1>
      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-center mb-4">
              <div className="bg-indigo-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-indigo-600">{user?.name.charAt(0)}</span>
              </div>
              <h2 className="mt-2 font-semibold">{user?.name}</h2>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-2 rounded ${activeTab === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`w-full text-left px-3 py-2 rounded ${activeTab === 'password' ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}
              >
                Change Password
              </button>
            </nav>
          </div>
        </div>
        <div className="md:col-span-3">
          {activeTab === 'profile' && (
            <ProfileForm user={user} onUpdate={handleProfileUpdate} />
          )}
          {activeTab === 'password' && <PasswordForm />}
        </div>
      </div>
    </div>
  )
}

export default AccountPage