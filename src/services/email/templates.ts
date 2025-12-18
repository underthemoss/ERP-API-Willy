/**
 * Email template utilities for creating professional HTML emails
 */

export interface TemplateOptions {
  title: string;
  subtitle?: string;
  content: string;
  primaryCTA?: {
    text: string;
    url: string;
  };
  secondaryCTA?: {
    text: string;
    url: string;
  };
  bannerImgUrl?: string;
  iconUrl?: string;
}

/**
 * Creates a modern, professional HTML email template
 */
export function createEmailTemplate(options: TemplateOptions): string {
  const {
    title,
    subtitle,
    content,
    primaryCTA,
    secondaryCTA,
    bannerImgUrl,
    iconUrl,
  } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Remove default styling */
    body { margin: 0; padding: 0; width: 100% !important; min-width: 100%; }
    
    /* Logo styles */
    .logo-img { 
      max-width: 100px; 
      height: auto; 
      display: block; 
      margin: 0 0 20px 0;
    }
    
    /* Header with banner support */
    .header-with-banner {
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
    }
    
    /* Overlay for better text readability on banner */
    .header-overlay {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%);
      padding: 40px 30px;
      text-align: center;
    }
    
    /* Mobile styles */
    @media screen and (max-width: 600px) {
      .mobile-hide { display: none !important; }
      .mobile-center { text-align: center !important; }
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 20px !important; }
      .button { width: 100% !important; max-width: 300px !important; }
      .two-column .column { width: 100% !important; display: block !important; }
      .logo-img { max-width: 80px; }
      .header-overlay { padding: 30px 20px; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f7fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td class="${bannerImgUrl ? 'header-with-banner' : ''}" style="${bannerImgUrl ? `background-image: url('${bannerImgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;` : 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'} ${!bannerImgUrl ? 'padding: 40px 30px;' : ''} text-align: center;">
              ${bannerImgUrl ? '<div class="header-overlay">' : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.3;">
                ${title}
              </h1>
              ${
                subtitle
                  ? `
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.5;">
                ${subtitle}
              </p>
              `
                  : ''
              }
              ${bannerImgUrl ? '</div>' : ''}
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 40px 30px;">
              ${
                iconUrl
                  ? `
              <img src="${iconUrl}" alt="Logo" class="logo-img" style="max-width: 100px; height: auto; display: block; margin: 0 0 20px 0;" />
              `
                  : ''
              }
              <div style="color: #333333; font-size: 16px; line-height: 1.6;">
                ${content}
              </div>
              
              ${
                primaryCTA || secondaryCTA
                  ? `
              <!-- CTA Buttons -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="two-column">
                      ${
                        primaryCTA
                          ? `
                      <tr>
                        <td align="center" style="padding: 10px;">
                          <a href="${primaryCTA.url}" target="_blank" class="button" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                            ${primaryCTA.text}
                          </a>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                      ${
                        secondaryCTA
                          ? `
                      <tr>
                        <td align="center" style="padding: 10px;">
                          <a href="${secondaryCTA.url}" target="_blank" class="button" style="display: inline-block; padding: 14px 30px; background: #ffffff; color: #667eea; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; border: 2px solid #667eea; transition: all 0.3s ease;">
                            ${secondaryCTA.text}
                          </a>
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>
              `
                  : ''
              }
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.5;">
                This email was sent by EquipmentShare
              </p>
              <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 12px; line-height: 1.5;">
                © ${new Date().getFullYear()} EquipmentShare. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
        <!-- End Email Container -->
        
      </td>
    </tr>
  </table>
  <!-- End Wrapper -->
  
</body>
</html>
  `.trim();
}

/**
 * Creates a plain text version of the email from template options
 */
export function createPlainTextFromTemplate(options: TemplateOptions): string {
  const { title, subtitle, content, primaryCTA, secondaryCTA } = options;

  // Strip HTML tags from content for plain text version
  const plainContent = content.replace(/<[^>]*>/g, '');

  let plainText = `${title}\n`;

  if (subtitle) {
    plainText += `${subtitle}\n`;
  }

  plainText += `\n${plainContent}\n`;

  if (primaryCTA) {
    plainText += `\n${primaryCTA.text}: ${primaryCTA.url}\n`;
  }

  if (secondaryCTA) {
    plainText += `${secondaryCTA.text}: ${secondaryCTA.url}\n`;
  }

  plainText += `\n---\nThis email was sent by EquipmentShare\n© ${new Date().getFullYear()} EquipmentShare. All rights reserved.`;

  return plainText;
}
