import Brevo from '@getbrevo/brevo';

class EmailService {
  constructor() {
    this.apiInstance = new Brevo.TransactionalEmailsApi();
    const apiKey = this.apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
  }

  async sendEmail({ to, subject, html, text }) {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = text;
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || 'AI Support',
      email: process.env.BREVO_SENDER_EMAIL
    };
    sendSmtpEmail.to = [{ email: to }];

    try {
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log('✅ Email sent successfully:', result);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f23;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);">
                <tr>
                  <td style="padding: 40px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #fff; font-size: 28px; margin: 0;">
                        <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI Support</span>
                      </h1>
                    </div>
                    
                    <!-- Content -->
                    <h2 style="color: #fff; font-size: 24px; text-align: center; margin-bottom: 20px;">
                      Verify Your Email
                    </h2>
                    
                    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                      Hi <strong style="color: #fff;">${user.name}</strong>,<br><br>
                      Thanks for signing up! Please verify your email address by clicking the button below.
                    </p>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${verificationUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);">
                        Verify Email Address
                      </a>
                    </div>
                    
                    <!-- Expiry Notice -->
                    <p style="color: rgba(255,255,255,0.5); font-size: 14px; text-align: center; margin-top: 30px;">
                      ⏰ This link expires in 24 hours
                    </p>
                    
                    <!-- Fallback Link -->
                    <p style="color: rgba(255,255,255,0.5); font-size: 12px; text-align: center; margin-top: 20px; word-break: break-all;">
                      If the button doesn't work, copy this link:<br>
                      <a href="${verificationUrl}" style="color: #667eea;">${verificationUrl}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin: 0;">
                      If you didn't create an account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
      Hi ${user.name},
      
      Thanks for signing up! Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link expires in 24 hours.
      
      If you didn't create an account, you can safely ignore this email.
    `;

    return this.sendEmail({
      to: user.email,
      subject: '✨ Verify Your Email - AI Support',
      html,
      text
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f23;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #fff; font-size: 28px; margin: 0;">
                        <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI Support</span>
                      </h1>
                    </div>
                    
                    <!-- Content -->
                    <h2 style="color: #fff; font-size: 24px; text-align: center; margin-bottom: 20px;">
                      🔐 Reset Your Password
                    </h2>
                    
                    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                      Hi <strong style="color: #fff;">${user.name}</strong>,<br><br>
                      We received a request to reset your password. Click the button below to set a new password.
                    </p>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #fff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px; box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);">
                        Reset Password
                      </a>
                    </div>
                    
                    <!-- Security Notice -->
                    <div style="background: rgba(245, 87, 108, 0.1); border: 1px solid rgba(245, 87, 108, 0.3); border-radius: 10px; padding: 15px; margin: 20px 0;">
                      <p style="color: #f5576c; font-size: 14px; margin: 0; text-align: center;">
                        ⚠️ This link expires in 1 hour for security reasons
                      </p>
                    </div>
                    
                    <!-- Fallback Link -->
                    <p style="color: rgba(255,255,255,0.5); font-size: 12px; text-align: center; margin-top: 20px; word-break: break-all;">
                      If the button doesn't work, copy this link:<br>
                      <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin: 0;">
                      If you didn't request this, please ignore this email or contact support if you're concerned.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
      Hi ${user.name},
      
      We received a request to reset your password. Click the link below to set a new password:
      
      ${resetUrl}
      
      This link expires in 1 hour for security reasons.
      
      If you didn't request this, please ignore this email.
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🔐 Password Reset Request - AI Support',
      html,
      text
    });
  }

  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f23;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #fff; font-size: 28px; margin: 0;">
                        <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI Support</span>
                      </h1>
                    </div>
                    
                    <!-- Content -->
                    <h2 style="color: #fff; font-size: 24px; text-align: center; margin-bottom: 20px;">
                      🎉 Welcome to AI Support!
                    </h2>
                    
                    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                      Hi <strong style="color: #fff;">${user.name}</strong>,<br><br>
                      Your email has been verified! You now have full access to our AI-powered support platform.
                    </p>
                    
                    <!-- Features -->
                    <div style="background: rgba(102, 126, 234, 0.1); border-radius: 15px; padding: 25px; margin: 20px 0;">
                      <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 16px;">What you can do:</h3>
                      <ul style="color: rgba(255,255,255,0.8); font-size: 14px; line-height: 2; padding-left: 20px; margin: 0;">
                        <li>💬 Chat with our AI assistant 24/7</li>
                        <li>📚 Get answers from our knowledge base</li>
                        <li>📝 Access your conversation history</li>
                        <li>🎯 Get personalized support</li>
                      </ul>
                    </div>
                    
                    <!-- Button -->
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.CLIENT_URL}/chat" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 50px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);">
                        Start Chatting
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
      Hi ${user.name},
      
      Welcome to AI Support! Your email has been verified.
      
      You now have full access to our AI-powered support platform.
      
      Start chatting: ${process.env.CLIENT_URL}/chat
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🎉 Welcome to AI Support!',
      html,
      text
    });
  }

  async sendOTPEmail(user, otp) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f23;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%); padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.05); border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 30px;">
                      <h1 style="color: #fff; font-size: 28px; margin: 0;">
                        <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI Support</span>
                      </h1>
                    </div>
                    
                    <!-- Content -->
                    <h2 style="color: #fff; font-size: 24px; text-align: center; margin-bottom: 20px;">
                      🔐 Your Verification Code
                    </h2>
                    
                    <p style="color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                      Hi <strong style="color: #fff;">${user.name}</strong>,<br><br>
                      Use this code to verify your email and complete registration.
                    </p>
                    
                    <!-- OTP Code -->
                    <div style="text-align: center; margin: 30px 0;">
                      <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 50px; border-radius: 15px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fff;">${otp}</span>
                      </div>
                    </div>
                    
                    <!-- Expiry Notice -->
                    <div style="background: rgba(245, 87, 108, 0.1); border: 1px solid rgba(245, 87, 108, 0.3); border-radius: 10px; padding: 15px; margin: 20px 0;">
                      <p style="color: #f5576c; font-size: 14px; margin: 0; text-align: center;">
                        ⏰ This code expires in 10 minutes
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <p style="color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; margin: 0;">
                      If you didn't request this code, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
      Hi ${user.name},
      
      Your verification code is: ${otp}
      
      This code expires in 10 minutes.
      
      If you didn't request this, please ignore this email.
    `;

    return this.sendEmail({
      to: user.email,
      subject: '🔐 Your Verification Code - AI Support',
      html,
      text
    });
  }
}

export default new EmailService();
