import { useRef } from 'react';
import Modal from '@/components/ui/modal';
import { Image, RefreshCcw, ImagePlus, Trash2 } from 'lucide-react';

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    imageUrl?: string | null;
    onUpload?: (file: File) => void;
    onDelete?: () => void;
    readOnly?: boolean;
}

export default function MediaModal({
    isOpen,
    onClose,
    title = "Media Preview",
    imageUrl,
    onUpload,
    onDelete,
    readOnly = false
}: MediaModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload?.(file);
        }
        e.target.value = '';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <div className="relative aspect-video w-full bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Preview"
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Image className="size-10" />
                            <p className="text-sm font-medium">No image selected</p>
                        </div>
                    )}
                </div>

                {!readOnly && (
                    <div className="flex flex-col gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all"
                        >
                            {imageUrl ? <RefreshCcw className="size-5" /> : <ImagePlus className="size-5" />}
                            {imageUrl ? 'Change Image' : 'Select Image'}
                        </button>

                        {imageUrl && (
                            <button
                                onClick={() => {
                                    onDelete?.();
                                    // We don't necessarily close here, let the user decide
                                }}
                                className="w-full py-3 px-4 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                            >
                                <Trash2 className="size-5" />
                                Remove Image
                            </button>
                        )}
                    </div>
                )}

                <p className="text-[10px] text-center text-slate-400 tracking-wide uppercase font-bold">
                    Supported formats: PNG, JPG, GIF (Max 10MB)
                </p>
            </div>
        </Modal>
    );
}
