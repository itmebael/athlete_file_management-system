import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if we're in a build context (static generation)
const isBuildTime = typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build'

// Create a safe Supabase client that won't fail during build
let supabase: SupabaseClient

try {
  // During build time, if env vars are missing, use placeholder values
  // This allows the build to complete without errors
  if (isBuildTime && (!supabaseUrl || !supabaseAnonKey)) {
    console.warn('⚠️  Supabase environment variables are missing during build. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment environment.')
    // Use placeholder values that won't cause createClient to throw
    supabase = createClient(
      'https://placeholder-project.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTc2ODAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.placeholder'
    )
  } else if (!supabaseUrl || !supabaseAnonKey) {
    // Runtime but env vars missing - still create client with placeholders
    // This prevents runtime crashes, but API calls will fail
    console.warn('⚠️  Supabase environment variables are missing. The app may not function correctly.')
    supabase = createClient(
      'https://placeholder-project.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTc2ODAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.placeholder'
    )
  } else {
    // Normal case: env vars are present
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
} catch (error) {
  // Fallback: if createClient throws for any reason, create a minimal client
  console.error('Failed to create Supabase client:', error)
  supabase = createClient(
    'https://placeholder-project.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyLXByb2plY3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTc2ODAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.placeholder'
  )
}

export { supabase }

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'athlete' | 'coach'
          full_name: string
          student_id: string | null
          phone: string | null
          course: string | null
          year_level: string | null
          sport: string | null
          position: string | null
          department: string | null
          title: string | null
          profile_picture_url: string | null
          id_picture_url: string | null
          is_verified: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'admin' | 'athlete' | 'coach'
          full_name: string
          student_id?: string | null
          phone?: string | null
          course?: string | null
          year_level?: string | null
          sport?: string | null
          position?: string | null
          department?: string | null
          title?: string | null
          profile_picture_url?: string | null
          id_picture_url?: string | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'athlete' | 'coach'
          full_name?: string
          student_id?: string | null
          phone?: string | null
          course?: string | null
          year_level?: string | null
          sport?: string | null
          position?: string | null
          department?: string | null
          title?: string | null
          profile_picture_url?: string | null
          id_picture_url?: string | null
          is_verified?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          parent_folder_id: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          parent_folder_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          parent_folder_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      student_folders: {
        Row: {
          id: string
          name: string
          description: string | null
          student_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          student_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          student_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          name: string
          original_name: string
          file_path: string
          file_size: number
          mime_type: string
          folder_id: string | null
          student_folder_id: string | null
          uploaded_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          original_name: string
          file_path: string
          file_size: number
          mime_type: string
          folder_id?: string | null
          student_folder_id?: string | null
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          original_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          folder_id?: string | null
          student_folder_id?: string | null
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}




