'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Award, Users, FileText, Shield, Star, Zap, Target, Crown } from 'lucide-react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(onComplete, 500)
          return 100
        }
        return prev + 2
      })
    }, 60)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-cyan-200 to-blue-300 rounded-full opacity-40 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-32 left-40 w-28 h-28 bg-gradient-to-r from-purple-200 to-blue-300 rounded-full opacity-35 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-r from-indigo-200 to-blue-300 rounded-full opacity-45 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-ping"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-500 rounded-full opacity-80 animate-ping" style={{ animationDelay: '0.3s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-70 animate-ping" style={{ animationDelay: '0.7s' }}></div>
      </div>

      {/* Main Glass Morphism Container */}
      <div className="text-center z-10 max-w-4xl mx-auto px-6">
        <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 dark:border-gray-700/30 p-8 md:p-12">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-2xl flex items-center justify-center mb-6 relative">
            <Award className="w-16 h-16 text-white relative z-10" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
          </div>
        </motion.div>

        {/* App Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold text-blue-900 dark:text-white mb-4"
        >
          AthleteFile
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="mb-12"
        >
          <p className="text-2xl text-blue-700 dark:text-blue-100 mb-2 font-medium">Professional File Management System</p>
          <p className="text-lg text-blue-600 dark:text-blue-200">Secure • Efficient • Modern</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
        >
          <motion.div 
            className="text-center group bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <p className="text-blue-900 dark:text-white text-sm font-semibold">Admin Control</p>
            <p className="text-blue-600 dark:text-blue-200 text-xs">Full Management</p>
          </motion.div>
          <motion.div 
            className="text-center group bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <p className="text-blue-900 dark:text-white text-sm font-semibold">File Management</p>
            <p className="text-blue-600 dark:text-blue-200 text-xs">Secure Upload</p>
          </motion.div>
          <motion.div 
            className="text-center group bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <p className="text-blue-900 dark:text-white text-sm font-semibold">Secure Storage</p>
            <p className="text-blue-600 dark:text-blue-200 text-xs">Protected Data</p>
          </motion.div>
          <motion.div 
            className="text-center group bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 hover:bg-white/20 dark:hover:bg-gray-800/20 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Target className="w-8 h-8 text-white" />
            </div>
            <p className="text-blue-900 dark:text-white text-sm font-semibold">Athlete Focused</p>
            <p className="text-blue-600 dark:text-blue-200 text-xs">Professional</p>
          </motion.div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="w-96 mx-auto"
        >
          <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm rounded-full h-4 mb-4 border border-white/30 dark:border-gray-700/30 shadow-lg">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-blue-700 dark:text-blue-200 text-sm font-medium">
            {progress < 100 ? 'Initializing System...' : 'Ready to Launch!'}
          </p>
        </motion.div>
        </div>
      </div>
    </div>
  )
}
