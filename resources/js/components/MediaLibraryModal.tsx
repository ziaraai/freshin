import { hasPermission } from '@/utils/authorization';
import { getImageUrl } from '@/utils/image-helper';
import { usePage } from '@inertiajs/react';
import { Image as ImageIcon, Plus, Search, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

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

interface MediaLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    multiple?: boolean;
    initialSelected?: string[];
}

export default function MediaLibraryModal({ isOpen, onClose, onSelect, multiple = false, initialSelected = [] }: MediaLibraryModalProps) {
    const { auth, csrf_token } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const canUploadMedia = hasPermission(permissions, 'upload-media');
    const canManageMedia = hasPermission(permissions, 'manage-media');

    // Get CSRF token from Inertia shared props (always fresh), with DOM meta tag as fallback
    const getCsrfToken = (): string => {
        if (csrf_token) return csrf_token as string;
        return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    };

    const [media, setMedia] = useState<MediaItem[]>([]);
    const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 18;

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(route('api.media.index'), {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
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
            toast.error('Failed to load media');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchMedia();
            setSearchTerm('');
            // Start from the images already chosen, so they can be seen and removed.
            setSelectedItems(multiple ? initialSelected.map(convertToRelativePath).filter(Boolean) : []);
        }
        // initialSelected is read only when the library opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, fetchMedia]);

    // Filter media based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredMedia(media);
        } else {
            const filtered = media.filter(
                (item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.file_name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
            setFilteredMedia(filtered);
        }
        setCurrentPage(1);
    }, [searchTerm, media]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentMedia = filteredMedia.slice(startIndex, startIndex + itemsPerPage);

    const handleFileUpload = async (files: FileList) => {
        setUploading(true);

        const validFiles = Array.from(files).filter((file) => {
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
        validFiles.forEach((file) => {
            formData.append('files[]', file);
        });

        try {
            const response = await fetch(route('api.media.batch'), {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const result = await response.json();

            if (response.ok) {
                if (result.data && result.data.length > 0) {
                    setMedia((prev) => [...result.data, ...prev]);
                }

                // Show appropriate success/warning messages
                if (result.errors && result.errors.length > 0) {
                    toast.warning(result.message || `${result.data?.length || 0} uploaded, ${result.errors.length} failed`);
                    result.errors.forEach((error: string) => {
                        toast.error(error, { duration: 5000 });
                    });
                } else {
                    toast.success(result.message || `${result.data?.length || 0} file(s) uploaded successfully`);
                }
            } else {
                toast.error(result.message || 'Failed to upload files');
                if (result.errors) {
                    result.errors.forEach((error: string) => {
                        toast.error(error, { duration: 5000 });
                    });
                }
            }
        } catch (error) {
            toast.error('Error uploading files');
        }

        setUploading(false);
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

    const handleSelect = (url: string) => {
        // Convert to relative path if it's an absolute URL
        const relativePath = convertToRelativePath(url);

        if (multiple) {
            setSelectedItems((prev) => (prev.includes(relativePath) ? prev.filter((item) => item !== relativePath) : [...prev, relativePath]));
        } else {
            onSelect(relativePath);
            onClose();
        }
    };

    const handleConfirmSelection = () => {
        if (multiple) {
            onSelect(selectedItems.join(','));
            onClose();
        }
    };

    // Function to convert absolute URL to relative path
    const convertToRelativePath = (url: string): string => {
        if (!url) return '';

        // If it's already a relative path starting with /storage, return as is
        if (url.startsWith('/storage')) {
            return url;
        }

        // Extract the path after /storage from the full URL
        const storagePattern = /\/storage\/(.*)$/;
        const matches = url.match(storagePattern);

        if (matches && matches[0]) {
            return matches[0]; // Return /storage/path/to/file.jpg
        }

        // If no match found, return the original URL
        return url;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex max-h-[85vh] max-w-5xl flex-col overflow-hidden">
                <DialogHeader className="pb-4">
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Media Library
                        {filteredMedia.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {filteredMedia.length}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col gap-4">
                    {/* Header with Search and Upload */}
                    <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                            <Input
                                placeholder="Search media files..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {canUploadMedia && (
                            <div className="flex gap-2">
                                <Input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    disabled={uploading}
                                    size="sm"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Stats and Selection Info */}
                    <div className="text-muted-foreground bg-muted/30 flex shrink-0 items-center justify-between rounded-md px-3 py-2 text-sm">
                        <span>
                            {filteredMedia.length} files • Page {currentPage} of {totalPages || 1}
                        </span>
                        {multiple && selectedItems.length > 0 && (
                            <Badge variant="default" className="text-xs">
                                {selectedItems.length} selected
                            </Badge>
                        )}
                    </div>

                    {/* Media Grid */}
                    <div className="bg-muted/10 flex min-h-[120px] flex-1 flex-col overflow-y-auto rounded-lg border">
                        {loading ? (
                            <div className="flex flex-1 items-center justify-center">
                                <div className="text-center">
                                    <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                                    <p className="text-muted-foreground">Loading media...</p>
                                </div>
                            </div>
                        ) : filteredMedia.length === 0 ? (
                            <div className="flex flex-1 items-center justify-center py-16">
                                <div className="max-w-sm text-center">
                                    <div
                                        className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
                                            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                                        }`}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                    >
                                        <Upload className="text-muted-foreground h-10 w-10" />
                                    </div>

                                    <div className="mb-6 space-y-3">
                                        <h3 className="text-lg font-semibold">No media files found</h3>
                                        {searchTerm && (
                                            <p className="text-muted-foreground text-sm">
                                                No results for <span className="text-foreground font-medium">"${searchTerm}"</span>
                                            </p>
                                        )}
                                        <p className="text-muted-foreground text-sm">
                                            {searchTerm ? 'Try a different search term or upload new images' : 'Upload images to get started'}
                                        </p>
                                    </div>

                                    {canUploadMedia && (
                                        <Button type="button" onClick={() => document.getElementById('file-upload')?.click()} disabled={uploading}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Upload Images
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4">
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                    {currentMedia.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`group relative cursor-pointer overflow-hidden rounded-lg transition-all hover:scale-105 ${
                                                selectedItems.includes(convertToRelativePath(item.url))
                                                    ? 'ring-primary shadow-lg ring-4'
                                                    : 'border-border hover:border-primary/50 border hover:shadow-md'
                                            }`}
                                            onClick={() => handleSelect(item.url)}
                                        >
                                            <div className="bg-muted relative aspect-square">
                                                <img
                                                    src={getImageUrl(item.thumb_url)}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src = getImageUrl(item.url);
                                                    }}
                                                />

                                                {/* Selection Indicator */}
                                                {selectedItems.includes(convertToRelativePath(item.url)) && (
                                                    <div className="bg-primary/30 absolute inset-0 z-10 flex items-center justify-center">
                                                        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow">
                                                            {selectedItems.indexOf(convertToRelativePath(item.url)) + 1}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

                                                {/* File Name Tooltip */}
                                                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <p className="truncate text-xs text-white" title={item.name}>
                                                        {item.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t pt-3">
                            <div className="text-muted-foreground text-sm">
                                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMedia.length)} of {filteredMedia.length}{' '}
                                files
                            </div>
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                >
                                    Previous
                                </Button>
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
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </Button>
                                    );
                                })}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Selected images: shows what is selected (on any page) and lets you remove one */}
                    {multiple && selectedItems.length > 0 && (
                        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-t pt-3">
                            <span className="text-muted-foreground shrink-0 text-sm">Selected:</span>
                            {selectedItems.map((path, index) => (
                                <div key={path} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border">
                                    <img src={getImageUrl(path)} alt={`Selected image ${index + 1}`} className="h-full w-full object-cover" />
                                    <span className="bg-primary text-primary-foreground absolute top-0.5 left-0.5 rounded-full px-1.5 text-[10px] font-bold">
                                        {index + 1}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Remove selected image ${index + 1}`}
                                        onClick={() => setSelectedItems((prev) => prev.filter((item) => item !== path))}
                                        className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 text-white hover:bg-black"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex shrink-0 items-center justify-between border-t pt-4">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <div className="flex gap-2">
                            {multiple && selectedItems.length > 0 && (
                                <Button variant="outline" onClick={() => setSelectedItems([])} size="sm">
                                    Clear
                                </Button>
                            )}
                            {multiple && (selectedItems.length > 0 || initialSelected.length > 0) && (
                                <Button onClick={handleConfirmSelection}>
                                    {selectedItems.length > 0
                                        ? `Use ${selectedItems.length} image${selectedItems.length > 1 ? 's' : ''}`
                                        : 'Remove all images'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
