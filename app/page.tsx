'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import SplashScreen from '@/components/SplashScreen'
import AuthForm from '@/components/AuthForm'
import AdminDashboard from '@/components/AdminDashboard'
import StudentDashboard from '@/components/StudentDashboard'
import { Toaster } from 'react-hot-toast'
import { Crown, GraduationCap } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const { user, loading } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    if (showRoleSelection) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-blue-200 dark:border-gray-700 p-8 text-center">
              <div className="flex justify-end mb-4">
                <ThemeToggle />
              </div>
              <h1 className="text-3xl font-bold text-blue-900 dark:text-white mb-6">Access System</h1>
              <p className="text-blue-700 dark:text-blue-200 mb-8">Choose how you want to access the system</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowRoleSelection(false)
                    setAuthMode('signin')
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                >
                  <Crown className="w-6 h-6" />
                  <span>Admin Sign In</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowRoleSelection(false)
                    setAuthMode('signup')
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold px-6 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
                >
                  <GraduationCap className="w-6 h-6" />
                  <span>Student Registration</span>
                </button>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setShowRoleSelection(false)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </div>
          <Toaster position="top-right" />
        </div>
      )
    }

    return (
      <>
        <AuthForm 
          mode={authMode} 
          onToggleMode={() => {
            if (authMode === 'signin') {
              setShowRoleSelection(true)
            } else {
              setAuthMode('signin')
            }
          }} 
        />
        <Toaster position="top-right" />
      </>
    )
  }

  // Check user role and render appropriate dashboard
  const userRole = user.user_metadata?.role || 'student'
  
  return (
    <>
      {userRole === 'admin' ? <AdminDashboard /> : <StudentDashboard />}
      <Toaster position="top-right" />
    </>
  )
}
