"use client";

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sendBulkEmailToAllUsers } from '@/app/actions/send-bulk-email';
import { sendTestEmail } from '@/app/actions/send-test-email';
import { getEmailTemplate, saveEmailTemplate } from '@/app/actions/email-template';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/ui/loader';
import { Mail, Send, Eye, Code, Save } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface SendEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SendEmailDialog({ isOpen, onClose }: SendEmailDialogProps) {
  const { toast } = useToast();
  const [subject, setSubject] = useState('L9 Tools: Website Update Complete');
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const defaultEmailTemplate = `<style type="text/css">
    /* Email client reset */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    /* Desktop styles - ensure container uses percentage width */
    .email-container {
      width: 95% !important;
      max-width: 900px !important;
    }
    /* Mobile styles */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .email-content {
        padding: 20px 15px !important;
      }
      .email-header {
        padding: 30px 20px !important;
      }
      .email-header h1 {
        font-size: 28px !important;
      }
      .email-header p {
        font-size: 14px !important;
      }
      .email-button {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        padding: 16px 20px !important;
        min-height: 44px !important;
      }
      .email-button a {
        display: block !important;
        width: 100% !important;
      }
      .email-text {
        font-size: 15px !important;
        line-height: 1.6 !important;
      }
      .email-text-small {
        font-size: 13px !important;
      }
      .email-title {
        font-size: 20px !important;
      }
      .email-subtitle {
        font-size: 16px !important;
      }
      .email-padding {
        padding: 20px 15px !important;
      }
      .email-padding-small {
        padding: 15px !important;
      }
    }
  </style>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="95%" class="email-container" style="max-width: 900px; width: 95%; background-color: #0D0F18; border: 1px solid #1a1a1a;">
          <tr>
            <td class="email-header" style="background-color: #6C63FF; padding: 50px 30px; text-align: center; border-bottom: 5px solid #000000; box-shadow: 0 5px 20px rgba(108, 99, 255, 0.3);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <h1 class="email-header h1" style="color: #ffffff; margin: 0; font-size: 42px; font-weight: 900; letter-spacing: 3px; font-family: Arial, Helvetica, sans-serif; text-transform: uppercase; line-height: 1.2;">L9 Tools</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <p class="email-header p" style="color: #FFD369; font-size: 20px; margin: 0; font-weight: 700; letter-spacing: 2px; font-family: Arial, Helvetica, sans-serif;">Boss Timers & Guild Tools for Lord Nine</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p class="email-header p" style="color: #ffffff; font-size: 16px; margin: 0; font-weight: 500; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif; opacity: 0.9;">Track boss spawns, get map locations, and send Discord reports to your guild</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-content" style="background-color: #000000; padding: 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color: rgba(108, 99, 255, 0.2); border: 1px solid #6C63FF; border-radius: 4px; padding: 10px 20px;">
                          <span style="color: #00e5ff; font-size: 13px; font-weight: 700; letter-spacing: 1px; font-family: Arial, Helvetica, sans-serif;">System Status: Operational</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px;">
                <tr>
                  <td class="email-padding" style="background-color: rgba(108, 99, 255, 0.1); padding: 0; border: 3px solid #6C63FF; border-radius: 8px; box-shadow: 0 0 20px rgba(108, 99, 255, 0.3);">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="background-color: #6C63FF; padding: 25px 25px; text-align: center; border-top-left-radius: 5px; border-top-right-radius: 5px;">
                          <p style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0 0 8px 0; letter-spacing: 2px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">👑 1 Month Temporary Pro Access 👑</p>
                          <p style="color: #FFD369; font-size: 16px; font-weight: 700; margin: 0; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">All Returning Users Receive</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: rgba(13, 15, 24, 0.8); padding: 25px; text-align: center; border-left: 4px solid #6C63FF;">
                          <p style="color: #ffffff; font-size: 16px; line-height: 1.7; margin: 0; font-weight: 600; font-family: Arial, Helvetica, sans-serif; letter-spacing: 0.3px;">Enjoy unlimited boss reports, ad-free experience, and cloud sync across all devices. Your temporary Pro tier will be activated automatically when you sign in.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: rgba(108, 99, 255, 0.2); padding: 12px 25px; border-bottom-left-radius: 5px; border-bottom-right-radius: 5px; border-top: 2px solid #6C63FF; text-align: center;">
                          <p style="color: #00e5ff; font-size: 13px; font-weight: 700; margin: 0; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, Helvetica, sans-serif;">⚡ Auto-Activated on Sign In ⚡</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 30px; padding-top: 25px; border-top: 1px solid rgba(108, 99, 255, 0.2);">
                <tr>
                  <td align="center">
                    <p style="color: #9e9e9e; font-size: 14px; margin: 0; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">Ready for your next quest,<br><strong style="color: #6C63FF; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;">The L9 Tools Guild</strong></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-padding" style="background-color: #0D0F18; padding: 25px 30px; text-align: center; border-top: 1px solid rgba(108, 99, 255, 0.2);">
              <p class="email-text-small" style="color: #757575; font-size: 13px; margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif;">Return to your headquarters:</p>
              <a href="https://www.l9tools.online" style="color: #6C63FF; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif;">www.l9tools.online</a>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(108, 99, 255, 0.1);">
                <tr>
                  <td align="center">
                    <p class="email-text-small" style="color: #757575; font-size: 11px; margin: 0 0 10px 0; line-height: 1.6; font-family: Arial, Helvetica, sans-serif;">You're receiving this email because you have an L9 Tools account.</p>
                    <p class="email-text-small" style="color: #555; font-size: 11px; margin: 0; letter-spacing: 0.3px; font-family: Arial, Helvetica, sans-serif;">© 2025 L9 Tools | Lord Nine Infinite Class</p>
                    <p class="email-text-small" style="color: #555; font-size: 11px; margin: 10px 0 0 0; font-family: Arial, Helvetica, sans-serif;"><a href="https://www.l9tools.online/unsubscribe" style="color: #6C63FF; text-decoration: underline;">Unsubscribe</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
  const [htmlContent, setHtmlContent] = useState(defaultEmailTemplate);
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'html'>('preview');

  // Load template from database when dialog opens
  useEffect(() => {
    if (isOpen && !isLoadingTemplate) {
      setIsLoadingTemplate(true);
      getEmailTemplate('bulk_email_default').then((result) => {
        if (result.success && result.template) {
          setSubject(result.template.subject);
          setHtmlContent(result.template.html_content);
        } else {
          // Fallback to default template if not found or error
          // Keep current default values
        }
        setIsLoadingTemplate(false);
      }).catch((error) => {
        console.error('[Email Dialog] Error loading template:', error);
        setIsLoadingTemplate(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Create iframe source for email preview
  const emailPreviewSrc = useMemo(() => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; }
    iframe { border: none; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
    return `data:text/html;charset=utf-8,${encodeURIComponent(fullHtml)}`;
  }, [htmlContent]);

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please enter a test email address.',
      });
      return;
    }

    if (!subject.trim() || !htmlContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in both subject and content fields before testing.',
      });
      return;
    }

    setIsSendingTest(true);
    const result = await sendTestEmail(testEmail, subject, htmlContent);
    
    if (result.success) {
      toast({
        title: 'Test Email Sent!',
        description: result.message || `Test email sent to ${testEmail}`,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Sending Test Email',
        description: result.message || 'Failed to send test email. Please try again.',
      });
    }
    setIsSendingTest(false);
  };

  const handleSaveTemplate = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in both subject and content fields before saving.',
      });
      return;
    }

    setIsSavingTemplate(true);
    const result = await saveEmailTemplate(htmlContent, subject, 'bulk_email_default');
    
    if (result.success) {
      toast({
        title: 'Template Saved!',
        description: result.message || 'Email template saved successfully.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Saving Template',
        description: result.message || 'Failed to save email template. Please try again.',
      });
    }
    setIsSavingTemplate(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in both subject and content fields.',
      });
      return;
    }

    setIsSending(true);
    const result = await sendBulkEmailToAllUsers(subject, htmlContent);
    
    if (result.success) {
      toast({
        title: 'Emails Sent Successfully!',
        description: `Successfully sent ${result.sent} out of ${result.total} emails.${(result.failed ?? 0) > 0 ? ` ${result.failed} failed.` : ''}`,
      });
      // Don't reset form - keep template as is
      onClose();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error Sending Emails',
        description: result.message || 'Failed to send emails. Please try again.',
      });
    }
    setIsSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl lg:max-w-7xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Email to All Users
          </DialogTitle>
          <DialogDescription>
            Send a bulk email notification to all registered users. This action is admin-only.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              disabled={isSending || isSendingTest}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="testEmail">
              Test Email Address <span className="text-muted-foreground text-xs">(optional, for testing)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your-email@example.com"
                disabled={isSending || isSendingTest}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSendTest}
                disabled={isSending || isSendingTest || !testEmail.trim() || !subject.trim() || !htmlContent.trim()}
                className="gap-2"
              >
                {isSendingTest ? (
                  <>
                    <Loader className="h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Send a test email to verify the content before sending to all users.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Email Content</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate || isLoadingTemplate || isSending || isSendingTest || !subject.trim() || !htmlContent.trim()}
                className="gap-2"
              >
                {isSavingTemplate ? (
                  <>
                    <Loader className="h-3 w-3" />
                    Saving...
                  </>
                ) : isLoadingTemplate ? (
                  <>
                    <Loader className="h-3 w-3" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3" />
                    Save Template
                  </>
                )}
              </Button>
            </div>
            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'preview' | 'html')}>
              <TabsList className="h-9 mb-2">
                <TabsTrigger value="preview" className="text-xs px-4">
                  <Eye className="h-3 w-3 mr-1.5" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="html" className="text-xs px-4">
                  <Code className="h-3 w-3 mr-1.5" />
                  HTML Code
                </TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="mt-2 space-y-2">
                <div className="border border-border rounded-lg overflow-hidden bg-[#f4f4f4] shadow-sm">
                  <iframe
                    src={emailPreviewSrc}
                    className="w-full"
                    style={{
                      height: '600px',
                      border: 'none',
                      display: 'block',
                      background: '#f4f4f4',
                    }}
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This is exactly how your email will appear to recipients. Send a test email to verify before sending to all users.
                </p>
              </TabsContent>
              <TabsContent value="html" className="mt-2 space-y-2">
                <Textarea
                  id="content"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Enter HTML email content"
                  className="min-h-[600px] font-mono text-sm"
                  disabled={isSending || isSendingTest}
                />
                <p className="text-xs text-muted-foreground">
                  Edit the HTML code directly. Switch to Preview tab to see how it will look to recipients.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending || isSendingTest}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || isSendingTest || !subject.trim() || !htmlContent.trim()}
          >
            {isSending ? (
              <>
                <Loader className="h-4 w-4 mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send to All Users
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
