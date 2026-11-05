import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { User, Lock, Camera } from 'lucide-react';
// Profile components
import { useForm, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
// import DeleteUser from '@/components/delete-user';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/utils/image-helper';
import { toast } from '@/components/custom-toast';

export default function ProfileSettings({ mustVerifyEmail, status }: { mustVerifyEmail?: boolean; status?: string }) {
  const { t } = useTranslation();
  const { auth } = usePage<SharedData>().props;
  const [activeSection, setActiveSection] = useState('profile');

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Profile Settings') },
  ];

  const sidebarNavItems: NavItem[] = [
    {
      title: t('Profile'),
      href: '#profile',
      icon: <User className="h-4 w-4 mr-2" />,
    },
    {
      title: t('Password'),
      href: '#password',
      icon: <Lock className="h-4 w-4 mr-2" />,
    },
  ];

  // Refs for each section
  const profileRef = useRef<HTMLDivElement>(null);
  const passwordRef = useRef<HTMLDivElement>(null);

  // Password form refs
  const passwordInput = useRef<HTMLInputElement>(null);
  const currentPasswordInput = useRef<HTMLInputElement>(null);

  // Profile form
  const { data: profileData, setData: setProfileData, post: profilePost, errors: profileErrors, processing: profileProcessing, recentlySuccessful: profileRecentlySuccessful } = useForm({
    name: auth?.user?.name || '',
    email: auth?.user?.email || '',
    avatar: null as File | null,
    _method: 'PATCH',
  });

  // Password form
  const { data: passwordData, setData: setPasswordData, errors: passwordErrors, put: passwordPut, reset: passwordReset, processing: passwordProcessing, recentlySuccessful: passwordRecentlySuccessful } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // Handle profile form submission
  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    profilePost(route('profile.update'), {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: (page: any) => {
        // Reset avatar file input after successful upload
        setProfileData('avatar', null);
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Profile updated successfully.'));
        }
        // Reload page to refresh user data
        window.location.reload();
      },
      onError: (errors: any) => {
        const errorMessage = (errors && Object.values(errors).join(', ')) || t('Failed to update profile');
        toast.error(errorMessage);
      }
    });
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileData('avatar', file);
    }
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    // Show preview of selected file
    if (profileData.avatar) {
      return URL.createObjectURL(profileData.avatar);
    }
    // Show uploaded avatar from database
    if (auth?.user?.avatar) {
      return auth.user.avatar;
    }
    // Show default avatar
    return '/images/avatar/avatar.png';
  };

  // Handle password form submission
  const updatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    passwordPut(route('password.update'), {
      preserveScroll: true,
      onSuccess: (page: any) => {
        passwordReset();
        if (page?.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else if (page?.props?.flash?.error) {
          toast.error(t(page.props.flash.error));
        } else {
          toast.success(t('Password updated successfully.'));
        }
      },
      onError: (errors: any) => {
        if (errors.password) {
          passwordReset('password', 'password_confirmation');
          passwordInput.current?.focus();
        }
        if (errors.current_password) {
          passwordReset('current_password');
          currentPasswordInput.current?.focus();
        }
        const errorMessage = (errors && Object.values(errors).join(', ')) || t('Failed to update password');
        toast.error(errorMessage);
      },
    });
  };

  // Smart scroll functionality
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 1024) {
        return;
      }

      const scrollPosition = window.scrollY + 100; // Add offset for better UX

      // Get positions of each section
      const profilePosition = profileRef.current?.offsetTop || 0;
      const passwordPosition = passwordRef.current?.offsetTop || 0;

      // Determine active section based on scroll position
      if (scrollPosition >= passwordPosition) {
        setActiveSection('password');
      } else {
        setActiveSection('profile');
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Initial check for hash in URL
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(hash);
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle navigation click
  const handleNavClick = (href: string) => {
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <PageTemplate
      title={t("Profile Settings")}
      url="/profile"
      breadcrumbs={breadcrumbs}
      description={t("Manage your profile settings.")}
    >
      {/* Mobile: horizontal scrollable button row */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 lg:hidden">
        {sidebarNavItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            size="sm"
            className={cn('shrink-0 whitespace-nowrap text-xs', {
              'bg-muted font-semibold': activeSection === item.href.replace('#', ''),
            })}
            onClick={() => handleNavClick(item.href)}
          >
            {item.icon}
            {item.title}
          </Button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Desktop sidebar */}
        <div className="hidden lg:block w-56 xl:w-60 shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-lg border shadow p-3 sticky top-4 gap-2 flex flex-col">
            {sidebarNavItems.map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                className={cn('w-full justify-start text-sm h-auto py-2 px-3', {
                  'bg-muted font-semibold': activeSection === item.href.replace('#', ''),
                })}
                onClick={() => handleNavClick(item.href)}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="whitespace-normal text-left leading-tight">{item.title}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Profile Section */}
          <section id="profile" ref={profileRef}>
            <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-medium mb-1">{t("Profile Information")}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t("Update your account's profile information and email address")}
              </p>

              <form id="profile-form" onSubmit={submitProfile} className="space-y-6">
                {/* Avatar Upload Section */}
                <div className="flex items-center space-x-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={getAvatarUrl()} alt={auth?.user?.name || 'Avatar'} />
                    <AvatarFallback className="text-lg">
                      <img src={getImageUrl('/storage/media/avatars/avatar.png')} alt={auth?.user?.name} />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="avatar" className="cursor-pointer inline-flex items-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md font-medium text-sm transition-colors">
                      <Camera className="h-4 w-4 mr-2" />
                      {t("Change Avatar")}
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("JPG, PNG, GIF up to 2MB")}
                    </p>
                  </div>
                </div>
                <InputError className="mt-2" message={profileErrors.avatar} />

                <div className="grid gap-2">
                  <Label htmlFor="name">
                    {t("Name")}
                  </Label>
                  <Input
                    id="name"
                    className="mt-1 block w-full"
                    value={profileData.name}
                    onChange={(e) => setProfileData('name', e.target.value)}
                    required
                    autoComplete="name"
                    placeholder={t("Full name")}
                  />
                  <InputError className="mt-2" message={profileErrors.name} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">
                    {t("Email address")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="mt-1 block w-full"
                    value={profileData.email}
                    onChange={(e) => setProfileData('email', e.target.value)}
                    required
                    autoComplete="username"
                    placeholder={t("Email address")}
                  />
                  <InputError className="mt-2" message={profileErrors.email} />
                </div>

                {mustVerifyEmail && auth?.user?.email_verified_at === null && (
                  <div>
                    <p className="text-muted-foreground -mt-4 text-sm">
                      {t("Your email address is unverified.")}{' '}
                      <button
                        type="button"
                        onClick={() => route('verification.send')}
                        className="text-foreground decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500"
                      >
                        {t("Click here to resend the verification email.")}
                      </button>
                    </p>

                    {status === 'verification-link-sent' && (
                      <div className="mt-2 text-sm font-medium text-green-600">
                        {t("A new verification link has been sent to your email address.")}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button disabled={profileProcessing}>{t("Save")}</Button>
                  <Transition
                    show={profileRecentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                  >
                    <p className="text-sm text-neutral-600">{t("Saved")}</p>
                  </Transition>
                </div>
              </form>
            </div>
          </section>

          {/* Password Section */}
          <section id="password" ref={passwordRef}>
            <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-medium mb-1">{t("Update Password")}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t("Ensure your account is using a long, random password to stay secure")}
              </p>

              <form id="password-form" onSubmit={updatePassword} className="space-y-6">
                <div className="grid gap-2">
                  <Label htmlFor="current_password" required>
                    {t("Current password")}
                  </Label>
                  <Input
                    id="current_password"
                    ref={currentPasswordInput}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData('current_password', e.target.value)}
                    type="password"
                    className="mt-1 block w-full"
                    autoComplete="current-password"
                    placeholder={t("Current password")}
                  />
                  <InputError message={passwordErrors.current_password} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password" required>
                    {t("New password")}
                  </Label>
                  <Input
                    id="password"
                    ref={passwordInput}
                    value={passwordData.password}
                    onChange={(e) => setPasswordData('password', e.target.value)}
                    type="password"
                    className="mt-1 block w-full"
                    autoComplete="new-password"
                    placeholder={t("New password")}
                  />
                  <InputError message={passwordErrors.password} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password_confirmation" required>
                    {t("Confirm password")}
                  </Label>
                  <Input
                    id="password_confirmation"
                    value={passwordData.password_confirmation}
                    onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                    type="password"
                    className="mt-1 block w-full"
                    autoComplete="new-password"
                    placeholder={t("Confirm password")}
                  />
                  <InputError message={passwordErrors.password_confirmation} />
                </div>

                <div className="flex items-center gap-4">
                  <Button disabled={passwordProcessing}>{t("Save")}</Button>
                  <Transition
                    show={passwordRecentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                  >
                    <p className="text-sm text-neutral-600">{t("Saved")}</p>
                  </Transition>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </PageTemplate>
  );
}