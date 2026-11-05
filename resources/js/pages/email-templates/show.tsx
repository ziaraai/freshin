import { useState, useEffect } from 'react'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { PageTemplate } from '@/components/page-template'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { RichTextField } from '@/components/ui/rich-text-field'
import { Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/custom-toast'
import InputError from '@/components/input-error'

interface EmailTemplateLang {
  id: number
  lang: string
  subject: string
  content: string
}

interface EmailTemplate {
  id: number
  name: string
  from: string
  email_template_langs: EmailTemplateLang[]
}

interface Language {
  code: string
  name: string
  countryCode: string
}

interface Props {
  template: EmailTemplate
  languages: Language[]
  variables: Record<string, string>
}

export default function EmailTemplateShow({ template, languages, variables }: Props) {
  const { t } = useTranslation()
  const { errors } = usePage().props as any
  const [fromName, setFromName] = useState(template.from)
  const [currentLang, setCurrentLang] = useState(languages[0]?.code || 'en')
  const [templateLangs, setTemplateLangs] = useState(() => {
    const langData = {} as Record<string, { subject: string; content: string }>
    
    // Initialize all languages with empty or existing data
    languages.forEach(language => {
      const existingLang = template.email_template_langs.find(tl => tl.lang === language.code)
      langData[language.code] = {
        subject: existingLang?.subject || '',
        content: existingLang?.content || ''
      }
    })
    
    return langData
  })

  const handleSubjectChange = (lang: string, subject: string) => {
    setTemplateLangs(prev => ({
      ...prev,
      [lang]: { 
        subject,
        content: prev[lang]?.content || ''
      }
    }))
  }

  const handleContentChange = (lang: string, content: string) => {
    setTemplateLangs(prev => ({
      ...prev,
      [lang]: { 
        subject: prev[lang]?.subject || '',
        content
      }
    }))
  }

  const handleSave = () => {
    // alert('Save functionality will be implemented later')
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Email Templates'), href: route('email-templates.index') },
    { title: template.name }
  ]

  const pageActions: any[] = []

  return (
    <PageTemplate
      title={template.name}
      url={route('email-templates.show', template.id)}
      breadcrumbs={breadcrumbs}
      actions={pageActions}
      backUrl={route('email-templates.index')}
      description={t("Edit email template settings and content.")}
    >
      <Head title={`Edit Template - ${template.name}`} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">{t("Template Settings")}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t("Configure your email template")}</p>
                </div>
                <Button 
                  onClick={() => {
                    router.put(route('email-templates.update-settings', template.id), {
                      from: fromName
                    }, {
                      onSuccess: (page: any) => {
                        if (page.props.flash?.success) {
                          toast.success(t(page.props.flash.success));
                        } else if (page.props.flash?.error) {
                          toast.error(t(page.props.flash.error));
                        }
                      },
                      onError: (errors: any) => {
                        toast.error(t('Failed to update template settings'));
                      }
                    })
                  }}
                  size="sm"
                  className="w-full sm:w-auto shrink-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t("Save")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form noValidate className="space-y-4 sm:space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-1.5 mb-2 sm:mb-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium text-xs sm:text-sm">{t("Template Name")}</Label>
                    <Badge variant="secondary" className="text-[11px] sm:text-xs">{t("System Template")}</Badge>
                  </div>
                  <Input value={template.name} disabled className="bg-muted font-medium text-sm" />
                  <p className="text-[11px] sm:text-xs text-muted-foreground">{t("This is a system template and cannot be renamed")}</p>
                </div>

                <div className="grid gap-1.5 mb-2 sm:mb-4">
                  <Label htmlFor="from" required className="font-medium text-xs sm:text-sm">{t("Sender Name")}</Label>
                  <Input
                    id="from"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder={t("e.g., WhatsStore Support, Your Store Name")}
                    className="focus:ring-2 focus:ring-primary text-sm"
                    aria-invalid={!!errors.from}
                  />
                  <InputError message={errors.from} />
                  <p className="text-[11px] sm:text-xs text-muted-foreground">{t("This name will appear as the email sender")}</p>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">{t("Multi-Language Content")}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {t("Edit email content in multiple languages")}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    const currentContent = templateLangs[currentLang]
                    if (currentContent) {
                      router.put(route('email-templates.update-content', template.id), {
                        lang: currentLang,
                        subject: currentContent.subject,
                        content: currentContent.content
                      }, {
                        onSuccess: (page: any) => {
                          if (page.props.flash?.success) {
                            toast.success(t(page.props.flash.success));
                          } else if (page.props.flash?.error) {
                            toast.error(t(page.props.flash.error));
                          }
                        },
                        onError: (errors: any) => {
                          toast.error(t('Failed to update template content'));
                        }
                      })
                    }
                  }}
                  size="sm"
                  className="w-full sm:w-auto shrink-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t("Save Content")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <Tabs defaultValue={languages[0]?.code} onValueChange={setCurrentLang} className="w-full">
                <div className="mb-4 sm:mb-6">
                  <Label className="text-xs sm:text-sm font-medium mb-2.5 block">{t("Choose Language to Edit")}</Label>
                  <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 w-full h-auto p-0 bg-transparent">
                    {languages.map((language) => (
                      <TabsTrigger 
                        key={language.code} 
                        value={language.code} 
                        className="w-full flex flex-col items-center p-2.5 sm:p-3 border-2 border-muted data-[state=active]:border-primary data-[state=active]:bg-primary/5 rounded-lg hover:border-primary/50 transition-all duration-200 min-h-[56px] sm:min-h-[60px] justify-center"
                      >
                        <span className="text-xs font-bold text-primary">{language.code.toUpperCase()}</span>
                        <span className="text-[11px] text-muted-foreground mt-0.5 text-center leading-tight truncate max-w-full px-1">{language.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                
                {languages.map((language) => (
                  <TabsContent key={language.code} value={language.code} className="space-y-6 mt-0">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Badge variant="default" className="text-xs px-2 py-0.5">
                            {language.code.toUpperCase()}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{language.name}</h3>
                          <p className="text-xs text-muted-foreground">{t("Editing content for {{language}}", { language: language.name })}</p>
                        </div>
                      </div>
                    </div>

                    <form noValidate className="grid gap-6" onSubmit={(e) => e.preventDefault()}>
                      <div className="grid gap-1 mb-4">
                        <Label htmlFor={`subject-${language.code}`} required className="text-sm font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          {t("Email Subject Line")}
                        </Label>
                        <Input
                          id={`subject-${language.code}`}
                          value={templateLangs[language.code]?.subject || ''}
                          onChange={(e) => handleSubjectChange(language.code, e.target.value)}
                          placeholder={t("Enter a compelling subject line...")}
                          className="focus:ring-2 focus:ring-primary text-base"
                          aria-invalid={!!errors.subject}
                        />
                        <InputError message={errors.subject} />
                      </div>

                      <div className="grid gap-1 mb-4">
                        <Label required className="text-sm font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          {t("Email Body Content")}
                        </Label>
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-1">
                          <RichTextField
                            label=""
                            value={templateLangs[language.code]?.content || ''}
                            onChange={(content) => handleContentChange(language.code, content)}
                            placeholder={t("Write your email message here. Use variables from the sidebar to personalize...")}
                            className="min-h-[320px] border-0"
                          />
                        </div>
                        <InputError message={errors.content} />
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                          <p className="text-xs text-amber-800 flex items-center gap-2">
                            <span>💡</span>
                            {t("Pro tip: Click variables in the sidebar to copy them instantly")}
                          </p>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-sm lg:sticky lg:top-6">
            <CardHeader className="bg-muted/30 border-b p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base font-semibold">{t("Dynamic Variables")}</CardTitle>
                <Badge variant="outline" className="text-xs font-medium">
                  {Object.keys(variables).length} {t("available")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {t("Click any variable below to copy it instantly")}
              </p>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {Object.entries(variables).map(([variable, description]) => (
                  <div 
                    key={variable} 
                    className="group relative p-2.5 sm:p-3 bg-muted/20 hover:bg-muted/40 rounded-md border hover:border-primary/30 cursor-pointer transition-all duration-200"
                    onClick={() => {
                      navigator.clipboard.writeText(variable)
                      toast.success(t('Copied: {{variable}}', { variable }))
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <code className="text-xs font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border break-all">
                          {variable}
                        </code>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {description}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Badge variant="secondary" className="text-[11px] px-1.5 py-0.5">
                          {t("Copy")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-md">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5 text-sm">💡</span>
                  <div>
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-300">{t("How it works")}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                      {t("Variables are automatically replaced with real data when emails are sent to customers.")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  )
}