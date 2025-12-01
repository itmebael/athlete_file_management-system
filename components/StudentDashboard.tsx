'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Folder, 
  FileText, 
  Download, 
  Trash2, 
  Upload,
  Eye,
  Search,
  Filter,
  Calendar,
  Pencil,
  X,
  Check,
  Trophy,
  Pin
} from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface Folder {
  id: string
  name: string
  description: string | null
  created_at: string
  files_count?: number
  color?: string | null
}

interface StudentFolder {
  id: string
  name: string
  description: string | null
  created_at: string
  files_count?: number
  student_id?: string | null
  sport_folder_id?: string | null
}

interface StoredFile {
  id: string
  name: string
  original_name: string
  file_size: number
  mime_type: string
  created_at: string
  folder_id?: string
  student_folder_id?: string
  file_path?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
  updated_at?: string
  users?: {
    full_name: string
    email: string
  }
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'my-files' | 'sport-folders'>('sport-folders')
  const [studentFolders, setStudentFolders] = useState<StudentFolder[]>([])
  const [sportFolders, setSportFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<StoredFile[]>([])
  const [personalFiles, setPersonalFiles] = useState<StoredFile[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showUploadFile, setShowUploadFile] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [newFolder, setNewFolder] = useState({ name: '', description: '' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { user, signOut } = useAuth()
  const [selectedSportFolder, setSelectedSportFolder] = useState<Folder | null>(null)
  const [sportSubfolders, setSportSubfolders] = useState<StudentFolder[]>([])
  const [showCreateSubfolder, setShowCreateSubfolder] = useState(false)
  const [newSubfolder, setNewSubfolder] = useState({ name: '' })
  const [userSubfolder, setUserSubfolder] = useState<StudentFolder | null>(null)
  const [editingSubfolderId, setEditingSubfolderId] = useState<string | null>(null)
  const [editingSubfolderName, setEditingSubfolderName] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showAnnouncements, setShowAnnouncements] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    sport: '',
    course: '',
    year_level: '',
    phone: '',
    student_id: ''
  })
  const [isVerified, setIsVerified] = useState(false)

  // Folder color functions (matching admin dashboard)
  const folderColorPalette = ['#FCD34D', '#F97316', '#FB7185', '#A855F7', '#38BDF8', '#34D399', '#F472B6', '#FBBF24']
  
  const deriveColorFromString = (value: string) => {
    const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return folderColorPalette[hash % folderColorPalette.length]
  }

  const getFolderColorValue = (folder: Folder | null) => {
    if (!folder) return folderColorPalette[0]
    return folder.color ?? deriveColorFromString(folder.id)
  }

  useEffect(() => {
    fetchData()
    fetchProfilePicture()
    fetchProfileData()
    fetchAnnouncements()
    fetchUserSubfolder()
  }, [user])

  const fetchUserSubfolder = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('student_folders')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle()
      
