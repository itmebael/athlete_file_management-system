import emailjs from '@emailjs/browser'

// Initialize EmailJS with your public key
// You can find this in your EmailJS dashboard under Account > General
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY_HERE'
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID_HERE'
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID_HERE'

interface AnnouncementEmailParams {
  to_name: string
  to_email: string
  announcement_title: string
  announcement_content: string
  date: string
}

export const sendAnnouncementEmail = async (params: AnnouncementEmailParams) => {
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY_HERE') {
    console.warn('EmailJS Public Key not set. Email notification skipped.')
    return
  }

  if (!params.to_email || !params.to_email.trim()) {
    console.warn('Skipping email: Recipient email is empty')
    return
  }

  // Debug log to verify parameters before sending
  console.log('Sending email via EmailJS:', {
    serviceId: EMAILJS_SERVICE_ID,
    templateId: EMAILJS_TEMPLATE_ID,
    params: {
      ...params,
      to_email: params.to_email.trim()
    }
  })

  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_name: params.to_name,
        // Send email in multiple common fields to match potential template configuration
        to_email: params.to_email.trim(),
        email: params.to_email.trim(),
        recipient: params.to_email.trim(),
        reply_to: params.to_email.trim(),
        
        announcement_title: params.announcement_title,
        announcement_content: params.announcement_content,
        message: params.announcement_content, // Common alias
        date: params.date,
      },
      EMAILJS_PUBLIC_KEY
    )
    return result
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}
