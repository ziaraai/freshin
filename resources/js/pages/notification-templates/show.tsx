import { useState } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { PageTemplate } from '@/components/page-template'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Save, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/custom-toast'
import InputError from '@/components/input-error'

interface NotificationTemplateLang {
  id: number
  lang: string
  content: string
  variables: string
}

interface NotificationTemplate {
  id: number
  type: string
  action: string
  status: 'on' | 'off'
  template_langs: NotificationTemplateLang[]
}

interface Language {
  code: string
  name: string
  countryCode: string
}

interface Props {
  notification: NotificationTemplate
  languages: Language[]
}

export default function NotificationTemplateShow({ notification, languages }: Props) {
  const { t } = useTranslation()
  const { errors } = usePage().props as any
  const [status, setStatus] = useState(notification.status)
  const [currentLang, setCurrentLang] = useState(languages[0]?.code || 'en')
  const [templateLangs, setTemplateLangs] = useState(() => {
    const langData = {} as Record<string, string>
    
    // Initialize all languages with empty or existing data
    languages.forEach(language => {
      const existingLang = notification.template_langs.find(tl => tl.lang === language.code)
      langData[language.code] = existingLang?.content || ''
    })
    
    return langData
  })

  const variables = notification.template_langs[0]?.variables 
    ? JSON.parse(notification.template_langs[0].variables) 
    : {}

  const handleContentChange = (lang: string, content: string) => {
    setTemplateLangs(prev => ({
      ...prev,
      [lang]: content
    }))
  }

  const handleSave = () => {
    const templatesArray = languages.map(language => ({
      lang: language.code,
      content: templateLangs[language.code] || ''
    }))

    router.put(route('notification-templates.update', notification.id), {
      status,
      templates: templatesArray
    }, {
      onSuccess: (page: any) => {
        if (page.props.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page.props.flash?.error) {
          toast.error(t(page.props.flash.error));
        }
      },
      onError: (errors: any) => {
        const errorMessage = (errors && Object.values(errors).join(', ')) || t('Failed to update template');
        toast.error(errorMessage);
      }
    })
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Notification Templates'), href: route('notification-templates.index') },
    { title: notification.action }
  ]

  const pageActions: any[] = []

  return (
    <PageTemplate
      title={notification.action}
      url={route('notification-templates.show', notification.id)}
      breadcrumbs={breadcrumbs}
      actions={pageActions}
      backUrl={route("notification-templates.index")}
      description={t("Edit notification template settings and content.")}
    >
      <Head title={`Edit Template - ${notification.action}`} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">{t("Template Settings")}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t("Configure your SMS template")}</p>
                </div>
                <Button 
                  onClick={handleSave}
                  size="sm"
                  className="w-full sm:w-auto shrink-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t("Save")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form noValidate className="space-y-4 sm:space-y-6">
                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium text-xs sm:text-sm">{t("Template Name")}</Label>
                    <Badge variant="secondary" className="text-[11px] sm:text-xs">{t("System Template")}</Badge>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-muted rounded-md font-medium text-xs sm:text-sm">{notification.action}</div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">{t("This is a system template and cannot be renamed")}</p>
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="status" className="font-medium text-xs sm:text-sm">{t("Status")}</Label>
                    <Switch
                      id="status"
                      checked={status === 'on'}
                      onCheckedChange={(checked) => setStatus(checked ? 'on' : 'off')}
                    />
                  </div>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">{t("Enable or disable this notification template")}</p>
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
                    {t("Edit SMS content in multiple languages")}
                  </p>
                </div>
                <Button 
                  onClick={handleSave}
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
                  <TabsContent key={language.code} value={language.code} className="space-y-4 sm:space-y-6 mt-0">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <Badge variant="default" className="text-xs px-2 py-0.5">
                            {language.code.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-xs sm:text-sm">{language.name}</h3>
                          <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{t("Editing SMS content for {{language}}", { language: language.name })}</p>
                        </div>
                      </div>
                    </div>

                    <form noValidate className="grid gap-4 sm:gap-6">
                      <div className="grid gap-1.5">
                        <Label required className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                          {t("SMS Message Content")}
                        </Label>
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-1">
                          <Textarea
                            value={templateLangs[language.code] || ''}
                            onChange={(e) => handleContentChange(language.code, e.target.value)}
                            placeholder={t("Write your SMS message here. Use variables from the sidebar to personalize...")}
                            className="min-h-[160px] sm:min-h-[200px] border-0 font-mono text-xs sm:text-sm"
                            aria-invalid={!!(errors[`templates.${languages.findIndex(l => l.code === language.code)}.content`] || errors.content)}
                          />
                        </div>
                        <InputError message={errors[`templates.${languages.findIndex(l => l.code === language.code)}.content`] || errors.content} />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-1">
                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-md p-2.5 flex-1">
                            <p className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                              <span className="shrink-0">💡</span>
                              {t("Pro tip: Keep SMS messages under 160 characters for best delivery")}
                            </p>
                          </div>
                          <div className="text-[11px] sm:text-xs text-muted-foreground text-right shrink-0">
                            {t('Characters')}: {(templateLangs[language.code] || '').length}/160
                          </div>
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
                {Object.entries(variables).map(([key, variable]) => (
                  <div 
                    key={key} 
                    className="group relative p-2.5 sm:p-3 bg-muted/20 hover:bg-muted/40 rounded-md border hover:border-primary/30 cursor-pointer transition-all duration-200"
                    onClick={() => {
                      navigator.clipboard.writeText(`{${variable}}`)
                      toast.success(t('Copied: {{variable}}', { variable: `{${variable}}` }))
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <code className="text-xs font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded border break-all">
                          {`{${variable}}`}
                        </code>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                          {key}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
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
                      {t("Variables are automatically replaced with real data when SMS messages are sent.")}
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