      if (error) throw error
      setUserSubfolder(data || null)
    } catch (error) {
      console.error('Error fetching user subfolder:', error)
    }
  }

  const fetchProfileData = async () => {
    try {
      if (!user?.id) return
      const { data } = await supabase
        .from('users')
        .select('full_name, sport, course, year_level, phone, student_id, is_verified, id_picture_url')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfileData({
          full_name: data.full_name || '',
          sport: data.sport || '',
          course: data.course || '',
          year_level: data.year_level || '',
          phone: data.phone || '',
          student_id: data.student_id || ''
        })
        setIsVerified(Boolean(data.is_verified))
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
    }
  }

  const fetchAnnouncements = async () => {
    try {
      console.log('Fetching announcements...')
      
      // First, try to fetch announcements without the join
      const { data: announcementsData, error: announcementsError } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (announcementsError) {
        console.error('Error fetching announcements:', announcementsError)
        toast.error('Failed to fetch announcements')
        return
      }

      console.log('Announcements fetched:', announcementsData)

      // If we have announcements, try to get user info for each
      if (announcementsData && announcementsData.length > 0) {
        const userIds = Array.from(new Set(announcementsData.map(a => a.created_by)))
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds)

        if (usersError) {
          console.error('Error fetching users:', usersError)
        }

        // Combine announcements with user data
        const announcementsWithUsers = announcementsData.map(announcement => ({
          ...announcement,
          users: usersData?.find(user => user.id === announcement.created_by) || null
        }))

        setAnnouncements(announcementsWithUsers)
      } else {
        setAnnouncements([])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast.error('Failed to fetch announcements')
    }
  }

  const fetchData = async () => {
    try {
      // Fetch student's personal folders only
      const { data: studentFoldersData } = await supabase
        .from('student_folders')
        .select('*')
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false })

      // Fetch only files uploaded by this student to their personal folders
      const { data: filesData } = await supabase
        .from('files')
        .select('*')
        .eq('uploaded_by', user?.id)
        .not('student_folder_id', 'is', null)
        .order('created_at', { ascending: false })

      // Fetch public sport folders
      const { data: publicFolders } = await supabase
        .from('folders')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      setStudentFolders(studentFoldersData || [])
      setPersonalFiles((filesData as unknown as StoredFile[]) || [])
      setFiles((filesData as unknown as StoredFile[]) || [])
      setSportFolders(publicFolders || [])
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfilePicture = async () => {
    try {
      if (!user?.id) return
      const { data } = await supabase
        .from('users')
        .select('profile_picture_url')
        .eq('id', user.id)
        .single()
      setProfilePictureUrl((data as any)?.profile_picture_url || null)
    } catch (_) {}
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    try {
      setAvatarUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('profile-pictures').getPublicUrl(filePath)
      await supabase.from('users').update({ profile_picture_url: data.publicUrl }).eq('id', user.id)
      setProfilePictureUrl(data.publicUrl)
      setShowProfileMenu(false)
      toast.success('Profile image updated')
    } catch (err) {
      toast.error('Failed to update avatar')
    } finally {
      setAvatarUploading(false)
    }
  }

  const fetchSportSubfolders = async (sportFolderId: string) => {
    try {
      // Fetch all subfolders in this sport folder (not just user's)
      const { data, error } = await supabase
        .from('student_folders')
        .select('*')
        .eq('sport_folder_id', sportFolderId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setSportSubfolders(data || [])
      // Fetch files for these subfolders
      if (data && data.length > 0) {
        const subfolderIds = data.map((f) => f.id)
        const { data: subFiles, error: filesErr } = await supabase
        .from('files')
          .select('*')
          .in('student_folder_id', subfolderIds)
        .order('created_at', { ascending: false })
        if (!filesErr) {
          setFiles([...(personalFiles || []), ...((subFiles as unknown as StoredFile[]) || [])])
        }
      } else {
        setFiles([...(personalFiles || [])])
      }
    } catch (e) {
      toast.error('Failed to fetch subfolders')
    }
  }

  const handleOpenSportFolder = async (folder: Folder) => {
    setSelectedSportFolder(folder)
    setSelectedFolder(null)
    setShowCreateSubfolder(false)
    setShowUploadFile(false)
    await fetchSportSubfolders(folder.id)
  }

  const goBackToSportFolders = () => {
    setSelectedSportFolder(null)
    setSportSubfolders([])
    setSelectedFolder(null)
    setShowCreateSubfolder(false)
    setShowUploadFile(false)
    setFiles([...(personalFiles || [])])
  }

  const createSubfolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedSportFolder) return
    
    // Check if user is verified
    if (!isVerified) {
      toast.error('You must be verified to create a subfolder')
      return
    }
    
    try {
      // Check if user already has ANY subfolder (across all sport folders)
      if (userSubfolder) {
        toast.error('You can only have one subfolder. Please delete your existing subfolder first.')
        return
      }
      
      const { error } = await supabase
        .from('student_folders')
        .insert({
          name: newSubfolder.name,
          student_id: user.id,
          sport_folder_id: selectedSportFolder.id,
        })
      if (error) throw error
      toast.success('Subfolder created!')
      setNewSubfolder({ name: '' })
      setShowCreateSubfolder(false)
      await fetchUserSubfolder() // Refresh user subfolder
      await fetchSportSubfolders(selectedSportFolder.id)
    } catch (err) {
      console.error('Error creating subfolder:', err)
      toast.error('Failed to create subfolder')
    }
  }

  const deleteSubfolder = async (subfolderId: string) => {
    if (!confirm('Are you sure you want to delete this subfolder? All files in it will also be deleted.')) return

    try {
      // First delete all files in the subfolder
      const { error: filesError } = await supabase
        .from('files')
        .delete()
        .eq('student_folder_id', subfolderId)

      if (filesError) throw filesError

      // Then delete the subfolder
      const { error } = await supabase
        .from('student_folders')
        .delete()
        .eq('id', subfolderId)

      if (error) throw error

      toast.success('Subfolder deleted successfully!')
      if (selectedFolder === subfolderId) {
        setSelectedFolder(null)
        setShowUploadFile(false)
      }
      await fetchUserSubfolder() // Refresh user subfolder
      if (selectedSportFolder) {
        await fetchSportSubfolders(selectedSportFolder.id)
      }
    } catch (error) {
      console.error('Error deleting subfolder:', error)
      toast.error('Failed to delete subfolder')
    }
  }

  const startEditingSubfolder = (subfolder: StudentFolder) => {
    if (subfolder.student_id !== user?.id) return
    setEditingSubfolderId(subfolder.id)
    setEditingSubfolderName(subfolder.name)
  }

  const cancelEditingSubfolder = () => {
    setEditingSubfolderId(null)
    setEditingSubfolderName('')
  }

  const updateSubfolder = async (subfolderId: string) => {
    if (!editingSubfolderName.trim()) {
      toast.error('Subfolder name cannot be empty')
      return
    }

    try {
      const { error } = await supabase
        .from('student_folders')
        .update({ name: editingSubfolderName.trim() })
        .eq('id', subfolderId)

      if (error) throw error

      toast.success('Subfolder updated successfully!')
      setEditingSubfolderId(null)
      setEditingSubfolderName('')
      await fetchUserSubfolder() // Refresh user subfolder
      if (selectedSportFolder) {
        await fetchSportSubfolders(selectedSportFolder.id)
      }
    } catch (error) {
      console.error('Error updating subfolder:', error)
      toast.error('Failed to update subfolder')
    }
  }

  const uploadFileToSubfolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !user) {
      toast.error('Please select a file to upload')
      return
    }
    
    // Check if user is verified
    if (!isVerified) {
      toast.error('You must be verified to upload files')
      return
    }
    
    if (!selectedFolder) {
      toast.error('Please select a subfolder to upload to')
      return
    }
    
    try {
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('athlete-files')
        .upload(filePath, uploadFile)
      if (uploadError) throw uploadError
      const { error: insertError } = await supabase
        .from('files')
        .insert({
          name: fileName,
          original_name: uploadFile.name,
          file_path: filePath,
          file_size: uploadFile.size,
          mime_type: uploadFile.type,
          student_folder_id: selectedFolder,
          uploaded_by: user.id,
        })
      if (insertError) throw insertError
      toast.success('File uploaded successfully!')
      const uploadedToFolder = selectedFolder // Save before clearing
      setUploadFile(null)
      setShowUploadFile(false)
      // Refresh data to show the new file
      await fetchData()
      if (selectedSportFolder) {
        await fetchSportSubfolders(selectedSportFolder.id)
        // Refresh files for the selected folder view if it was set
        if (uploadedToFolder) {
          const { data: folderFiles } = await supabase
            .from('files')
            .select('*')
            .eq('student_folder_id', uploadedToFolder)
            .order('created_at', { ascending: false })
          setFiles((folderFiles as unknown as StoredFile[]) || [])
        }
      }
      setSelectedFolder(null)
    } catch (err) {
      console.error('Upload error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      toast.error(`Failed to upload file: ${errorMessage}`)
    }
  }

  const createPersonalFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { error } = await supabase
        .from('student_folders')
        .insert({
          name: newFolder.name,
          description: newFolder.description,
          student_id: user.id,
        })

      if (error) throw error

      toast.success('Personal folder created successfully!')
      setNewFolder({ name: '', description: '' })
      setShowCreateFolder(false)
      fetchData()
    } catch (error) {
      toast.error('Failed to create folder')
    }
  }

  const uploadFileToFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !user) {
      toast.error('Please select a file to upload')
      return
    }

    if (!selectedFolder) {
      toast.error('Please select a folder to upload to')
      return
    }

    try {
      const fileExt = uploadFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('athlete-files')
        .upload(filePath, uploadFile)

      if (uploadError) throw uploadError

      // Insert file record - only to student's personal folders
      const { error: insertError } = await supabase
        .from('files')
        .insert({
          name: fileName,
          original_name: uploadFile.name,
          file_path: filePath,
          file_size: uploadFile.size,
          mime_type: uploadFile.type,
          student_folder_id: selectedFolder, // Only personal folders
          uploaded_by: user.id,
        })

      if (insertError) throw insertError

      toast.success('File uploaded successfully!')
      setUploadFile(null)
      setShowUploadFile(false)
      setSelectedFolder(null)
      fetchData()
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to upload file: ${errorMessage}`)
    }
  }

  const deletePersonalFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder?')) return

    try {
      const { error } = await supabase
        .from('student_folders')
        .delete()
        .eq('id', folderId)

      if (error) throw error

      toast.success('Folder deleted successfully!')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete folder')
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      toast.success('File deleted successfully!')
      fetchData()
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  const downloadFile = async (file: StoredFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('athlete-files')
        .download(file.name)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.original_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to download file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          sport: profileData.sport,
          course: profileData.course,
          year_level: profileData.year_level,
          phone: profileData.phone,
          student_id: profileData.student_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profile updated successfully!')
      setIsEditingProfile(false)
      fetchProfileData()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    return '📁'
  }

  const filteredFiles = files.filter(file => {
    if (searchTerm) {
      return file.original_name.toLowerCase().includes(searchTerm.toLowerCase())
    }
    // When a sport folder is open and a subfolder is selected, show only those files
    if (selectedSportFolder && selectedFolder) {
      return file.student_folder_id === selectedFolder
    }
    // Otherwise, show personal files (already limited in fetchData)
    return true
  })

  const tabs = [
    { id: 'sport-folders', label: 'Sport Folders', icon: Folder },
    { id: 'my-files', label: 'My Files', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="relative z-[1000] bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border-b border-white/30 dark:border-gray-700/30 p-4 sm:p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-white">My Files Dashboard</h1>
            <p className="text-sm sm:text-base text-blue-600 dark:text-blue-300">Manage your personal files and folders</p>
          </div>
          <div className="relative z-[9999] flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="text-sm sm:text-base text-blue-600 dark:text-blue-300">Welcome, {user?.user_metadata?.full_name}</span>
            <span
              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                isVerified
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
              }`}
            >
              {isVerified ? 'Verified Athlete' : 'Pending Verification'}
            </span>
            <button
              onClick={() => setShowProfileMenu((s) => !s)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
            >
              {profilePictureUrl ? (
                <Image src={profilePictureUrl} alt="Profile" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
              ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              )}
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-56 bg-white text-secondary-900 rounded-lg shadow-xl border border-secondary-200 overflow-hidden z-[10000]">
                <div className="px-4 py-3 border-b border-secondary-200">
                  {profilePictureUrl ? (
                    <Image src={profilePictureUrl} alt="Profile" width={56} height={56} className="w-14 h-14 rounded-full object-cover mx-auto mb-2" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-secondary-100 flex items-center justify-center mx-auto text-secondary-700 font-bold mb-2">
                      {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <p className="font-semibold text-center">{user?.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs text-secondary-600 text-center">{user?.email}</p>
                </div>
                <button onClick={() => { setShowProfile(true); setShowProfileMenu(false) }} className="w-full text-left px-4 py-3 text-sm hover:bg-secondary-50 border-b border-secondary-100">Profile</button>
                <button onClick={() => { setShowAnnouncements(true); setShowProfileMenu(false) }} className="w-full text-left px-4 py-3 text-sm hover:bg-secondary-50 border-b border-secondary-100">Announcements</button>
                <button onClick={signOut} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50">Log Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* My Sport Section - Pinned to Top */}
        {profileData.sport && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-4 z-50 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Pin className="w-4 h-4 text-white/80" />
                    <span className="text-xs sm:text-sm text-white/80 font-medium uppercase tracking-wider">My Sport</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">{profileData.sport}</h2>
                  {profileData.course && (
                    <p className="text-sm sm:text-base text-white/90 mt-1">{profileData.course}</p>
                  )}
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <span className="text-white/90 text-sm font-medium">Year Level:</span>
                <span className="text-white font-bold">{profileData.year_level || 'N/A'}</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div
          className={`mb-6 rounded-xl sm:rounded-2xl border px-4 sm:px-6 py-3 sm:py-4 shadow-lg ${
            isVerified
              ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700'
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                {isVerified ? 'Your athlete profile is verified.' : 'Your profile is awaiting verification.'}
              </p>
              <p className="text-sm text-secondary-600 dark:text-secondary-300 mt-1">
                {isVerified
                  ? 'You have full access to all features.'
                  : 'Please ensure your SSU ID details are correct. An administrator will review your ID soon.'}
              </p>
            </div>
            {!isVerified && (
              <span className="text-xs uppercase tracking-wide font-semibold text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full bg-yellow-100 dark:bg-yellow-800">
                Verification in progress
              </span>
            )}
          </div>
        </div>
        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/30 dark:border-gray-700/30">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20 p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
          <>
            {/* Removed My Folders Tab */}

            {/* My Files Tab */}
            {activeTab === 'my-files' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">
                      {selectedSportFolder && selectedFolder 
                        ? `Files in ${sportSubfolders.find(f => f.id === selectedFolder)?.name || 'Subfolder'}`
                        : 'My Personal Files'}
                    </h2>
                    {selectedSportFolder && selectedFolder && (
                      <p className="text-secondary-600 text-sm mt-1">From {selectedSportFolder.name}</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10 w-full sm:w-64"
                      />
                    </div>
                    <button onClick={() => setShowUploadFile(true)} className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto">
                      <Upload className="w-4 h-4" />
                      <span>Upload File</span>
                    </button>
                  </div>
                </div>

                {showUploadFile && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card mb-6"
                  >
                    <h3 className="text-lg font-semibold mb-4">Upload File</h3>
                    <form onSubmit={selectedSportFolder ? uploadFileToSubfolder : uploadFileToFolder} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Select File
                        </label>
                        <input
                          type="file"
                          onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          className="input-field"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          {selectedSportFolder ? 'Select Subfolder' : 'Upload to Personal Folder'}
                        </label>
                        <select
                          value={selectedFolder || ''}
                          onChange={(e) => setSelectedFolder(e.target.value || null)}
                          className="input-field"
                          required
                        >
                          <option value="">Select a folder</option>
                          {(selectedSportFolder ? sportSubfolders : studentFolders).map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex space-x-3">
                        <button type="submit" className="btn-primary">
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUploadFile(false)}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                <div className="card">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-secondary-200">
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700">Name</th>
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700">Size</th>
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700">Type</th>
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700">Uploaded</th>
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFiles.map((file) => (
                          <tr key={file.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{getFileIcon(file.mime_type)}</span>
                                <span className="font-medium">{file.original_name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-secondary-600">{formatFileSize(file.file_size)}</td>
                            <td className="py-3 px-4 text-secondary-600">{file.mime_type}</td>
                            <td className="py-3 px-4 text-secondary-600">
                              {new Date(file.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => downloadFile(file)}
                                  className="text-primary-600 hover:text-primary-700 p-1"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                  <button
                                    onClick={() => deleteFile(file.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sport Folders Tab */}
            {activeTab === 'sport-folders' && (
              <div>
                {!selectedSportFolder ? (
                  <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-secondary-900">Sport Folders</h2>
                      <p className="text-secondary-600">Browse sport-related public folders</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {sportFolders.map((folder) => {
                    const baseColor = getFolderColorValue(folder)
                    return (
                      <motion.div
                        key={folder.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleOpenSportFolder(folder)}
                        className="relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg hover:shadow-xl flex flex-col"
                      >
                        {/* Square Folder Image Container - Fixed 200x200 */}
                        <div 
                          className="relative w-[200px] h-[200px] overflow-hidden flex-shrink-0 mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900/40 dark:via-slate-900/10 dark:to-slate-900/30"
                        >
                          {/* Color Accent - centered inside the folder image */}
                          <div 
                            className="absolute top-[55%] left-[44.5%] w-28 h-20 shadow-lg border border-white/50 dark:border-white/10 -translate-x-1/2 -translate-y-1/2"
                            style={{ 
                              backgroundColor: baseColor,
                            }}
                          />
                          
                          {/* Folder Image - Front Layer */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-10"
                            style={{ 
                              backgroundImage: "url('/folder.png')",
                            }}
                          />
                        </div>
                                
                        {/* Folder Info Below */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 dark:text-white text-base mb-1 truncate">
                                {folder.name}
                              </h3>
                              {folder.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                  {folder.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{new Date(folder.created_at).toLocaleDateString()}</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Public Folder</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                {sportFolders.length === 0 && (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-secondary-600 mb-2">No Sport Folders</h3>
                        <p className="text-secondary-500">No public sport folders have been created yet.</p>
                  </div>
                )}
                  </>
                ) : (
                  <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                        <button onClick={goBackToSportFolders} className="text-primary-600 hover:text-primary-700">Back</button>
                        <h2 className="text-xl font-semibold text-secondary-900">{selectedSportFolder.name}</h2>
                    </div>
                      {isVerified && !userSubfolder && (
                        <button onClick={() => setShowCreateSubfolder(true)} className="btn-primary flex items-center space-x-2">
                          <Plus className="w-4 h-4" />
                          <span>Create Subfolder</span>
                        </button>
                      )}
                      {!isVerified && (
                        <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                          <span>Verification required to create subfolder</span>
                        </div>
                      )}
                      {isVerified && userSubfolder && (
                        <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <span>You already have a subfolder. You can only have one subfolder across all sport folders.</span>
                        </div>
                      )}
                </div>
                {showCreateSubfolder && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card mb-4">
                        <form onSubmit={createSubfolder} className="flex items-end space-x-3">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-secondary-700 mb-2">Subfolder Name</label>
                            <input type="text" value={newSubfolder.name} onChange={(e) => setNewSubfolder({ name: e.target.value })} className="input-field" placeholder="Enter subfolder name" required />
                      </div>
                          <button type="submit" className="btn-primary">Create</button>
                          <button type="button" onClick={() => setShowCreateSubfolder(false)} className="btn-secondary">Cancel</button>
                    </form>
                  </motion.div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sportSubfolders.map((f) => (
                        <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card hover:shadow-xl">
                          <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Folder className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {editingSubfolderId === f.id && f.student_id === user?.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingSubfolderName}
                                  onChange={(e) => setEditingSubfolderName(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateSubfolder(f.id)
                                    } else if (e.key === 'Escape') {
                                      cancelEditingSubfolder()
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => updateSubfolder(f.id)}
                                  className="p-1 text-green-600 hover:text-green-700"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEditingSubfolder}
                                  className="p-1 text-red-600 hover:text-red-700"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <h4 className="font-semibold text-secondary-900 truncate">{f.name}</h4>
                                <p className="text-xs text-secondary-500">{new Date(f.created_at).toLocaleDateString()}</p>
                              </>
                            )}
                          </div>
                          {f.student_id === user?.id && editingSubfolderId !== f.id && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditingSubfolder(f)
                                }}
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                title="Edit subfolder"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteSubfolder(f.id)
                                }}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Delete subfolder"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-secondary-500 pt-2 border-t border-secondary-200">
                            <button onClick={() => setSelectedFolder(f.id)} className="text-primary-600 hover:text-primary-700 flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>View Files</span>
                            </button>
                            {isVerified && f.student_id === user?.id && (
                              <button 
                                type="button"
                                onClick={(e) => { 
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedFolder(f.id); 
                                  setShowUploadFile(true);
                                }} 
                                className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Upload</span>
                              </button>
                            )}
                            {!isVerified && f.student_id === user?.id && (
                              <span className="text-xs text-amber-600 dark:text-amber-400">Verification required</span>
                            )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                {sportSubfolders.length === 0 && (
                      <div className="text-center py-8">
                        <Folder className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                        <p className="text-secondary-600">No subfolders yet. Create your first one.</p>
                  </div>
                )}

                    {/* Upload Form (in Sport Folders tab) */}
                    {showUploadFile && selectedFolder && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card mt-6"
                      >
                        <h3 className="text-lg font-semibold mb-4">Upload File</h3>
                        <form onSubmit={uploadFileToSubfolder} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Select File
                            </label>
                            <input
                              type="file"
                              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                              className="input-field"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Uploading to: {sportSubfolders.find(sf => sf.id === selectedFolder)?.name || 'Subfolder'}
                            </label>
                            <p className="text-sm text-secondary-500">File will be uploaded to the selected subfolder</p>
                          </div>
                          <div className="flex space-x-3">
                            <button type="submit" className="btn-primary">
                              Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowUploadFile(false)
                                setUploadFile(null)
                              }}
                              className="btn-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {/* Selected Subfolder Files Table (inline in Sport Folders tab) */}
                    {selectedFolder && (
                      <div className="card mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-secondary-900">
                            Files in {sportSubfolders.find(sf => sf.id === selectedFolder)?.name || 'Subfolder'}
                          </h4>
                          <div className="flex items-center gap-3">
                            {isVerified && sportSubfolders.find(sf => sf.id === selectedFolder)?.student_id === user?.id && (
                              <button 
                                onClick={() => setShowUploadFile(true)} 
                                className="btn-primary flex items-center space-x-2 text-sm"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Upload File</span>
                              </button>
                            )}
                            <button onClick={() => {
                              setSelectedFolder(null)
                              setShowUploadFile(false)
                            }} className="text-primary-600 hover:text-primary-700 text-sm">Clear</button>
                          </div>
                      </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-secondary-200">
                                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Name</th>
                                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Size</th>
                                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Type</th>
                                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Uploaded</th>
                                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredFiles
                                .filter(f => f.student_folder_id === selectedFolder)
                                .map((file) => (
                                  <tr key={file.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                                    <td className="py-3 px-4">
                                      <div className="flex items-center space-x-3">
                                        <span className="text-lg">{getFileIcon(file.mime_type)}</span>
                                        <span className="font-medium">{file.original_name}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-secondary-600">{formatFileSize(file.file_size)}</td>
                                    <td className="py-3 px-4 text-secondary-600">{file.mime_type}</td>
                                    <td className="py-3 px-4 text-secondary-600">{new Date(file.created_at).toLocaleDateString()}</td>
                                    <td className="py-3 px-4">
                                      <div className="flex space-x-2">
                                        <button onClick={() => downloadFile(file)} className="text-primary-600 hover:text-primary-700 p-1">
                                          <Download className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              {filteredFiles.filter(f => f.student_folder_id === selectedFolder).length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-6 px-4 text-center text-secondary-600">No files in this subfolder yet.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                      </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Sport Folder Detail: Subfolders */}
            {selectedSportFolder && activeTab === 'my-files' && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-secondary-900">{selectedSportFolder.name} Subfolders</h3>
                      {isVerified && !userSubfolder && (
                        <button onClick={() => setShowCreateSubfolder(true)} className="btn-primary flex items-center space-x-2">
                          <Plus className="w-4 h-4" />
                          <span>Create Subfolder</span>
                        </button>
                      )}
                      {!isVerified && (
                        <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                          <span>Verification required to create subfolder</span>
                        </div>
                      )}
                      {isVerified && userSubfolder && (
                        <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <span>You already have a subfolder. You can only have one subfolder across all sport folders.</span>
                        </div>
                      )}
                      </div>
                {showCreateSubfolder && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card mb-4">
                    <form onSubmit={createSubfolder} className="flex items-end space-x-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Subfolder Name</label>
                        <input type="text" value={newSubfolder.name} onChange={(e) => setNewSubfolder({ name: e.target.value })} className="input-field" placeholder="Enter subfolder name" required />
                      </div>
                      <button type="submit" className="btn-primary">Create</button>
                      <button type="button" onClick={() => setShowCreateSubfolder(false)} className="btn-secondary">Cancel</button>
                    </form>
                  </motion.div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sportSubfolders.map((f) => (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card hover:shadow-xl">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Folder className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {editingSubfolderId === f.id && f.student_id === user?.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingSubfolderName}
                                  onChange={(e) => setEditingSubfolderName(e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      updateSubfolder(f.id)
                                    } else if (e.key === 'Escape') {
                                      cancelEditingSubfolder()
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => updateSubfolder(f.id)}
                                  className="p-1 text-green-600 hover:text-green-700"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEditingSubfolder}
                                  className="p-1 text-red-600 hover:text-red-700"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <h4 className="font-semibold text-secondary-900 truncate">{f.name}</h4>
                                <p className="text-xs text-secondary-500">{new Date(f.created_at).toLocaleDateString()}</p>
                              </>
                            )}
                          </div>
                          {f.student_id === user?.id && editingSubfolderId !== f.id && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditingSubfolder(f)
                                }}
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                title="Edit subfolder"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteSubfolder(f.id)
                                }}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Delete subfolder"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-secondary-500 pt-2 border-t border-secondary-200">
                        <button onClick={() => setSelectedFolder(f.id)} className="text-primary-600 hover:text-primary-700 flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>View Files</span>
                        </button>
                        {isVerified && f.student_id === user?.id && (
                              <button 
                                type="button"
                                onClick={(e) => { 
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedFolder(f.id); 
                                  setShowUploadFile(true);
                                }} 
                                className="text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                              >
                                <Upload className="w-4 h-4" />
                                <span>Upload</span>
                              </button>
                            )}
                            {!isVerified && f.student_id === user?.id && (
                              <span className="text-xs text-amber-600 dark:text-amber-400">Verification required</span>
                            )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                {sportSubfolders.length === 0 && (
                  <div className="text-center py-8">
                    <Folder className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                    <p className="text-secondary-600">No subfolders yet. Create your first one.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => { setShowProfile(false); setIsEditingProfile(false) }}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full border border-secondary-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900">Profile</h3>
              <div className="flex items-center space-x-2">
                {!isEditingProfile && (
                  <button 
                    onClick={() => setIsEditingProfile(true)} 
                    className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Edit
                  </button>
                )}
                <button onClick={() => { setShowProfile(false); setIsEditingProfile(false) }} className="text-secondary-600 hover:text-secondary-800">✕</button>
              </div>
            </div>

            {!isEditingProfile ? (
              // View Mode
              <div>
                <div className="flex items-center space-x-4 mb-6">
                  {profilePictureUrl ? (
                    <Image src={profilePictureUrl} alt="Profile" width={56} height={56} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-bold">
                      {profileData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-secondary-900">{profileData.full_name || 'User'}</p>
                    <p className="text-sm text-secondary-600">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-secondary-500">Student ID</p>
                    <p className="text-secondary-900">{profileData.student_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500">Sport</p>
                    <p className="text-secondary-900">{profileData.sport || '—'}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500">Course</p>
                    <p className="text-secondary-900">{profileData.course || '—'}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500">Year Level</p>
                    <p className="text-secondary-900">{profileData.year_level || '—'}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500">Phone</p>
                    <p className="text-secondary-900">{profileData.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-secondary-500">Role</p>
                    <p className="text-secondary-900">Athlete</p>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                  {profilePictureUrl ? (
                    <Image src={profilePictureUrl} alt="Profile" width={56} height={56} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-bold">
                      {profileData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-secondary-900">Profile Picture</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="mt-1 text-sm text-secondary-600 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      value={profileData.student_id}
                      onChange={(e) => setProfileData({...profileData, student_id: e.target.value})}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Sport</label>
                    <input
                      type="text"
                      value={profileData.sport}
                      onChange={(e) => setProfileData({...profileData, sport: e.target.value})}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Course</label>
                    <input
                      type="text"
                      value={profileData.course}
                      onChange={(e) => setProfileData({...profileData, course: e.target.value})}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Year Level</label>
                    <select
                      value={profileData.year_level}
                      onChange={(e) => setProfileData({...profileData, year_level: e.target.value})}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select Year Level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 text-sm text-secondary-600 hover:text-secondary-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Announcements Modal */}
      {showAnnouncements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowAnnouncements(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-secondary-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-secondary-900">Announcements</h3>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={fetchAnnouncements}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Refresh
                </button>
                <button onClick={() => setShowAnnouncements(false)} className="text-secondary-600 hover:text-secondary-800">✕</button>
              </div>
            </div>
            
            {announcements.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📢</span>
                </div>
                <h4 className="text-lg font-semibold text-secondary-600 mb-2">No Announcements</h4>
                <p className="text-secondary-500 mb-4">Check back later for updates from your coaches and administrators.</p>
                <button 
                  onClick={fetchAnnouncements}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Check for Updates
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <motion.div
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          {announcement.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-blue-600 dark:text-blue-400">
                          <span>By {announcement.users?.full_name || 'Admin'}</span>
                          <span>•</span>
                          <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-blue-800 dark:text-blue-200 leading-relaxed">
                      {announcement.content.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-2 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    
                    {announcement.updated_at && announcement.updated_at !== announcement.created_at && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                        <p className="text-xs text-blue-500 dark:text-blue-400">
                          Updated {new Date(announcement.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
