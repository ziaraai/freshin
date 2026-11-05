import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import { Upload, Search, X, Plus, Info, Copy, Download, MoreHorizontal, Image as ImageIcon, Calendar, HardDrive, BarChart3, FileText, File, Eye } from 'lucide-react';
import { getImageUrl } from '@/utils/image-helper';
import { hasPermission } from '@/utils/authorization';

interface MediaItem {
  id: number;
  name: string;
  file_name: string;
  url: string;
  thumb_url: string;
  size: number;
  mime_type: string;
  created_at: string;
}

export default function MediaLibraryDemo() {
  const { t } = useTranslation();
  const { csrf_token, auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const canUploadMedia = hasPermission(permissions, 'upload-media');
  const canDeleteMedia = hasPermission(permissions, 'delete-media');
  const canDownloadMedia = hasPermission(permissions, 'download-media');
  const canView = true;
  const canDelete = canDeleteMedia;
  const canDownload = canDownloadMedia;
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedMediaInfo, setSelectedMediaInfo] = useState<MediaItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isChatGptOpen, setIsChatGptOpen] = useState(false);
  useEffect(() => {
    const checkChatGpt = () => {
      const chatGptModal = document.querySelector('[data-chatgpt-modal]');
      setIsChatGptOpen(!!chatGptModal);
    };
    const observer = new MutationObserver(checkChatGpt);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  const itemsPerPage = 12;

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(route('api.media.index'), {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMedia(data);
      setFilteredMedia(data);
    } catch (error) {
      console.error('Failed to load media:', error);
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);



  useEffect(() => {
    const filtered = media.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMedia(filtered);
    setCurrentPage(1);
  }, [searchTerm, media]);



  const handleFileUpload = async (files: FileList) => {
    setUploading(true);
    
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }
    
    const formData = new FormData();
    validFiles.forEach(file => {
      formData.append('files[]', file);
    });
    
    try {
      const response = await fetch(route('api.media.batch'), {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': csrf_token,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMedia(prev => [...result.data, ...prev]);
        toast.success(result.message);
        
        // Show individual errors if any
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error: string) => {
            toast.error(error);
          });
        }
      } else {
        // Show individual errors if available, otherwise show main message
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((error: string) => {
            toast.error(error);
          });
        } else {
          toast.error(result.message || 'Failed to upload files');
        }
      }
    } catch (error) {
      toast.error('Error uploading files');
    }
    
    setUploading(false);
    setIsUploadModalOpen(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const deleteMedia = async (id: number) => {
    try {
      const response = await fetch(route('api.media.destroy', id), {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          'X-CSRF-TOKEN': csrf_token,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMedia(prev => prev.filter(item => item.id !== id));
        toast.success(result?.message || 'Media deleted successfully');
      } else {
        if (response.status === 403) {
          toast.error(result?.message || result?.error || 'Permission denied');
        } else if (response.status === 422) {
          toast.error(result?.message || result?.error || 'Action not allowed');
        } else {
          toast.error(result?.message || result?.error || 'Failed to delete media');
        }
      }
    } catch (error) {
      toast.error('Error deleting media');
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(getImageUrl(url));
    toast.success('Image URL copied to clipboard');
  };

  const handleDownload = (id: number, filename: string) => {
    const link = document.createElement('a');
    link.href = route('api.media.download', id);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const handleShowInfo = (item: MediaItem) => {
    setSelectedMediaInfo(item);
    setInfoModalOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    if (typeof (window as any).appSettings?.formatDateTime === 'function') {
      return (window as any).appSettings.formatDateTime(new Date(dateString), false);
    }
    return new Date(dateString).toLocaleString();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return null;
    if (mimeType.includes('pdf')) return (
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
          <FileText className="h-8 w-8 text-red-600" />
        </div>
        <span className="text-xs font-medium text-red-600">PDF</span>
      </div>
    );
    if (mimeType.includes('word') || mimeType.includes('document')) return (
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <span className="text-xs font-medium text-blue-600">DOC</span>
      </div>
    );
    if (mimeType.includes('csv') || mimeType.includes('spreadsheet')) return <FileText className="h-12 w-12 text-green-500" />;
    if (mimeType.startsWith('video/')) return (
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
          <File className="h-8 w-8 text-purple-600" />
        </div>
        <span className="text-xs font-medium text-purple-600">VID</span>
      </div>
    );
    if (mimeType.startsWith('audio/')) return (
      <div className="flex flex-col items-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
          <File className="h-8 w-8 text-orange-600" />
        </div>
        <span className="text-xs font-medium text-orange-600">AUD</span>
      </div>
    );
    return <File className="h-12 w-12 text-gray-500" />;
  };

  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMedia = filteredMedia.slice(startIndex, startIndex + itemsPerPage);

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Media Library') }
  ];

  const pageActions = [];
  
  if (canUploadMedia) {
    pageActions.push({
      label: t('Upload Media'),
      icon: <Plus className="h-4 w-4" />,
      variant: 'default' as const,
      onClick: () => setIsUploadModalOpen(true)
    });
  }

  return (
    <PageTemplate 
      title={t('Media Library')} 
      url="/media-library"
      breadcrumbs={breadcrumbs}
      actions={pageActions}
      description={t('Manage all your media files in one place.')}
    >
      <div className="space-y-4 sm:space-y-6">

        {/* Search and Stats Bar */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Section */}
              <div className="flex-1 min-w-0">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t('Search media files...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchTerm && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('Showing results for "{{term}}"', { term: searchTerm })}
                  </p>
                )}
              </div>
              
              {/* Stats Section */}
              <div className="flex flex-wrap gap-4 sm:gap-6 items-center mt-2 lg:mt-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md">
                    <ImageIcon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">{filteredMedia.length} {t('Files')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500/10 rounded-md">
                    <HardDrive className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold">
                    {formatFileSize(filteredMedia.reduce((acc, item) => acc + item.size, 0))}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 rounded-md">
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold">
                    {filteredMedia.filter(item => item.mime_type.startsWith('image/')).length} {t('Images')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Grid */}
        <Card>
          <CardContent className="p-3 sm:p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">{t('Loading media...')}</p>
              </div>
            ) : currentMedia.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('No media files found')}</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? t('No results found for "{{term}}"', { term: searchTerm }) : t('Get started by uploading your first media file')}
                </p>
                {!searchTerm && canUploadMedia && (
                  <Button 
                    onClick={() => setIsUploadModalOpen(true)}
                    size="lg"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('Upload Media')}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
                  {currentMedia.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-card border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => handleShowInfo(item)}
                    >
                      {/* Image Container */}
                      <div className="relative aspect-square bg-muted">
                        {item.mime_type.startsWith('image/') ? (
                          <img
                            src={item.thumb_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = item.url;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4">
                            <div className="mb-2">
                              {getFileIcon(item.mime_type)}
                            </div>
                            <div className="text-xs text-center font-medium text-muted-foreground truncate w-full">
                              {item.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                            </div>
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center p-2 z-10 pointer-events-none">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 max-w-full">
                            <div className="inline-flex items-center justify-center gap-1.5 bg-background/90 dark:bg-background/95 backdrop-blur-sm rounded-md px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-sm whitespace-nowrap max-w-full text-center">
                              <Eye className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{t('Click to view')}</span>
                            </div>
                          </div>
                        </div>

                        {/* File Type Badge */}
                        <div className="absolute top-2 start-2 rtl:right-2 rtl:left-auto ltr:left-2 ltr:right-auto z-10">
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-background/95 text-foreground ring-border">
                            {item.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-2 sm:p-3 space-y-2">
                        <div>
                          <h3 className="text-sm font-medium truncate" title={item.name}>
                            {item.name}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                            <HardDrive className="h-3 w-3" />
                            {formatFileSize(item.size)}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      {t('Showing')} <span className="font-semibold">{startIndex + 1}</span> {t('to')} <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredMedia.length)}</span> {t('of')} <span className="font-semibold">{filteredMedia.length}</span> {t('results')}
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      >
                        {t('Previous')}
                      </Button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? 'default' : 'outline'}
                              size="sm"
                              className="w-10 h-8"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      >
                        {t('Next')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Upload Modal */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t('Upload Media Files')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div
                className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className={`transition-all duration-200 ${
                  dragActive ? 'scale-110' : ''
                }`}>
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className={`h-8 w-8 transition-colors ${
                      dragActive ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {dragActive ? t('Drop files here') : t('Upload your images')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('Drag and drop your images here, or click to browse')}
                  </p>
                  
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    className="hidden"
                    id="file-upload-modal"
                  />
                  
                  <Button
                    type="button"
                    onClick={() => document.getElementById('file-upload-modal')?.click()}
                    disabled={uploading}
                    size="lg"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('Uploading...')}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('Choose Files')}
                      </>
                    )}
                  </Button>
                </div>
                
                {dragActive && (
                  <div className="absolute inset-0 bg-blue-500/10 rounded-xl" />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Info Modal */}
        <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen} modal={!isChatGptOpen}>
          <DialogContent className="w-[calc(100%-2rem)] sm:max-w-5xl md:max-w-6xl lg:max-w-7xl max-h-[90vh] sm:h-[85vh] p-0 rounded-lg overflow-hidden flex flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <ImageIcon className="h-5 w-5 shrink-0 text-primary" />
                <span>{t('Media Details')}</span>
              </DialogTitle>
            </DialogHeader>

            {selectedMediaInfo && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Side - Large Media Preview (75%) */}
                <div className="lg:col-span-3 min-w-0">
                  <div className="flex justify-center items-center bg-[#F0F0F1] dark:bg-gray-800 rounded-lg p-4 border border-border min-h-[260px] sm:min-h-[350px] lg:h-full">
                    {selectedMediaInfo.mime_type.startsWith('image/') ? (
                      <img
                        src={getImageUrl(selectedMediaInfo.url)}
                        alt={selectedMediaInfo.name}
                        className="max-w-full max-h-[50vh] lg:max-h-full w-auto h-auto object-contain rounded-md shadow-lg"
                        onError={(e) => {
                          e.currentTarget.src = getImageUrl(selectedMediaInfo.thumb_url);
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full py-8">
                        <div className="mb-4 text-7xl sm:text-9xl">
                          {getFileIcon(selectedMediaInfo.mime_type)}
                        </div>
                        <div className="text-xl sm:text-3xl font-semibold text-muted-foreground mb-2 sm:mb-3">
                          {selectedMediaInfo.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                        </div>
                        <div className="text-xs sm:text-base text-muted-foreground max-w-md text-center break-all px-4">
                          {selectedMediaInfo.file_name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Details & Actions (25%) */}
                <div className="lg:col-span-1 space-y-4 min-w-0">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">{t('File Information')}</h3>
                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('File Name')}</span>
                        <p className="text-sm font-medium text-foreground break-all leading-tight">{selectedMediaInfo.file_name}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Display Name')}</span>
                        <p className="text-sm font-medium text-foreground break-all leading-tight">{selectedMediaInfo.name}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('File Type')}</span>
                        <div>
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium font-mono ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 break-all">{selectedMediaInfo.mime_type}</span>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('File Size')}</span>
                        <p className="text-sm font-semibold text-foreground">{formatFileSize(selectedMediaInfo.size)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('Uploaded')}</span>
                        <p className="text-sm font-medium text-foreground">{formatDate(selectedMediaInfo.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* URL Section */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('File URL')}</span>
                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
                      <code className="text-xs text-muted-foreground flex-1 break-all font-mono leading-tight">
                        {getImageUrl(selectedMediaInfo.url)}
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => handleCopyLink(selectedMediaInfo.url)} className="h-7 w-7 p-0 flex-shrink-0" title={t('Copy URL')}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    {canView && (
                      <Button variant="outline" onClick={() => window.open(getImageUrl(selectedMediaInfo.url), '_blank')} className="w-full justify-start">
                        <Eye className="h-4 w-4 mr-2 shrink-0" />
                        {t('View')}
                      </Button>
                    )}
                    {canDownload && (
                      <Button variant="outline" onClick={() => handleDownload(selectedMediaInfo.id, selectedMediaInfo.file_name)} className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2 shrink-0" />
                        {t('Download')}
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="outline" onClick={() => setIsDeleteModalOpen(true)} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                        <X className="h-4 w-4 mr-2 shrink-0" />
                        {t('Delete')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <CrudDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            if (selectedMediaInfo) {
              deleteMedia(selectedMediaInfo.id);
              setInfoModalOpen(false);
              setIsDeleteModalOpen(false);
            }
          }}
          itemName={selectedMediaInfo?.name || ''}
          entityName="Media"
        />
      </div>
    </PageTemplate>
  );
}