import { useState } from 'react';
import MediaModal from '../MediaModal';
import Swal from 'sweetalert2';

interface Option {
    id?: string;
    key: string;
    content: string;
    is_correct: boolean;
    media?: any;
    uuid: string;
    pendingImage?: File | null;
    previewUrl?: string | null;
}

interface MultipleChoiceInputProps {
    options: Option[];
    onChange: (options: Option[]) => void;
    onDeleteMedia?: (uuid: string, mediaId?: string) => void;
    isEditing?: boolean;
}

export default function MultipleChoiceInput({ options, onChange, onDeleteMedia }: MultipleChoiceInputProps) {
    const [selectedOptionUuid, setSelectedOptionUuid] = useState<string | null>(null);
    const generateKey = (index: number) => String.fromCharCode(65 + index); // 0 -> A, 1 -> B

    const handleAddOption = () => {
        const nextKey = generateKey(options.length);
        const newOption: Option = {
            key: nextKey,
            content: '',
            is_correct: false,
            uuid: crypto.randomUUID()
        };
        onChange([...options, newOption]);
    };

    const handleRemoveOption = (uuid: string) => {
        if (options.length <= 2) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Minimum 2 options required',
                showConfirmButton: false,
                timer: 2000
            });
            return;
        }

        const newOptions = options.filter((opt: Option) => opt.uuid !== uuid);
        // Re-key
        const reKeyed = newOptions.map((opt: Option, idx: number) => ({ ...opt, key: generateKey(idx) }));
        onChange(reKeyed);
    };

    const handleContentChange = (uuid: string, content: string) => {
        const newOptions = options.map((opt: Option) =>
            opt.uuid === uuid ? { ...opt, content } : opt
        );
        onChange(newOptions);
    };

    const handleSetCorrect = (uuid: string) => {
        // For multiple choice, only one correct
        const newOptions = options.map((opt: Option) => ({
            ...opt,
            is_correct: opt.uuid === uuid
        }));
        onChange(newOptions);
    };

    const handleFileChange = (uuid: string, file: File) => {
        const newOptions = options.map((opt: Option) =>
            opt.uuid === uuid ? {
                ...opt,
                pendingImage: file,
                previewUrl: URL.createObjectURL(file)
            } : opt
        );
        onChange(newOptions);
        setSelectedOptionUuid(null);
    };

    const handleRemoveMedia = (uuid: string) => {
        const option = options.find((o: Option) => o.uuid === uuid);
        if (!option) return;

        if (option.pendingImage) {
            handleRemovePendingImage(uuid);
        } else if (option.media?.option_media?.[0]) {
            onDeleteMedia?.(uuid, option.media.option_media[0].id);
        }
    };

    const handleRemovePendingImage = (uuid: string) => {
        const newOptions = options.map((opt: Option) => {
            if (opt.uuid === uuid) {
                if (opt.previewUrl) URL.revokeObjectURL(opt.previewUrl);
                return { ...opt, pendingImage: null, previewUrl: null };
            }
            return opt;
        });
        onChange(newOptions);
    };

    return (
        <>
            <section className="space-y-6">
                <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Answer Options</label>
                <div className="space-y-3">
                    {options.map((option: Option) => (
                        <div key={option.uuid} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-all hover:border-primary/20 focus-within:ring-2 focus-within:ring-primary/10">
                            <div className="flex items-center gap-4">
                                <div className={`size-10 rounded-xl flex items-center justify-center font-bold shrink-0 transition-colors ${option.is_correct
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                    {option.key}
                                </div>

                                <div className="flex-1 flex items-center gap-3">
                                    <div
                                        onClick={() => setSelectedOptionUuid(option.uuid)}
                                        className="size-11 shrink-0 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary cursor-pointer transition-all overflow-hidden"
                                    >
                                        {option.previewUrl || option.media?.option_media?.[0] ? (
                                            <img
                                                src={option.previewUrl || option.media.option_media[0].url}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-lg">image</span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={option.content}
                                        onChange={(e) => handleContentChange(option.uuid, e.target.value)}
                                        placeholder="Option text..."
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-primary focus:border-primary transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleSetCorrect(option.uuid)}
                                        className={`p-2 rounded-lg transition-colors ${option.is_correct
                                            ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                                            : 'text-slate-300 hover:text-emerald-500'
                                            }`}
                                        title="Mark as Correct"
                                    >
                                        <span className="material-symbols-outlined">
                                            {option.is_correct ? 'check_circle' : 'circle'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => handleRemoveOption(option.uuid)}
                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                        title="Remove Option"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleAddOption}
                    className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-400 font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 mb-12"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Add New Option
                </button>
            </section>

            <MediaModal
                isOpen={!!selectedOptionUuid}
                onClose={() => setSelectedOptionUuid(null)}
                title="Option Image"
                imageUrl={options.find((o: Option) => o.uuid === selectedOptionUuid)?.previewUrl || options.find((o: Option) => o.uuid === selectedOptionUuid)?.media?.option_media?.[0]?.url}
                onUpload={(file) => selectedOptionUuid && handleFileChange(selectedOptionUuid, file)}
                onDelete={() => {
                    if (selectedOptionUuid) {
                        handleRemoveMedia(selectedOptionUuid);
                        setSelectedOptionUuid(null);
                    }
                }}
            />
        </>
    );
}
