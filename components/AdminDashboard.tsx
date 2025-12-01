'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity,
  BarChart3,
  Bell,
  Calendar,
  Download, 
  FileSpreadsheet,
  Folder,
  Layers,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2, 
  Users, 
  X,
  ChevronDown,
  FileText,
  Check,
  Pencil,
} from 'lucide-react'
import { BarChart, PieChart, LineChart, Bar, Pie, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface FolderRecord {
  id: string
  name: string
  description: string | null
  created_at: string
  created_by?: string | null
  color?: string | null
}

interface StudentFolderRecord {
  id: string
  name: string
  description: string | null
  student_id: string | null
  sport_folder_id: string | null
  created_at: string
  users?: {
    id: string
    full_name: string
    profile_picture_url?: string | null
    sport?: string | null
  } | null
}

interface FolderUserSummary {
  id: string
  full_name: string
  profile_picture_url?: string | null
  sport?: string | null
}

interface FileRecord {
  id: string
  original_name: string
  mime_type: string
  file_size: number
  created_at: string
  student_folder_id?: string | null
  folder_id?: string | null
  uploaded_by?: string | null
  file_path?: string | null
  name?: string | null
}

interface UserRecord {
  id: string
  email: string
  full_name: string
  role: string
  student_id?: string | null
  sport?: string | null
  course?: string | null
  is_verified?: boolean | null
  profile_picture_url?: string | null
  id_picture_url?: string | null
  created_at: string
}

interface AnnouncementRecord {
  id: string
  title: string
  content: string
  created_at: string
}

const folderColorPalette = ['#FCD34D', '#F97316', '#FB7185', '#A855F7', '#38BDF8', '#34D399', '#F472B6', '#FBBF24']

const clampColorValue = (value: number) => Math.max(0, Math.min(255, value))

const adjustHexColor = (hex: string, amount: number) => {
  let sanitized = hex.trim().replace('#', '')
  if (![3, 6].includes(sanitized.length)) return hex
  if (sanitized.length === 3) {
    sanitized = sanitized
      .split('')
      .map((char) => char + char)
      .join('')
  }
  const numeric = Number.parseInt(sanitized, 16)
  if (Number.isNaN(numeric)) return hex
  const r = clampColorValue((numeric >> 16) + amount)
  const g = clampColorValue(((numeric >> 8) & 0xff) + amount)
  const b = clampColorValue((numeric & 0xff) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

const deriveColorFromString = (value: string) => {
  const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return folderColorPalette[hash % folderColorPalette.length]
}

const isMissingColorColumnError = (error: { code?: string | null; message?: string | null; details?: string | null } | null) => {
  if (!error) return false
  if (error.code === '42703') return true
  const text = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()
  return text.includes('column') && text.includes('color')
}

const tabs = [
  { id: 'folders', label: 'Folders', icon: Folder },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
] as const

type TabId = (typeof tabs)[number]['id']

export default function AdminDashboard() {
  const { user, signOut } = useAuth()

  const [activeTab, setActiveTab] = useState<TabId>('folders')
  const [loading, setLoading] = useState(true)

  const [folders, setFolders] = useState<FolderRecord[]>([])
  const [studentFolders, setStudentFolders] = useState<StudentFolderRecord[]>([])
  const [files, setFiles] = useState<FileRecord[]>([])
  const [usersData, setUsersData] = useState<UserRecord[]>([])
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])

  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolder, setNewFolder] = useState({ name: '', description: '', color: '#FCD34D' })

  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false)
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' })
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState({ title: '', content: '' })

  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [currentStudentFolderId, setCurrentStudentFolderId] = useState<string | null>(null)
  const [folderColorOverrides, setFolderColorOverrides] = useState<Record<string, string>>({})
  const [supportsFolderColors, setSupportsFolderColors] = useState(true)
  const [selectedPdfFile, setSelectedPdfFile] = useState<FileRecord | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [reportType, setReportType] = useState<string>('athletes')
  const [dateRange, setDateRange] = useState<string>('this-month')
  const [showReportTypeDropdown, setShowReportTypeDropdown] = useState(false)
  const [showDateRangeDropdown, setShowDateRangeDropdown] = useState(false)
  const [selectedSportFolderForReport, setSelectedSportFolderForReport] = useState<string>('')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')

  useEffect(() => {
    if (!user) return
    loadAllData()
  }, [user])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowReportTypeDropdown(false)
        setShowDateRangeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem('folderColors')
      if (stored) {
        setFolderColorOverrides(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to restore folder colors', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('folderColors', JSON.stringify(folderColorOverrides))
    } catch (error) {
      console.error('Failed to persist folder colors', error)
    }
  }, [folderColorOverrides])

  const loadAllData = async () => {
      setLoading(true)
    try {
      const [foldersRes, studentFoldersRes, filesRes, usersRes, announcementsRes] = await Promise.all([
        supabase.from('folders').select('*').order('created_at', { ascending: false }),
        supabase
          .from('student_folders')
          .select(`
          *,
            users:users!student_folders_student_id_fkey (
            id,
            full_name,
              profile_picture_url,
              sport
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('files')
          .select('id, original_name, file_size, mime_type, created_at, student_folder_id, folder_id, uploaded_by, file_path, name')
          .order('created_at', { ascending: false }),
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      ])

      if (foldersRes.error) throw foldersRes.error
      if (studentFoldersRes.error) throw studentFoldersRes.error
      if (filesRes.error) throw filesRes.error
      if (usersRes.error) throw usersRes.error
      if (announcementsRes.error) throw announcementsRes.error

      setFolders(foldersRes.data ?? [])
      setStudentFolders(studentFoldersRes.data ?? [])
      setFiles(filesRes.data ?? [])
      setUsersData(usersRes.data ?? [])
      setAnnouncements(announcementsRes.data ?? [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const createFolder = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newFolder.name.trim()) {
      toast.error('Folder name is required')
      return
    }

    try {
      const basePayload = {
        name: newFolder.name.trim(),
        description: newFolder.description.trim() || null,
        created_by: user?.id ?? null,
      }

      let folderData: FolderRecord | null = null
      let colorUnsupported = !supportsFolderColors

      if (!colorUnsupported) {
        const { data, error } = await supabase
          .from('folders')
          .insert({ ...basePayload, color: newFolder.color })
          .select('*')
          .single()

        if (error) {
          if (isMissingColorColumnError(error)) {
            colorUnsupported = true
            setSupportsFolderColors(false)
        } else {
            throw error
        }
      } else {
          folderData = data
        }
      }

      if (!folderData) {
        const { data, error } = await supabase.from('folders').insert(basePayload).select('*').single()
        if (error) throw error
        folderData = data
        if (colorUnsupported && data) {
          setFolderColorOverrides((prev) => ({ ...prev, [data.id]: newFolder.color }))
        }
      }

      toast.success('Folder created')
      setNewFolder((prev) => ({ ...prev, name: '', description: '' }))
      setShowCreateFolder(false)
      await loadAllData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to create folder')
    }
  }

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder?')) return
    try {
      const { error } = await supabase.from('folders').delete().eq('id', folderId)
      if (error) throw error
      toast.success('Folder deleted')
      loadAllData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete folder')
    }
  }

  const createAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    try {
      const { error } = await supabase.from('announcements').insert({
          title: newAnnouncement.title.trim(),
          content: newAnnouncement.content.trim(),
        created_by: user?.id ?? null,
      })
      if (error) throw error
      toast.success('Announcement posted')
      setNewAnnouncement({ title: '', content: '' })
      setShowCreateAnnouncement(false)
      loadAllData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to post announcement')
    }
  }

  const deleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Delete this announcement?')) return
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', announcementId)
      if (error) throw error
      toast.success('Announcement deleted')
      loadAllData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete announcement')
    }
  }

  const startEditingAnnouncement = (announcement: AnnouncementRecord) => {
    setEditingAnnouncementId(announcement.id)
    setEditingAnnouncement({ title: announcement.title, content: announcement.content })
  }

  const cancelEditingAnnouncement = () => {
    setEditingAnnouncementId(null)
    setEditingAnnouncement({ title: '', content: '' })
  }

  const updateAnnouncement = async (announcementId: string) => {
    if (!editingAnnouncement.title.trim() || !editingAnnouncement.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          title: editingAnnouncement.title.trim(),
          content: editingAnnouncement.content.trim(),
        })
        .eq('id', announcementId)

      if (error) throw error
      toast.success('Announcement updated')
      setEditingAnnouncementId(null)
      setEditingAnnouncement({ title: '', content: '' })
      loadAllData()
    } catch (error) {
      console.error(error)
      toast.error('Failed to update announcement')
    }
  }

  const updateVerification = async (target: UserRecord, status: boolean) => {
    setVerificationLoading(true)
    try {
      const { error } = await supabase.from('users').update({ is_verified: status }).eq('id', target.id)
      if (error) throw error
      setUsersData((prev) => prev.map((item) => (item.id === target.id ? { ...item, is_verified: status } : item)))
      setSelectedUser((prev) => (prev ? { ...prev, is_verified: status } : prev))
      toast.success(status ? 'Athlete verified' : 'Marked as pending')
    } catch (error) {
      console.error(error)
      toast.error('Failed to update verification status')
    } finally {
      setVerificationLoading(false)
    }
  }

  const students = useMemo(() => usersData.filter((item) => item.role?.toLowerCase() === 'student'), [usersData])
  const verifiedStudents = students.filter((item) => item.is_verified)
  const latestAnnouncement = announcements.at(0)

  // Chart data - must be at component level (hooks rule)
  const sportData = useMemo(() => {
    const sportCounts: Record<string, number> = {}
    students.forEach(student => {
      const sport = student.sport || 'Unspecified'
      sportCounts[sport] = (sportCounts[sport] || 0) + 1
    })
    return Object.entries(sportCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [students])

  const verificationData = useMemo(() => [
    { name: 'Verified', value: verifiedStudents.length, color: '#10b981' },
    { name: 'Pending', value: students.length - verifiedStudents.length, color: '#f59e0b' }
  ], [students, verifiedStudents])

  const courseData = useMemo(() => {
    const courseCounts: Record<string, number> = {}
    students.forEach(student => {
      const course = student.course || 'Unspecified'
      courseCounts[course] = (courseCounts[course] || 0) + 1
    })
    return Object.entries(courseCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [students])

  const registrationData = useMemo(() => {
    const monthCounts: Record<string, number> = {}
    students.forEach(student => {
      const date = new Date(student.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1
    })
    return Object.entries(monthCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        registrations: count
      }))
  }, [students])

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`
  }

  const getFileUrl = async (file: FileRecord): Promise<string | null> => {
    try {
      // Use file_path if available, otherwise try name or id
      const filePath = file.file_path || file.name || file.id
      
      if (!filePath) {
        console.error('No file path available')
        return null
      }
      
      // Try to get public URL first (if bucket is public)
      const { data: publicData } = supabase.storage
        .from('athlete-files')
        .getPublicUrl(filePath)
      
      // Test if the public URL is accessible
      try {
        const response = await fetch(publicData.publicUrl, { method: 'HEAD' })
        if (response.ok) {
          return publicData.publicUrl
        }
      } catch (e) {
        // Public URL not accessible, try downloading
      }
      
      // If public URL doesn't work, download the file
      const { data, error } = await supabase.storage
        .from('athlete-files')
        .download(filePath)
      
      if (error) {
        console.error('Error downloading file:', error)
        return null
      }
      
      // If download succeeds, create object URL
      if (data) {
        return URL.createObjectURL(data)
      }
      
      return null
    } catch (error) {
      console.error('Error in getFileUrl:', error)
      return null
    }
  }

  const handlePdfClick = async (file: FileRecord) => {
    if (!file.mime_type.includes('pdf')) return
    
    setSelectedPdfFile(file)
    setPdfLoading(true)
    setPdfError(null)
    setPdfUrl(null)
    
    try {
      const url = await getFileUrl(file)
      if (url) {
        setPdfUrl(url)
      } else {
        setPdfError('Failed to load PDF. Please try downloading the file instead.')
        toast.error('Failed to load PDF')
      }
    } catch (error) {
      console.error('Error loading PDF:', error)
      setPdfError('An error occurred while loading the PDF.')
      toast.error('Failed to load PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!selectedPdfFile) return
    
    try {
      // Use file_path if available, otherwise try name or id
      const filePath = selectedPdfFile.file_path || selectedPdfFile.name || selectedPdfFile.id
      
      const { data, error } = await supabase.storage
        .from('athlete-files')
        .download(filePath)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = selectedPdfFile.original_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF')
    }
  }

  const closePdfViewer = () => {
    setSelectedPdfFile(null)
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl)
    }
    setPdfUrl(null)
    setPdfLoading(false)
    setPdfError(null)
  }

  const getFolderColorValue = (folder: FolderRecord | null) => {
    if (!folder) return folderColorPalette[0]
    return folder.color ?? folderColorOverrides[folder.id] ?? deriveColorFromString(folder.id)
  }

  const getStudentForFolder = (folder: StudentFolderRecord): FolderUserSummary | undefined => {
    if (folder.users) {
      return {
        id: folder.users.id,
        full_name: folder.users.full_name,
        profile_picture_url: folder.users.profile_picture_url,
        sport: folder.users.sport,
      }
    }
    const fallback = folder.student_id ? usersData.find((u) => u.id === folder.student_id) : undefined
    if (!fallback) return undefined
    return {
      id: fallback.id,
      full_name: fallback.full_name,
      profile_picture_url: fallback.profile_picture_url,
      sport: fallback.sport,
    }
  }
  const resetFolderView = () => {
        setCurrentFolderId(null)
        setCurrentStudentFolderId(null)
  }
  const handleFolderSelect = (folderId: string) => {
    setCurrentFolderId(folderId)
          setCurrentStudentFolderId(null)
  }
  const handleStudentFolderSelect = (studentFolderId: string) => {
    setCurrentStudentFolderId(studentFolderId)
  }

  const statCards = useMemo(
    () => [
      {
        label: 'Total Users',
        value: usersData.length.toLocaleString(),
        sublabel: `${verifiedStudents.length} verified athletes`,
        icon: Users,
        accent: 'from-sky-500 via-blue-500 to-indigo-500',
      },
      {
        label: 'Folder Library',
        value: folders.length.toLocaleString(),
        sublabel: 'Shared & private spaces',
        icon: Layers,
        accent: 'from-violet-500 via-purple-500 to-pink-500',
      },
      {
        label: 'Announcements',
        value: announcements.length.toLocaleString(),
        sublabel: latestAnnouncement ? `Last: ${new Date(latestAnnouncement.created_at).toLocaleDateString()}` : 'No recent updates',
        icon: Bell,
        accent: 'from-amber-400 via-orange-500 to-rose-500',
      },
      {
        label: 'Engagement',
        value: `${students.length ? Math.round((verifiedStudents.length / students.length) * 100) : 0}%`,
        sublabel: 'Verification rate',
        icon: ShieldCheck,
        accent: 'from-emerald-400 via-green-500 to-lime-500',
      },
    ],
    [announcements.length, folders.length, latestAnnouncement, students.length, usersData.length, verifiedStudents.length]
  )

  const exportStudentsCsv = (data: UserRecord[]) => {
    if (data.length === 0) {
      toast.error('No data to export')
      return
    }

    const csv = [
      ['Full Name', 'Email', 'Student ID', 'Sport', 'Course', 'Status'].join(','),
      ...data.map((athlete) => [
        athlete.full_name,
        athlete.email,
        athlete.student_id ?? '',
        athlete.sport ?? '',
        athlete.course ?? '',
        athlete.is_verified ? 'Verified' : 'Pending',
      ].map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `athletes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    link.remove()
  }

  const renderFoldersTab = () => {
    const selectedFolder = currentFolderId ? folders.find((folder) => folder.id === currentFolderId) : null
    const selectedStudentFolder = currentStudentFolderId ? studentFolders.find((sf) => sf.id === currentStudentFolderId) : null
    const subFolders = selectedFolder ? studentFolders.filter((sf) => sf.sport_folder_id === selectedFolder.id) : []
    const studentFiles = selectedStudentFolder ? files.filter((file) => file.student_folder_id === selectedStudentFolder.id) : []

  return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
              {selectedStudentFolder
                ? `Files for ${getStudentForFolder(selectedStudentFolder)?.full_name || selectedStudentFolder.name}`
                : selectedFolder
                  ? `${selectedFolder.name} · Athlete folders`
                  : 'Folders'}
                    </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedStudentFolder
                ? 'Every document your athlete has uploaded lives here.'
                : selectedFolder
                  ? 'Choose an athlete to inspect their secure workspace.'
                  : 'Create shared spaces and drill into athlete folders.'}
            </p>
                          </div>
          <div className="flex flex-wrap gap-2">
            {(currentFolderId || currentStudentFolderId) && (
              <button onClick={selectedStudentFolder ? () => setCurrentStudentFolderId(null) : resetFolderView} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700">
                {selectedStudentFolder ? 'Back to athlete list' : 'Back to folders'}
              </button>
            )}
            <button onClick={loadAllData} className="px-4 py-2 text-sm rounded-lg bg-slate-200 dark:bg-slate-700">Refresh</button>
            <button onClick={() => setShowCreateFolder(true)} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white">
              <Plus className="inline w-4 h-4 mr-1" />
              New Folder
                  </button>
                  </div>
                </div>

                {showCreateFolder && (
          <motion.form
            onSubmit={createFolder}
            initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
            className="grid gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
                        <input
                          value={newFolder.name}
              onChange={(e) => setNewFolder((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Folder name"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
            />
                        <textarea
                          value={newFolder.description}
              onChange={(e) => setNewFolder((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
            />
                  <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Folder color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newFolder.color}
                  onChange={(e) => setNewFolder((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-10 w-14 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                />
                <input
                  type="text"
                  value={newFolder.color}
                  onChange={(e) => setNewFolder((prev) => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
                  placeholder="#FCD34D"
                                      />
                                    </div>
              {!supportsFolderColors && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Tip: color preferences are saved in your browser since the database doesn’t support folder colors yet.
                </p>
                                  )}
                                </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowCreateFolder(false)} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save</button>
                                    </div>
          </motion.form>
        )}

        {selectedStudentFolder ? (
          <div className="space-y-4">
            {studentFiles.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500">
                No files uploaded yet.
                                  </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {studentFiles.map((file) => {
                  const isPdf = file.mime_type.includes('pdf')
                            return (
                  <div 
                                key={file.id}
                    onClick={() => isPdf && handlePdfClick(file)}
                    className={`p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-sm space-y-3 ${isPdf ? 'cursor-pointer hover:shadow-md hover:border-blue-400 transition-all' : ''}`}
                  >
                                  <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{file.original_name}</p>
                        <p className="text-xs text-slate-500">{new Date(file.created_at).toLocaleDateString()}</p>
                              </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {file.mime_type.split('/')[1] || file.mime_type}
                                  </span>
                                </div>
                    <div className="text-sm text-slate-500">Size · {formatFileSize(file.file_size)}</div>
                    {isPdf && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Click to view PDF →
                                  </div>
                    )}
                                </div>
                            )
                          })}
              </div>
            )}
                  </div>
        ) : selectedFolder ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subFolders.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-500">
                No athlete folders yet.
                          </div>
                        ) : (
              subFolders.map((subFolder) => {
                const parentColor = selectedFolder ? getFolderColorValue(selectedFolder) : '#FCD34D'
                const student = getStudentForFolder(subFolder)
                const initials = student?.full_name?.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? subFolder.name.slice(0, 2)
                            return (
                  <div
                    key={subFolder.id}
                    onClick={() => handleStudentFolderSelect(subFolder.id)}
                    className="relative cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
                    style={{ perspective: '1200px' }}
                  >
                    {/* Elegant 3D Shadow */}
                    <div className="absolute inset-0 bg-black/8 rounded-lg blur-sm transform translate-y-1 opacity-50" />
                    
                    <div 
                      className="relative w-full h-36 rounded-lg overflow-hidden shadow-md transform transition-all duration-300"
                      style={{ 
                        backgroundColor: parentColor,
                        boxShadow: '0 6px 16px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.12)',
                        transform: 'perspective(1200px) rotateX(0.5deg)',
                      }}
                    >
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Professional folder tab - 3D */}
                      <div
                        className="absolute -top-2 left-4 w-28 h-6 rounded-t-md shadow-sm"
                        style={{ 
                          backgroundColor: parentColor,
                          boxShadow: '0 -2px 4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.15)',
                        }}
                      />
                      <div
                        className="absolute -top-2 left-4 w-28 h-6 rounded-t-md border border-b-0 pointer-events-none"
                        style={{ borderColor: 'rgba(255,255,255,0.2)' }}
                      />
                      
                      {/* Formal folder body content */}
                      <div className="relative p-4 h-full flex flex-col justify-between z-10">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border-2 border-white/30 bg-white/20"
                          >
                            {student?.profile_picture_url ? (
                              <img src={student.profile_picture_url} alt={student.full_name ?? 'Athlete'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-semibold text-white text-sm">{initials}</span>
                            )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm mb-1 truncate">{subFolder.name}</h3>
                            <p className="text-xs text-white/85 truncate">
                              {student?.full_name ?? 'Athlete'}
                                    </p>
                                  </div>
                                </div>
                        {subFolder.description && (
                          <p className="text-xs text-white/75 line-clamp-1 mt-2 leading-relaxed">{subFolder.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
                          <div className="flex items-center gap-1.5 text-white/70 text-[10px]">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(subFolder.created_at).toLocaleDateString()}</span>
                              </div>
                          <span className="text-[10px] text-white/55 font-medium">Personal</span>
                                </div>
                              </div>
                              
                      {/* Refined bottom edge for 3D depth */}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 rounded-b-lg" />
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {folders.length === 0 ? (
              <p className="text-sm text-slate-500">No folders yet.</p>
                        ) : (
              folders.map((folder) => {
                const baseColor = getFolderColorValue(folder)
                            return (
                  <div
                                key={folder.id}
                    onClick={() => handleFolderSelect(folder.id)}
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
                      
                      {/* Delete Button */}
                                    <button
                        onClick={(event) => {
                          event.stopPropagation()
                                        deleteFolder(folder.id)
                                      }}
                        className="absolute top-4 left-4 p-2 rounded-lg bg-white/40 hover:bg-white/60 backdrop-blur-sm text-slate-700 dark:text-white transition-all duration-200 z-20 shadow-md"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
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
                  </div>
                            )
                          })
                        )}
                  </div>
                )}
              </div>
    )
  }

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Athletes Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Verify accounts and manage athlete data</p>
        </div>
        <div className="flex gap-2">
                    <button
            onClick={loadAllData} 
            className="px-4 py-2 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                    >
            <Activity className="w-4 h-4" />
            Refresh
                    </button>
                    <button
            onClick={() => exportStudentsCsv(students)} 
            className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
            <Download className="w-4 h-4" />
            Export CSV
                    </button>
                  </div>
                </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Athletes</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{students.length}</p>
                  </div>
            <Users className="w-10 h-10 text-blue-400 dark:text-blue-500" />
                      </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Verified</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{verifiedStudents.length}</p>
                    </div>
            <ShieldCheck className="w-10 h-10 text-green-400 dark:text-green-500" />
          </div>
        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Pending</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-1">{students.length - verifiedStudents.length}</p>
                              </div>
            <Activity className="w-10 h-10 text-amber-400 dark:text-amber-500" />
                              </div>
        </motion.div>
                            </div>
                            
      {/* Athletes List */}
      {students.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No athletes registered yet</p>
                            </div>
      ) : (
        <div className="grid gap-4">
          {students.map((athlete) => (
            <motion.div
              key={athlete.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {athlete.full_name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{athlete.full_name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{athlete.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        ID: {athlete.student_id ?? 'N/A'}
                      </span>
                      {athlete.sport && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {athlete.sport}
                        </span>
                      )}
                      {athlete.course && (
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {athlete.course}
                        </span>
                      )}
                    </div>
                  </div>
                            </div>
                            
                {/* Status & Actions */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {athlete.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                                </span>
                              ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl">
                        <Activity className="w-3.5 h-3.5" />
                        Pending
                      </span>
                              )}
                            </div>
                  <div className="flex gap-2">
                              <button
                      className="px-4 py-2 text-xs font-medium rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setSelectedUser(athlete)}
                      disabled={!athlete.id_picture_url}
                    >
                      Review ID
                    </button>
                    <button
                      className="px-4 py-2 text-xs font-medium rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => updateVerification(athlete, !athlete.is_verified)}
                      disabled={verificationLoading}
                    >
                      {athlete.is_verified ? 'Unverify' : 'Verify'}
                              </button>
                  </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
  )

  const renderAnnouncementsTab = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            Announcements
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Share updates and important information with athletes</p>
        </div>
                    <button
                      onClick={() => setShowCreateAnnouncement(true)}
          className="px-5 py-2.5 text-sm rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
          <Plus className="w-4 h-4" />
          New Announcement
                    </button>
                </div>

      {/* Create Announcement Form */}
                {showCreateAnnouncement && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800"
                  >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Create New Announcement
          </h3>
                    <form onSubmit={createAnnouncement} className="space-y-4">
                      <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                        <input
                          value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter announcement title..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                      <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Content</label>
                        <textarea
                          value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your announcement content here..."
                          rows={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                          required
                        />
                      </div>
            <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowCreateAnnouncement(false)}
                className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                        >
                          Cancel
                        </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                Post Announcement
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

      {/* Announcements List */}
      <div className="space-y-4">
                  {announcements.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No announcements yet</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Create your first announcement to get started</p>
                    </div>
                  ) : (
          announcements.map((item, index) => (
                      <motion.div
              key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all hover:border-purple-300 dark:hover:border-purple-700"
            >
              {/* Decorative gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-t-2xl" />
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {editingAnnouncementId === item.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title</label>
                        <input
                          type="text"
                          value={editingAnnouncement.title}
                          onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          placeholder="Announcement title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Content</label>
                        <textarea
                          value={editingAnnouncement.content}
                          onChange={(e) => setEditingAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-[120px]"
                          placeholder="Announcement content"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateAnnouncement(item.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditingAnnouncement}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{item.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <span>•</span>
                            <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                      </div>
                      <div className="pl-13">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{item.content}</p>
                      </div>
                    </>
                  )}
                </div>
                {editingAnnouncementId !== item.id && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                      onClick={() => startEditingAnnouncement(item)} 
                      className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                      title="Edit announcement"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(item.id)} 
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            title="Delete announcement"
                          >
                      <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                )}
                          </div>
                      </motion.div>
                    ))
                  )}
                        </div>
                        </div>
  )

  const exportAnalyticsExcel = (category: 'all' | 'sport' | 'course') => {
    try {
      let dataToExport = students
      let filename = 'athletes_export'
      
      if (category === 'sport') {
        // Group by sport
        const sportGroups: Record<string, typeof students> = {}
        students.forEach(student => {
          const sport = student.sport || 'Unspecified'
          if (!sportGroups[sport]) sportGroups[sport] = []
          sportGroups[sport].push(student)
        })
        
        // Create CSV for each sport
        Object.entries(sportGroups).forEach(([sport, athletes]) => {
          const headers = ['Full Name', 'Email', 'Student ID', 'Sport', 'Course', 'Year Level', 'Status', 'Verified', 'Created Date']
          const csvContent = [
            headers.join(','),
            ...athletes.map(athlete => [
              `"${athlete.full_name || ''}"`,
              `"${athlete.email || ''}"`,
              `"${athlete.student_id || ''}"`,
              `"${athlete.sport || ''}"`,
              `"${athlete.course || ''}"`,
              `"${(athlete as any).year_level || ''}"`,
              `"${athlete.is_verified ? 'Verified' : 'Pending'}"`,
              `"${athlete.is_verified ? 'Yes' : 'No'}"`,
              `"${new Date(athlete.created_at).toLocaleDateString()}"`
            ].join(','))
          ].join('\n')
          
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = `athletes_by_sport_${sport.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
          link.click()
          link.remove()
        })
        toast.success(`Exported ${Object.keys(sportGroups).length} sport categories`)
        return
      } else if (category === 'course') {
        // Group by course
        const courseGroups: Record<string, typeof students> = {}
        students.forEach(student => {
          const course = student.course || 'Unspecified'
          if (!courseGroups[course]) courseGroups[course] = []
          courseGroups[course].push(student)
        })
        
        // Create CSV for each course
        Object.entries(courseGroups).forEach(([course, athletes]) => {
          const headers = ['Full Name', 'Email', 'Student ID', 'Sport', 'Course', 'Year Level', 'Status', 'Verified', 'Created Date']
          const csvContent = [
            headers.join(','),
            ...athletes.map(athlete => [
              `"${athlete.full_name || ''}"`,
              `"${athlete.email || ''}"`,
              `"${athlete.student_id || ''}"`,
              `"${athlete.sport || ''}"`,
              `"${athlete.course || ''}"`,
              `"${(athlete as any).year_level || ''}"`,
              `"${athlete.is_verified ? 'Verified' : 'Pending'}"`,
              `"${athlete.is_verified ? 'Yes' : 'No'}"`,
              `"${new Date(athlete.created_at).toLocaleDateString()}"`
            ].join(','))
          ].join('\n')
          
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = `athletes_by_course_${course.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
          link.click()
          link.remove()
        })
        toast.success(`Exported ${Object.keys(courseGroups).length} course categories`)
        return
      }
      
      // Export all
      const headers = ['Full Name', 'Email', 'Student ID', 'Sport', 'Course', 'Year Level', 'Status', 'Verified', 'Created Date']
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(athlete => [
          `"${athlete.full_name || ''}"`,
          `"${athlete.email || ''}"`,
          `"${athlete.student_id || ''}"`,
          `"${athlete.sport || ''}"`,
          `"${athlete.course || ''}"`,
          `"${(athlete as any).year_level || ''}"`,
          `"${athlete.is_verified ? 'Verified' : 'Pending'}"`,
          `"${athlete.is_verified ? 'Yes' : 'No'}"`,
          `"${new Date(athlete.created_at).toLocaleDateString()}"`
        ].join(','))
      ].join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `athletes_all_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      link.remove()
      toast.success(`Exported ${dataToExport.length} athletes`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  const getDateRangeFilter = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        endDate = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'this-week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        break
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        break
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        break
      case 'custom-range':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(customEndDate)
          endDate.setHours(23, 59, 59, 999)
        } else {
          return null
        }
        break
      default:
        return null
    }

    return { startDate, endDate }
  }

  const generateAndDownloadReport = () => {
    const dateFilter = getDateRangeFilter()

    try {
      let csvContent = ''
      let filename = ''

      switch (reportType) {
        case 'athletes':
          let athletesData = students
          if (dateFilter) {
            athletesData = students.filter(s => {
              const created = new Date(s.created_at)
              return created >= dateFilter.startDate && created <= dateFilter.endDate
            })
          }
          const athleteHeaders = ['Full Name', 'Email', 'Student ID', 'Sport', 'Course', 'Year Level', 'Phone', 'Status', 'Verified', 'Created Date']
          csvContent = [
            athleteHeaders.join(','),
            ...athletesData.map(athlete => [
              `"${athlete.full_name || ''}"`,
              `"${athlete.email || ''}"`,
              `"${athlete.student_id || ''}"`,
              `"${athlete.sport || ''}"`,
              `"${athlete.course || ''}"`,
              `"${(athlete as any).year_level || ''}"`,
              `"${(athlete as any).phone || ''}"`,
              `"${athlete.is_verified ? 'Verified' : 'Pending'}"`,
              `"${athlete.is_verified ? 'Yes' : 'No'}"`,
              `"${new Date(athlete.created_at).toLocaleDateString()}"`
            ].join(','))
          ].join('\n')
          filename = `athletes_report_${new Date().toISOString().split('T')[0]}.csv`
          break

        case 'files':
          let filesData = files
          if (dateFilter) {
            filesData = files.filter(f => {
              const created = new Date(f.created_at)
              return created >= dateFilter.startDate && created <= dateFilter.endDate
            })
          }
          const fileHeaders = ['Original Name', 'File Size', 'MIME Type', 'Uploaded By', 'Folder', 'Created Date']
          csvContent = [
            fileHeaders.join(','),
            ...filesData.map(file => [
              `"${file.original_name || ''}"`,
              `"${formatFileSize(file.file_size)}"`,
              `"${file.mime_type || ''}"`,
              `"${file.uploaded_by || ''}"`,
              `"${file.folder_id || file.student_folder_id || 'N/A'}"`,
              `"${new Date(file.created_at).toLocaleDateString()}"`
            ].join(','))
          ].join('\n')
          filename = `files_report_${new Date().toISOString().split('T')[0]}.csv`
          break

        case 'folders': {
          let foldersData = selectedSportFolderForReport
            ? folders.filter(f => f.id === selectedSportFolderForReport)
            : folders
          if (dateFilter) {
            foldersData = foldersData.filter(f => {
              const created = new Date(f.created_at)
              return created >= dateFilter.startDate && created <= dateFilter.endDate
            })
          }

          const folderHeaders = [
            'Folder Name',
            'Description',
            'Created By',
            'Total Subfolders',
            'Total Files',
            'Created Date',
            'Color'
          ]

          csvContent = [
            folderHeaders.join(','),
            ...foldersData.map(folder => {
              const relatedStudentFolders = studentFolders.filter(
                (sf) => sf.sport_folder_id === folder.id
              )
              const relatedStudentFolderIds = relatedStudentFolders.map(sf => sf.id)
              const totalFilesForFolder = files.filter(file => {
                if (file.folder_id === folder.id) return true
                if (file.student_folder_id && relatedStudentFolderIds.includes(file.student_folder_id)) return true
                return false
              }).length

              return [
                `"${folder.name || ''}"`,
                `"${folder.description || ''}"`,
                `"${folder.created_by || 'N/A'}"`,
                `"${relatedStudentFolders.length}"`,
                `"${totalFilesForFolder}"`,
                `"${new Date(folder.created_at).toLocaleDateString()}"`,
                `"${folder.color || 'N/A'}"`
              ].join(',')
            })
          ].join('\n')

          const folderName = selectedSportFolderForReport
            ? folders.find(f => f.id === selectedSportFolderForReport)?.name?.replace(/\s+/g, '_') || 'all'
            : 'all'
          filename = `folders_report_${folderName}_${new Date().toISOString().split('T')[0]}.csv`
          break
        }

        case 'announcements':
          let announcementsData = announcements
          if (dateFilter) {
            announcementsData = announcements.filter(a => {
              const created = new Date(a.created_at)
              return created >= dateFilter.startDate && created <= dateFilter.endDate
            })
          }
          const announcementHeaders = ['Title', 'Content', 'Created Date']
          csvContent = [
            announcementHeaders.join(','),
            ...announcementsData.map(announcement => [
              `"${announcement.title || ''}"`,
              `"${(announcement.content || '').replace(/"/g, '""')}"`,
              `"${new Date(announcement.created_at).toLocaleDateString()}"`
            ].join(','))
          ].join('\n')
          filename = `announcements_report_${new Date().toISOString().split('T')[0]}.csv`
          break

        case 'verification':
          let verificationData = students
          if (dateFilter) {
            verificationData = students.filter(s => {
              const created = new Date(s.created_at)
              return created >= dateFilter.startDate && created <= dateFilter.endDate
            })
          }
          const verificationHeaders = ['Full Name', 'Email', 'Student ID', 'Sport', 'Verification Status', 'Verified Date', 'Created Date']
          csvContent = [
            verificationHeaders.join(','),
            ...verificationData.map(athlete => [
              `"${athlete.full_name || ''}"`,
              `"${athlete.email || ''}"`,
              `"${athlete.student_id || ''}"`,
              `"${athlete.sport || ''}"`,
              `"${athlete.is_verified ? 'Verified' : 'Pending'}"`,
              `"${athlete.is_verified ? new Date(athlete.created_at).toLocaleDateString() : 'N/A'}"`,
              `"${new Date(athlete.created_at).toLocaleDateString()}"`
            ].join(','))
          ].join('\n')
          filename = `verification_report_${new Date().toISOString().split('T')[0]}.csv`
          break

        default:
          toast.error('Invalid report type')
          return
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      link.remove()
      toast.success(`Report downloaded successfully: ${filename}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to generate report')
    }
  }

  const renderAnalyticsTab = () => {
    const verificationRate = students.length > 0 ? Math.round((verifiedStudents.length / students.length) * 100) : 0
    const totalFiles = files.length
    const totalStorage = files.reduce((acc, file) => acc + (file.file_size || 0), 0)

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1']

    const reportTypes = [
      { value: 'athletes', label: 'Athletes' },
      { value: 'files', label: 'Files' },
      { value: 'folders', label: 'Folders' },
      { value: 'announcements', label: 'Announcements' },
      { value: 'verification', label: 'Verification Status' },
    ]

    const dateRanges = [
      { value: 'today', label: 'Today' },
      { value: 'this-week', label: 'This Week' },
      { value: 'this-month', label: 'This Month' },
      { value: 'last-month', label: 'Last Month' },
      { value: 'this-year', label: 'This Year' },
      { value: 'custom-range', label: 'Custom Range' },
    ]

    const quickReports = [
      { id: 'monthly-athletes', title: 'Monthly Athletes Summary', icon: FileText, type: 'athletes' },
      { id: 'verification-report', title: 'Verification Status Report', icon: ShieldCheck, type: 'verification' },
      { id: 'files-upload', title: 'Files Upload Report', icon: FileSpreadsheet, type: 'files' },
      { id: 'folders-activity', title: 'Folders Activity Report', icon: Folder, type: 'folders' },
    ]

    const getReportTypeLabel = () => {
      return reportTypes.find(r => r.value === reportType)?.label || 'Athletes'
    }

    const getDateRangeLabel = () => {
      return dateRanges.find(d => d.value === dateRange)?.label || 'This Month'
    }

    return (
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Generate and export system reports</p>
                          </div>
                        
        {/* Generate Report Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Generate Report</h2>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Report Type Dropdown */}
              <div className="relative dropdown-container">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Report Type</label>
                <button
                  onClick={() => {
                    setShowReportTypeDropdown(!showReportTypeDropdown)
                    setShowDateRangeDropdown(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-left text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                >
                  <span>{getReportTypeLabel()}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showReportTypeDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showReportTypeDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                    {reportTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setReportType(type.value)
                          setShowReportTypeDropdown(false)
                          if (type.value !== 'folders') {
                            setSelectedSportFolderForReport('')
                          }
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        <span className="text-slate-900 dark:text-white">{type.label}</span>
                        {reportType === type.value && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                        </div>
                        
              {/* Date Range Dropdown */}
              <div className="relative dropdown-container">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date Range</label>
                <button
                  onClick={() => {
                    setShowDateRangeDropdown(!showDateRangeDropdown)
                    setShowReportTypeDropdown(false)
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-left text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                >
                  <span>{getDateRangeLabel()}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showDateRangeDropdown ? 'rotate-180' : ''}`} />
                            </button>
                {showDateRangeDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                    {dateRanges.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setDateRange(range.value)
                          setShowDateRangeDropdown(false)
                          if (range.value !== 'custom-range') {
                            setCustomStartDate('')
                            setCustomEndDate('')
                          }
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        <span className="text-slate-900 dark:text-white">{range.label}</span>
                        {dateRange === range.value && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                          </div>
                )}
                        </div>
            </div>

            {/* Sport Folder Selection (when report type is folders) */}
            {reportType === 'folders' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sport Folder</label>
                <select
                  value={selectedSportFolderForReport}
                  onChange={(e) => setSelectedSportFolderForReport(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                >
                  <option value="">All Sport Folders</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Date Range (when date range is custom-range) */}
            {dateRange === 'custom-range' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Download Button */}
            <div className="pt-2">
              <button
                onClick={() => generateAndDownloadReport()}
                disabled={dateRange === 'custom-range' && (!customStartDate || !customEndDate)}
                className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Excel Report
              </button>
            </div>
          </div>
        </div>

        {/* Quick Reports Section */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Reports</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {quickReports.map((report) => {
              const Icon = report.icon
              return (
                  <motion.div
                  key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setReportType(report.type)
                    if (report.type === 'athletes' || report.type === 'verification') {
                      exportAnalyticsExcel('all')
                    } else if (report.type === 'files') {
                      exportAnalyticsExcel('all')
                    } else {
                      exportAnalyticsExcel('all')
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{report.title}</h3>
                      </div>
                    </div>
                </motion.div>
              )
            })}
                    </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
              <Users className="w-8 h-8 text-blue-400 dark:text-blue-500" />
                        </div>
            <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{usersData.length}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">All registered users</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
            className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Athletes</p>
              <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 dark:text-purple-500" />
                </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-900 dark:text-purple-100">{students.length}</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 sm:mt-2">Registered athletes</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
            className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Verified</p>
              <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 dark:text-green-500" />
                      </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-900 dark:text-green-100">{verifiedStudents.length}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 sm:mt-2">{verificationRate}% verification rate</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
            className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400">Folders</p>
              <Folder className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 dark:text-amber-500" />
                      </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-900 dark:text-amber-100">{folders.length}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 sm:mt-2">Total folders created</p>
                  </motion.div>
                      </div>

        {/* Additional Stats */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
                    </div>
                            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Files</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalFiles}</p>
                    </div>
                </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Files across all folders</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Storage Used</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatFileSize(totalStorage)}</p>
                            </div>
                          </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total storage capacity</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
                          </div>
                            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Announcements</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{announcements.length}</p>
                        </div>
                    </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total announcements posted</p>
                  </motion.div>
                    </div>

        {/* Charts Section */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Athletes by Sport - Bar Chart */}
                  <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">Athletes by Sport</h3>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart data={sportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
                  </motion.div>

          {/* Verification Status - Pie Chart */}
                  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Verification Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={verificationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {verificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
                  </motion.div>

          {/* Athletes by Course - Bar Chart */}
                  <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Athletes by Course</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Registration Trend - Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Registration Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={registrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
                    </div>
                        </div>
    )
  }

  const renderVerificationModal = () => {
    if (!selectedUser) return null
                        return (
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4">
          <div className="flex items-start justify-between">
                      <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Verification review</h3>
              <p className="text-sm text-slate-500">{selectedUser.full_name}</p>
                        </div>
            <button onClick={() => setSelectedUser(null)} className="text-slate-500 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
                      </div>

          {selectedUser.id_picture_url ? (
            <img
              src={selectedUser.id_picture_url}
              alt="ID"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <p className="text-sm text-slate-500">This user has not uploaded an ID yet.</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => updateVerification(selectedUser, false)}
              className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700"
              disabled={verificationLoading}
            >
              Mark pending
            </button>
            <button
              onClick={() => updateVerification(selectedUser, true)}
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white"
              disabled={verificationLoading}
            >
              Verify
            </button>
                        </div>
                      </div>
                        </div>
                        )
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'folders':
        return renderFoldersTab()
      case 'users':
        return renderUsersTab()
      case 'announcements':
        return renderAnnouncementsTab()
      case 'analytics':
        return renderAnalyticsTab()
      default:
        return null
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Authentication required</h1>
          <p className="text-slate-500">Please sign in to continue.</p>
                      </div>
                    </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <header className="relative overflow-hidden border-b border-white/40 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="absolute inset-0 opacity-60 blur-3xl pointer-events-none">
          <div className="absolute -top-20 left-10 h-56 w-56 bg-gradient-to-br from-sky-400/40 via-indigo-500/30 to-purple-500/30 rounded-full" />
          <div className="absolute bottom-0 right-6 h-40 w-40 bg-gradient-to-br from-emerald-400/30 to-teal-500/30 rounded-full" />
                </div>
        <div className="relative max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-slate-800 text-xs font-medium text-slate-500 dark:text-slate-300 shadow-sm">
              <Sparkles className="w-3 h-3 text-sky-500" />
              Elite Performance Unit
            </p>
            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user.user_metadata?.full_name ?? 'Admin'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Oversee athlete data, approvals, and announcements from a single command center.
                                  </p>
                                </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={loadAllData}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-lg"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={signOut} className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-red-500/50 text-red-500 text-xs sm:text-sm font-semibold hover:bg-red-500/10 transition">
              Sign out
            </button>
                      </div>
                        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        <div className="flex flex-wrap gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
                        return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border transition whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {tab.label}
              </button>
            )
          })}
                  </div>

        <section className="bg-white/80 dark:bg-slate-900/70 rounded-2xl sm:rounded-3xl border border-white/40 dark:border-slate-800 p-4 sm:p-6 min-h-[320px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading dashboard data...</p>
                        </div>
          ) : (
            renderTab()
          )}
        </section>
      </main>

      {renderVerificationModal()}

      {/* PDF Viewer Modal */}
      {selectedPdfFile && (
        <div className="fixed inset-0 z-[2000] bg-black/80 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                  {selectedPdfFile.original_name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatFileSize(selectedPdfFile.file_size)}
                              </p>
                            </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={closePdfViewer}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                          </div>
                                </div>

            {/* PDF Viewer Content */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-800">
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-600 dark:text-slate-400">Loading PDF...</p>
                                </div>
              ) : pdfError ? (
                <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <X className="w-8 h-8 text-red-600 dark:text-red-400" />
                      </div>
                  <p className="text-red-600 dark:text-red-400 font-medium">{pdfError}</p>
                  <button
                    onClick={handleDownloadPdf}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Try Download Instead
                  </button>
                        </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full min-h-[600px] rounded-lg border border-slate-300 dark:border-slate-700"
                  title={selectedPdfFile.original_name}
                />
              ) : null}
                  </div>
                </motion.div>
              </div>
        )}
    </div>
  )
}

