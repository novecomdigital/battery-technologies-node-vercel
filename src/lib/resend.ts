import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key')

export { resend }

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    // Skip sending email if no API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log('Resend API key not configured, skipping email send')
      return { success: true, data: null }
    }

    const { data, error } = await resend.emails.send({
      from: 'Battery Technologies <onboarding@resend.dev>',
      to: [email],
      subject: 'Welcome to Battery Technologies!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to Battery Technologies!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for signing up! We're excited to have you on board.</p>
          <p>This is a demo email sent using Resend from your Next.js application.</p>
          <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
            <h3 style="margin-top: 0;">What's next?</h3>
            <ul>
              <li>Explore your dashboard</li>
              <li>Update your profile</li>
              <li>Start building amazing features</li>
            </ul>
          </div>
          <p style="margin-top: 30px;">
            Best regards,<br>
            The Battery Technologies Team
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
