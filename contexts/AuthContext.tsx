'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Role = 'admin' | 'student'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role: Role, userData?: any) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
  uploadProfilePicture: (file: File, userId: string) => Promise<{ error: any; url?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const clearRememberPreference = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('rememberMe')
  }

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!isMounted) return
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string, role: Role, userData?: any) => {
    try {
      // Create auth user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            student_id: userData?.studentId || '',
            phone: userData?.phone || '',
            course: userData?.course || '',
            year_level: userData?.yearLevel || '',
            sport: userData?.sport || '',
            position: userData?.position || '',
            department: userData?.department || '',
            title: userData?.title || '',
            id_picture_url: userData?.id_picture_url || '',
            is_verified: userData?.is_verified ?? false,
          },
        },
      })

      if (error) {
        console.error('Signup error:', error)
        return { error }
      }

      // If user was created and we have additional data, update the user profile
      if (data.user && userData) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            student_id: userData.studentId || null,
            phone: userData.phone || null,
            course: userData.course || null,
            year_level: userData.yearLevel || null,
            sport: userData.sport || null,
            position: userData.position || null,
            department: userData.department || null,
            title: userData.title || null,
            id_picture_url: userData.id_picture_url || null,
            is_verified: userData.is_verified ?? false,
          })
          .eq('id', data.user.id)

        if (updateError) {
          console.error('Error updating user profile:', updateError)
        }
      }

      return { error: null }
    } catch (err) {
      console.error('Signup exception:', err)
      return { error: err }
    }
  }

  const uploadProfilePicture = async (file: File, userId: string) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      return { error: uploadError }
    }

    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    // Update user profile with the new picture URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_picture_url: data.publicUrl })
      .eq('id', userId)

    return { error: updateError, url: data.publicUrl }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    clearRememberPreference()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
    } catch (error) {
      console.error('Exception during sign out:', error)
    } finally {
      setSession(null)
      setUser(null)
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    uploadProfilePicture,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
