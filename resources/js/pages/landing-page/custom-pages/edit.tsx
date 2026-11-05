import React, { useState, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Toaster } from '@/components/ui/toaster';
import InputError from '@/components/input-error';
import axios from 'axios';

interface CustomPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
  sort_order: number;
}

interface PageProps {
  page: CustomPage;
  globalSettings?: any;
}

export default function EditCustomPage() {
  const { t } = useTranslation();
  const { page, globalSettings } = usePage<PageProps>().props;

  const [formData, setFormData] = useState({
    title: page?.title || '',
    slug: page?.slug || '',
    content: page?.content || '',
    meta_title: page?.meta_title || '',
    meta_description: page?.meta_description || '',
    is_active: page ? Boolean(page.is_active) : true,
    sort_order: page?.sort_order || 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [slugValidation, setSlugValidation] = useState<{ loading: boolean; available: boolean | null; message: string }>({
    loading: false,
    available: null,
    message: ''
  });
  const [slugCheckTimeout, setSlugCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const checkSlugAvailability = async (slug: string, excludeId?: number) => {
    if (!slug.trim()) {
      setSlugValidation({ loading: false, available: null, message: '' });
      return;
    }

    if (slugCheckTimeout) {
      clearTimeout(slugCheckTimeout);
    }

    setSlugValidation({ loading: true, available: null, message: '' });

    const timeout = setTimeout(async () => {
      try {
        const response = await axios.post(route('api.custom-pages.check-slug'), {
          slug: slug.trim(),
          exclude_id: excludeId
        });

        setSlugValidation({
          loading: false,
          available: response.data.available,
          message: response.data.available ? t('Slug is available') : t('Slug is already taken')
        });
      } catch (error) {
        setSlugValidation({ loading: false, available: null, message: t('Error checking slug') });
      }
    }, 500);

    setSlugCheckTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (slugCheckTimeout) {
        clearTimeout(slugCheckTimeout);
      }
    };
  }, [slugCheckTimeout]);

  const generateSlugFromTitle = async (excludeId?: number) => {
    if (!formData.title.trim()) return;

    try {
      const response = await axios.post(route('api.custom-pages.generate-slug'), {
        title: formData.title.trim(),
        exclude_id: excludeId
      });

      setFormData((prev) => ({ ...prev, slug: response.data.slug }));
      setSlugValidation({ loading: false, available: true, message: t('Generated unique slug') });
    } catch (error) {
      console.error('Error generating slug:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (slugValidation.available === false) {
      toast.error(t('Please choose a different slug as the current one is already taken.'));
      return;
    }

    setProcessing(true);
    if (!globalSettings?.is_demo) {
      toast.loading(t('Updating page...'));
    }

    router.put(route('landing-page.custom-pages.update', page.id), formData, {
      onSuccess: (res: any) => {
        setProcessing(false);
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        if (res?.props?.flash?.success) {
          toast.success(t(res.props.flash.success));
        } else if (res?.props?.flash?.error) {
          toast.error(t(res.props.flash.error));
        }
      },
      onError: (errs) => {
        setProcessing(false);
        if (!globalSettings?.is_demo) {
          toast.dismiss();
        }
        setErrors(errs);
        if (typeof errs === 'object' && errs !== null) {
          const errorMessages = Object.values(errs).flat();
          errorMessages.forEach((error) => {
            toast.error(t(error as string));
          });
        } else if (typeof errs === 'string') {
          toast.error(t(errs));
        } else {
          toast.error(t('Failed to update page'));
        }
      }
    });
  };

  const handleCancel = () => {
    router.get(route('landing-page.custom-pages.index'));
  };

  return (
    <PageTemplate
      title={t('Edit Custom Page')}
      url={`/custom-pages/${page?.id}/edit`}
      description={t('Edit an existing custom page.')}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Landing Page'), href: route('landing-page.settings') },
        { title: t('Custom Pages'), href: route('landing-page.custom-pages.index') },
        { title: t('Edit') }
      ]}
      actions={[
        {
          label: t('Back'),
          icon: <ArrowLeft className="h-4 w-4" />,
          variant: 'outline',
          onClick: handleCancel
        }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Page Information')}</CardTitle>
          <CardDescription>{t('Update your custom page content and settings')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit} className="space-y-6">
            {/* Page Title */}
            <div className="space-y-2">
              <Label htmlFor="title" required>
                {t('Page Title')}
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                placeholder={t('About Us')}
                aria-invalid={!!errors.title}
                className="w-full"
              />
              <InputError message={errors.title} />
              <p className="text-xs text-muted-foreground">
                {t('The title will be used to automatically generate the URL slug')}
              </p>
            </div>

            {/* Page Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">{t('Page Slug (URL)')}</Label>
              <div className="flex space-x-2">
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, slug: val });
                    if (val && val !== page?.slug) {
                      checkSlugAvailability(val, page?.id);
                    } else {
                      setSlugValidation({ loading: false, available: null, message: '' });
                    }
                    if (errors.slug) setErrors({ ...errors, slug: '' });
                  }}
                  placeholder="about-us"
                  className={
                    slugValidation.available === false
                      ? 'border-red-500'
                      : slugValidation.available === true
                        ? 'border-green-500'
                        : ''
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => generateSlugFromTitle(page?.id)}
                  disabled={!formData.title}
                >
                  {t('Generate')}
                </Button>
              </div>
              <div className="mt-1">
                <p className="text-sm text-gray-500">
                  {t('URL')}: {typeof window !== 'undefined' ? window.location.origin : ''}/page/{formData.slug || 'your-slug'}
                </p>
                {slugValidation.loading && <p className="text-sm text-blue-600">{t('Checking availability...')}</p>}
                {slugValidation.available === true && <p className="text-sm text-green-600">✓ {t('Slug is available')}</p>}
                {slugValidation.available === false && <p className="text-sm text-red-600">✗ {t('Slug is already taken')}</p>}
              </div>
              <InputError message={errors.slug} />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content" required>
                {t('Content')}
              </Label>
              <div className="min-h-[300px]">
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => {
                    setFormData({ ...formData, content });
                    if (errors.content) setErrors({ ...errors, content: '' });
                  }}
                  placeholder={t('Page content...')}
                  className="min-h-[200px]"
                  aria-invalid={!!errors.content}
                />
              </div>
              <InputError message={errors.content} />
              <p className="text-xs text-muted-foreground">
                {t('Use the editor toolbar to format your content with headings, lists, links, and more')}
              </p>
            </div>

            {/* SEO Section */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">{t('SEO Settings')}</h3>

              <div className="space-y-2">
                <Label htmlFor="meta_title">{t('Meta Title (SEO)')}</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder={t('SEO title')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">{t('Meta Description (SEO)')}</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder={t('SEO description')}
                  rows={3}
                />
              </div>
            </div>

            {/* Publish Settings */}
            {/* <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">{t('Active')}</Label>
              </div>
            </div> */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">{t('Publish Settings')}</h3>

              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <div className="flex-1">
                  <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                    {t('Publish Page')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.is_active
                      ? t('This page will be visible to the public immediately')
                      : t('This page will be saved as a draft and hidden from public view')}
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={processing}>
                {t('Update Page')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Toaster />
    </PageTemplate>
  );
}

