'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, User, Mail, Lock, Shield, ArrowRight, Check, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import ThemeToggle from '@/components/ThemeToggle'
import SsuLogo from '@/ssulogo.webp'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

type Role = 'admin' | 'student'

interface SignUpForm {
  fullName: string
  studentId: string
  email: string
  phone: string
  course: string
  yearLevel: string
  sport: string
  position: string
  department: string
  title: string
  password: string
  confirmPassword: string
}

export default function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student' as Role,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoError, setLogoError] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [useFullToken, setUseFullToken] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [resetStep, setResetStep] = useState<'email' | 'token'>('email')
  const [verifyTokenLoading, setVerifyTokenLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role>('student')
  const [signUpRole, setSignUpRole] = useState<Role>('student')
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpStep, setSignUpStep] = useState<'form' | 'token'>('form')
  const [confirmationToken, setConfirmationToken] = useState('')
  const [verifyConfirmationLoading, setVerifyConfirmationLoading] = useState(false)
  const [pendingSignUpEmail, setPendingSignUpEmail] = useState('')
  const [signUpForm, setSignUpForm] = useState<SignUpForm>({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    course: '',
    yearLevel: '',
    sport: '',
    position: '',
    department: '',
    title: '',
    password: '',
    confirmPassword: ''
  })
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [idPicture, setIdPicture] = useState<File | null>(null)
  const [idPicturePreview, setIdPicturePreview] = useState<string | null>(null)
  const { signIn, signUp, uploadProfilePicture } = useAuth()

  const rememberPreferenceKey = 'rememberMe'

  const updateRememberPreference = (value: boolean) => {
    if (typeof window === 'undefined') return
    if (value) {
      localStorage.setItem(rememberPreferenceKey, 'true')
    } else {
      localStorage.removeItem(rememberPreferenceKey)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedPreference = localStorage.getItem(rememberPreferenceKey) === 'true'
    setRememberMe(storedPreference)
  }, [])

  // Check for password reset token and signup confirmation token in URL hash when component mounts
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')
    
    // If user clicked the reset link from email, extract 6-digit code from token
    if (accessToken && type === 'recovery') {
      // Extract last 6 digits from token as the code
      const tokenDigits = accessToken.slice(-6).replace(/\D/g, '')
      if (tokenDigits.length === 6) {
        setResetToken(tokenDigits)
        setShowForgotPassword(true)
        setResetStep('token')
        // Store the access token in sessionStorage for later verification
        sessionStorage.setItem('password_reset_token', accessToken)
        // Clear URL hash
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
    
    // If user clicked the signup confirmation link from email
    if (accessToken && type === 'signup') {
      // Extract last 6 digits from token as the code
      const tokenDigits = accessToken.slice(-6).replace(/\D/g, '')
      if (tokenDigits.length === 6) {
        setConfirmationToken(tokenDigits)
        setShowSignUp(true)
        setSignUpStep('token')
        // Store the access token in sessionStorage for later verification
        sessionStorage.setItem('signup_confirmation_token', accessToken)
        // Clear URL hash
        window.history.replaceState(null, '', window.location.pathname)
      }
    }
  }, [])

  const backgroundImageUrl = '/ssu.webp'
  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'student', label: 'Student' }
  ]

  const selectedRoleLabel = roles.find(r => r.value === selectedRole)?.label || 'User'

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true)
    setError('')

    try {
        const { error } = await signIn(formData.email, formData.password)
        if (error) {
        setError(error.message)
          toast.error(error.message)
        } else {
          updateRememberPreference(rememberMe)
          toast.success('Welcome back!')
        }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetEmail) return
    
    setResetLoading(true)
    
    try {
      // Configure the redirect URL - this will be used in the email template
      const redirectUrl = `${window.location.origin}/reset-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      })
      
      if (error) {
        toast.error(error.message)
      } else {
        setResetStep('token')
        toast.success('Password reset code sent to your email! Check your inbox for the 6-digit code.')
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  const handleVerifyTokenAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!resetToken || (useFullToken ? resetToken.length < 10 : resetToken.length !== 6)) {
      toast.error(useFullToken ? 'Please enter a valid reset token' : 'Please enter a valid 6-digit code')
      return
    }
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    setVerifyTokenLoading(true)
    
    try {
      // Extract token from URL hash if present (Supabase redirects with #access_token=...)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')
      
      // If we have a token from URL (user clicked email link), use it directly
      if (accessToken && type === 'recovery') {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        })
        
        if (updateError) {
          toast.error(updateError.message)
        } else {
          toast.success('Password reset successfully! You can now sign in with your new password.')
          setShowForgotPassword(false)
          setResetStep('email')
          setResetEmail('')
          setResetToken('')
          setNewPassword('')
          setConfirmNewPassword('')
          // Clear URL hash
          window.history.replaceState(null, '', window.location.pathname)
        }
      } else {
        // Check if we have a stored token from sessionStorage (user clicked link earlier)
        const storedToken = sessionStorage.getItem('password_reset_token')
        
        if (storedToken) {
          // Verify the entered code matches the stored token's last 6 digits
          const tokenDigits = storedToken.slice(-6).replace(/\D/g, '')
          
          if (resetToken === tokenDigits) {
            // Code matches, proceed with password reset
            const { error: updateError } = await supabase.auth.updateUser({
              password: newPassword
            })
            
            if (updateError) {
              toast.error(updateError.message)
            } else {
              toast.success('Password reset successfully! You can now sign in with your new password.')
              setShowForgotPassword(false)
              setResetStep('email')
              setResetEmail('')
              setResetToken('')
              setNewPassword('')
              setConfirmNewPassword('')
              sessionStorage.removeItem('password_reset_token')
            }
          } else {
            toast.error('Invalid code. Please check the code from your email.')
          }
        } else {
          // No stored token - user entered code/token directly
          if (useFullToken && resetToken.length > 6) {
            // User entered full token - use verifyOtp to verify it
            try {
              const { error: verifyError } = await supabase.auth.verifyOtp({
                email: resetEmail,
                token: resetToken,
                type: 'recovery'
              })
              
              if (verifyError) {
                toast.error(verifyError.message || 'Invalid token. Please check the token from your email.')
                return
              }
              
              // Token verified, now update password
              const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
              })
              
              if (updateError) {
                toast.error(updateError.message)
              } else {
                toast.success('Password reset successfully! You can now sign in with your new password.')
                setShowForgotPassword(false)
                setResetStep('email')
                setResetEmail('')
                setResetToken('')
                setNewPassword('')
                setConfirmNewPassword('')
                setUseFullToken(false)
              }
            } catch (verifyErr: any) {
              toast.error(verifyErr.message || 'Failed to verify token. Please check the token from your email.')
            }
          } else {
            // User entered 6-digit code - try to update password (might have clicked link in another tab)
            const { error: updateError } = await supabase.auth.updateUser({
              password: newPassword
            })
            
            if (updateError) {
              // Password update failed - suggest using full token
              toast.error('Please enter the full reset token from your email, or click the reset link to activate the session.')
            } else {
              // Password updated successfully
              toast.success('Password reset successfully! You can now sign in with your new password.')
              setShowForgotPassword(false)
              setResetStep('email')
              setResetEmail('')
              setResetToken('')
              setNewPassword('')
              setConfirmNewPassword('')
              setUseFullToken(false)
            }
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setVerifyTokenLoading(false)
    }
  }

  const handleVerifyConfirmationToken = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!confirmationToken || confirmationToken.length !== 6) {
      toast.error('Please enter the 6-digit code from your email')
      return
    }
    
    const emailForVerification = pendingSignUpEmail || signUpForm.email
    if (!emailForVerification) {
      toast.error('Unable to verify. Please enter your email again.')
      return
    }
    
    setVerifyConfirmationLoading(true)
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailForVerification,
        token: confirmationToken,
        type: 'signup',
      })
      
      if (error) {
        toast.error(error.message || 'Invalid confirmation code. Please check your email.')
      } else {
        toast.success('Email confirmed successfully! You can now sign in.')
        setShowSignUp(false)
        setSignUpStep('form')
        setConfirmationToken('')
        setPendingSignUpEmail('')
        setSignUpForm({
          fullName: '',
          studentId: '',
          email: '',
          phone: '',
          course: '',
          yearLevel: '',
          sport: '',
          position: '',
          department: '',
          title: '',
          password: '',
          confirmPassword: ''
        })
        setProfileImage(null)
        setImagePreview(null)
        setIdPicture(null)
        setIdPicturePreview(null)
        sessionStorage.removeItem('signup_confirmation_token')
        window.history.replaceState(null, '', window.location.pathname)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify confirmation code. Please try again.')
    } finally {
      setVerifyConfirmationLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }
    
    if (signUpForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long!')
      return
    }
    
    // Validate SSU ID is provided
    if (!signUpForm.studentId || signUpForm.studentId.trim() === '') {
      toast.error('SSU ID is required!')
      return
    }
    
    // Validate ID picture is uploaded
    if (!idPicture) {
      toast.error('Please upload your ID picture!')
      return
    }
    
    setSignUpLoading(true)
    
    try {
      // Create account first (without ID picture)
      const userData = {
        fullName: signUpForm.fullName,
        studentId: signUpForm.studentId,
        email: signUpForm.email,
        phone: signUpForm.phone,
        course: signUpForm.course,
        yearLevel: signUpForm.yearLevel,
        sport: signUpForm.sport,
        position: signUpForm.position,
        department: signUpForm.department,
        title: signUpForm.title,
        role: signUpRole,
        id_picture_url: null, // Will be uploaded after account creation
        is_verified: false
      }
      
      // Map the role to the expected format for the auth context
      const authRole = signUpRole === 'student' ? 'student' : 'admin'
      const { error: signUpError } = await signUp(signUpForm.email, signUpForm.password, signUpForm.fullName, authRole, userData)
      
      if (signUpError) {
        toast.error(signUpError.message)
        setSignUpLoading(false)
        return
      }
      
      // Try to upload ID picture - user might not be authenticated yet during signup
      // So we'll try, but if it fails, we'll allow the user to upload it after email confirmation
      if (idPicture) {
        try {
          // Check if user is authenticated
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          
          if (currentUser) {
            // User is authenticated, upload the ID picture
            const fileExt = idPicture.name.split('.').pop()
            const fileName = `id-pictures/${Date.now()}-${signUpForm.studentId}.${fileExt}`
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('athlete-files')
              .upload(fileName, idPicture, {
                cacheControl: '3600',
                upsert: false
              })
            
            if (uploadError) {
              console.error('ID picture upload error:', uploadError)
              toast.error(`Account created! ID picture will be uploaded after email confirmation.`)
            } else {
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('athlete-files')
                .getPublicUrl(fileName)
              
              // Update user profile with ID picture URL
              const { error: updateError } = await supabase
                .from('users')
                .update({ id_picture_url: urlData.publicUrl })
                .eq('id', currentUser.id)
              
              if (updateError) {
                console.error('Error updating user with ID picture URL:', updateError)
              }
            }
          } else {
            // User not authenticated yet (waiting for email confirmation)
            // Store ID picture in sessionStorage to upload after confirmation
            const reader = new FileReader()
            reader.onloadend = () => {
              sessionStorage.setItem('pending_id_picture', JSON.stringify({
                data: reader.result,
                name: idPicture.name,
                studentId: signUpForm.studentId
              }))
            }
            reader.readAsDataURL(idPicture)
            toast.success('Account created! ID picture will be uploaded after email confirmation.')
          }
        } catch (uploadErr: any) {
          console.error('ID picture upload exception:', uploadErr)
          toast.success('Account created! You can upload your ID picture after email confirmation.')
        }
      }
      
      // Move to token verification step
      setPendingSignUpEmail(signUpForm.email)
      setSignUpStep('token')
      toast.success('Account created! Please check your email for the confirmation code.')
    } catch (err) {
      console.error('Sign up error:', err)
      toast.error('An error occurred during account creation. Please try again.')
    } finally {
      setSignUpLoading(false)
    }
  }

  const handleLogoError = () => {
    setLogoError(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Role-based styling functions
  const getRoleButtonClass = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-100 shadow-lg backdrop-blur-sm border-red-400/40'
      case 'student':
        return 'bg-blue-500/20 text-blue-100 shadow-lg backdrop-blur-sm border-blue-400/40'
      default:
        return 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
    }
  }
  
  const getRoleIconClass = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-400'
      case 'student':
        return 'bg-blue-400'
      default:
        return 'bg-white'
    }
  }
  
  const getFormContainerClass = () => {
    switch (selectedRole) {
      case 'admin':
        return 'bg-red-500/10 border-red-400/30'
      case 'student':
        return 'bg-blue-500/10 border-blue-400/30'
      default:
        return 'bg-white/10 border-white/20'
    }
  }
  
  const getRoleTextClass = () => {
    switch (selectedRole) {
      case 'admin':
        return 'text-red-200'
      case 'student':
        return 'text-blue-200'
      default:
        return 'text-white/80'
    }
  }
  
  const getLoginButtonClass = () => {
    switch (selectedRole) {
      case 'admin':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'student':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      default:
        return 'bg-black hover:bg-gray-800 text-white'
    }
  }
  
  const getInputFocusClass = () => {
    switch (selectedRole) {
      case 'admin':
        return 'focus:ring-2 focus:ring-red-400/30 focus:border-red-400/40'
      case 'student':
        return 'focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/40'
      default:
        return 'focus:ring-2 focus:ring-white/30 focus:border-white/40'
    }
  }
  
  const getRoleIconContainerClass = () => {
    switch (selectedRole) {
      case 'admin':
        return 'bg-red-500/20 border border-red-400/40'
      case 'student':
        return 'bg-blue-500/20 border border-blue-400/40'
      default:
        return 'bg-white/20 border border-white/40'
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6">
      {/* Campus Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      </div>
      
      {/* Subtle overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-800/20 to-indigo-900/20"></div>
      
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-6xl">
        {/* Role Selection Buttons */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value as Role)}
                className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  selectedRole === role.value
                    ? getRoleButtonClass(role.value as Role)
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-5 h-5 rounded-full ${getRoleIconClass(role.value as Role)}`}></div>
                  {role.label}
                </div>
              </button>
            ))}
          </div>
                </div>
                
        {/* Main Card with Glass Morphism */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Branding & Content */}
            <div className="p-12 text-white relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-16 h-16 bg-white rounded-full"></div>
                <div className="absolute bottom-10 right-10 w-12 h-12 bg-white rounded-full"></div>
                <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-white rounded-full"></div>
              </div>
              
              <div className="relative z-10">
                {/* Logo and Branding */}
                <div className="flex items-start mb-8">
                  {!logoError ? (
                    <Image 
                      src={SsuLogo}
                      alt="Samar State University" 
                      className="w-48 h-48 object-contain mr-6"
                      onError={handleLogoError as any}
                      width={192}
                      height={192}
                      priority
                    />
                  ) : (
                    <Image
                      src={backgroundImageUrl}
                      alt="Samar State University"
                      className="w-48 h-48 object-contain mr-6"
                      width={192}
                      height={192}
                      priority
                    />
                  )}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h1 className="text-2xl font-bold mb-1">SSU APMS</h1>
                      <p className="text-white/80 text-sm">Athletes Profile Management System</p>
                    </div>
                    
                    {/* Feature Highlights */}
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white/90 font-medium text-sm">Comprehensive Registration & Validation</span>
                  </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                        <span className="text-white/90 font-medium text-sm">Advanced Performance Analytics</span>
                  </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mr-3">
                      <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white/90 font-medium text-sm">Seamless Event Management</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main Headline */}
                <div className="mb-8">
                  <h2 className="text-4xl font-bold mb-6 leading-tight">We Are The Best In<br/>Athlete Management</h2>
                  <p className="text-white/90 leading-relaxed text-lg">
                    Elevate your athletic program efficiency with SSU's sleek and intuitive management system. 
                    Designed with simplicity, security, and performance in mind, this platform ensures that your 
                    journey into comprehensive athlete management is as smooth as possible. Perfectly aligned for 
                    universities and institutions aiming to achieve excellence in sports administration.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="p-12">
              {/* Glass morphism form container with role-based styling */}
              <div className={`${getFormContainerClass()} backdrop-blur-xl rounded-3xl p-8 border shadow-2xl`}>
                {/* Form Header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${getRoleIconContainerClass()}`}>
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">WELCOME BACK</h2>
                  <p className={`${getRoleTextClass()} text-lg`}>{selectedRoleLabel.toUpperCase()} MEMBER</p>
                  <p className="text-white/60 text-sm mt-1">LOGIN TO CONTINUE</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="block text-white/90 font-medium text-sm">Email</label>
                      <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <User className="w-5 h-5 text-white/60" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className={`w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-300 text-white placeholder-white/50 ${
                          errors.email ? 'border-red-400 focus:ring-red-400/30' : ''
                        } ${getInputFocusClass()}`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && <p className="text-red-300 text-sm">{errors.email}</p>}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="block text-white/90 font-medium text-sm">Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <Lock className="w-5 h-5 text-white/60" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className={`w-full pl-12 pr-12 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-300 text-white placeholder-white/50 ${
                          errors.password ? 'border-red-400 focus:ring-red-400/30' : ''
                        } ${getInputFocusClass()}`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-300 text-sm">{errors.password}</p>}
                  </div>

                  {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setRememberMe(checked)
                            updateRememberPreference(checked)
                          }}
                        className="w-4 h-4 text-white bg-white/10 border-white/30 rounded focus:ring-2 focus:ring-white/30 focus:ring-offset-0 transition-all duration-300"
                        />
                      <span className="text-white/80 text-sm group-hover:text-white transition-colors">Remember me</span>
                      </label>
                    <div className="flex flex-col items-end space-y-1">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-white/80 hover:text-white font-medium text-sm transition-colors hover:underline"
                      >
                        Forgot your Password?
                      </button>
                      {selectedRole !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => setShowSignUp(true)}
                          className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors hover:underline"
                        >
                          Sign up
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center ${getLoginButtonClass()}`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        Proceed to my Account
                        <ArrowRight className="w-5 h-5 ml-3" />
                      </span>
                    )}
                  </button>
                </form>

                {/* Error Message */}
                {error && (
                  <div className="mt-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl">
                    <p className="text-red-200 text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
            setShowForgotPassword(false)
            setResetStep('email')
            setResetEmail('')
            setResetToken('')
            setNewPassword('')
            setConfirmNewPassword('')
          }}></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6 border border-white/30">
                <Mail className="w-8 h-8 text-white" />
              </div>
              
              {resetStep === 'email' ? (
                <>
                  <h3 className="text-xl font-bold text-white mb-3">Reset Password</h3>
                  <p className="text-white/80 mb-6 text-sm">Enter your email address and we'll send you a 6-digit code to reset your password.</p>
                  
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-white/90 font-medium text-sm text-left">Email Address</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false)
                          setResetStep('email')
                          setResetEmail('')
                        }}
                        className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 text-sm border border-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 text-sm"
                      >
                        {resetLoading ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </span>
                        ) : (
                          'Send Code'
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-white mb-3">Enter Reset Code</h3>
                  <p className="text-white/80 mb-6 text-sm">We've sent a 6-digit code to <span className="font-semibold text-white">{resetEmail}</span>. Please check your email and enter the code below.</p>
                  
                  <form onSubmit={handleVerifyTokenAndReset} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-white/90 font-medium text-sm text-left">
                          {useFullToken ? 'Reset Token' : '6-Digit Code'}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setUseFullToken(!useFullToken)
                            setResetToken('')
                          }}
                          className="text-xs text-white/70 hover:text-white underline"
                        >
                          {useFullToken ? 'Use 6-digit code instead' : 'Have full token? Click here'}
                        </button>
                      </div>
                      {useFullToken ? (
                        <input
                          type="text"
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50 text-sm font-mono"
                          placeholder="Paste the full token from your email"
                        />
                      ) : (
                        <input
                          type="text"
                          value={resetToken}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                            setResetToken(value)
                          }}
                          required
                          maxLength={6}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50 text-center text-2xl font-mono tracking-widest"
                          placeholder="000000"
                        />
                      )}
                      <p className="text-white/60 text-xs text-left">
                        {useFullToken 
                          ? 'Paste the full reset token from your email. You can also enter just the last 6 digits of the token.'
                          : 'Enter the 6-digit code from your email (last 6 characters of the token). You can also paste the full token by clicking the link above.'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-white/90 font-medium text-sm text-left">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                        placeholder="Enter new password"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-white/90 font-medium text-sm text-left">Confirm New Password</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                        placeholder="Confirm new password"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setResetStep('email')
                          setResetEmail('')
                          setResetToken('')
                          setNewPassword('')
                          setConfirmNewPassword('')
                          setUseFullToken(false)
                        }}
                        className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 text-sm border border-white/20"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={verifyTokenLoading || (useFullToken ? resetToken.length < 10 : resetToken.length !== 6) || !newPassword || newPassword !== confirmNewPassword}
                        className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {verifyTokenLoading ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Resetting...
                          </span>
                        ) : (
                          'Reset Password'
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sign Up Modal */}
      {showSignUp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {signUpStep === 'form' ? 'Create Account' : 'Confirm Your Email'}
              </h2>
              <button
                onClick={() => {
                  setShowSignUp(false)
                  setSignUpStep('form')
                  setConfirmationToken('')
                  setPendingSignUpEmail('')
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {signUpStep === 'form' ? (
              /* Registration Form */
              <form onSubmit={handleSignUp} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="block text-white/90 font-medium text-sm text-left">Select Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSignUpRole('student')}
                    className={`p-3 rounded-xl border transition-all duration-300 text-sm font-medium ${
                      signUpRole === 'student'
                        ? 'bg-white/20 text-white border-white/40'
                        : 'bg-white/10 text-white/80 border-white/20 hover:bg-white/15'
                    }`}
                  >
                    Student
                  </button>
                </div>
              </div>
              
              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <label className="block text-white/90 font-medium text-sm text-left">Profile Picture</label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-white/60" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/20 file:text-white hover:file:bg-white/30"
                    />
                    <p className="text-white/60 text-xs mt-1">Upload a profile picture (optional)</p>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-white/90 font-medium text-sm text-left">Full Name</label>
                  <input
                    type="text"
                    value={signUpForm.fullName}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-white/90 font-medium text-sm text-left">SSU ID <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={signUpForm.studentId}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, studentId: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                    placeholder="Enter your SSU ID number"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-white/90 font-medium text-sm text-left">Email Address</label>
                  <input
                    type="email"
                    value={signUpForm.email}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-white/90 font-medium text-sm text-left">Phone Number</label>
                  <input
                    type="tel"
                    value={signUpForm.phone}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                    placeholder="Phone number"
                  />
                </div>
              </div>
              
              {/* Role-specific fields */}
              {signUpRole === 'student' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-white/90 font-medium text-sm text-left">Course/Program</label>
                      <input
                        type="text"
                        value={signUpForm.course}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, course: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                        placeholder="e.g., BS Computer Science"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-white/90 font-medium text-sm text-left">Year Level</label>
                      <select
                        value={signUpForm.yearLevel}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, yearLevel: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white"
                      >
                        <option value="" className="bg-gray-800 text-white">Select Year Level</option>
                        <option value="1st Year" className="bg-gray-800 text-white">1st Year</option>
                        <option value="2nd Year" className="bg-gray-800 text-white">2nd Year</option>
                        <option value="3rd Year" className="bg-gray-800 text-white">3rd Year</option>
                        <option value="4th Year" className="bg-gray-800 text-white">4th Year</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-white/90 font-medium text-sm text-left">Sport/Event</label>
                      <input
                        type="text"
                        value={signUpForm.sport}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, sport: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                        placeholder="e.g., Basketball, Swimming"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-white/90 font-medium text-sm text-left">Position/Role</label>
                      <input
                        type="text"
                        value={signUpForm.position}
                        onChange={(e) => setSignUpForm(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                        placeholder="e.g., Point Guard, Forward"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-white/90 font-medium text-sm text-left">Password</label>
                  <input
                    type="password"
                    value={signUpForm.password}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                    placeholder="Create a password"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-white/90 font-medium text-sm text-left">Confirm Password</label>
                  <input
                    type="password"
                    value={signUpForm.confirmPassword}
                    onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
              
              {/* ID Picture Upload */}
              <div className="space-y-2">
                <label className="block text-white/90 font-medium text-sm text-left">ID Picture <span className="text-red-400">*</span></label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            // Validate file size (max 5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('ID picture must be less than 5MB')
                              return
                            }
                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              toast.error('Please upload an image file')
                              return
                            }
                            setIdPicture(file)
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setIdPicturePreview(reader.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        required
                      />
                      <div className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 text-white text-center cursor-pointer">
                        {idPicture ? 'Change ID Picture' : 'Upload ID Picture'}
                      </div>
                    </label>
                  </div>
                  {idPicturePreview && (
                    <div className="mt-2">
                      <div className="relative inline-block">
                        <img
                          src={idPicturePreview}
                          alt="ID Picture Preview"
                          className="w-32 h-40 object-cover rounded-lg border-2 border-white/30"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIdPicture(null)
                            setIdPicturePreview(null)
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-white/70 text-xs mt-1">{idPicture?.name}</p>
                    </div>
                  )}
                  <p className="text-white/60 text-xs">Please upload a clear photo of your SSU ID card (Max 5MB)</p>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSignUp(false)}
                  className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 text-sm border border-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 text-sm"
                >
                  {signUpLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </form>
            ) : (
              /* Token Verification Step */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6 border border-white/30">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Enter Confirmation Code</h3>
                  <p className="text-white/80 mb-6 text-sm">
                    We've sent a 6-digit confirmation code to <span className="font-semibold text-white">{pendingSignUpEmail}</span>. 
                    Please check your email and enter the code below to verify your account.
                  </p>
                </div>
                
                <form onSubmit={handleVerifyConfirmationToken} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-white/90 font-medium text-sm text-left">6-Digit Confirmation Code</label>
                    <input
                      type="text"
                      value={confirmationToken}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setConfirmationToken(value)
                      }}
                      required
                      maxLength={6}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300 text-white placeholder-white/50 text-center text-2xl font-mono tracking-widest"
                      placeholder="000000"
                    />
                      <p className="text-white/60 text-xs text-left">
                        Enter the 6-digit code from your confirmation email. The code is the last 6 characters of the token shown in your email.
                      </p>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSignUpStep('form')
                        setConfirmationToken('')
                        setPendingSignUpEmail('')
                        // Clear all signup form fields
                        setSignUpForm({
                          fullName: '',
                          studentId: '',
                          email: '',
                          phone: '',
                          course: '',
                          yearLevel: '',
                          sport: '',
                          position: '',
                          department: '',
                          title: '',
                          password: '',
                          confirmPassword: ''
                        })
                        setProfileImage(null)
                        setImagePreview(null)
                        setIdPicture(null)
                        setIdPicturePreview(null)
                      }}
                      className="flex-1 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 text-sm border border-white/20"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={verifyConfirmationLoading || confirmationToken.length !== 6}
                      className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {verifyConfirmationLoading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Verifying...
                        </span>
                      ) : (
                        'Verify Email'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
      </div>
      )}
    </div>
  )
}