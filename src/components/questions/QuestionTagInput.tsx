import React, { useState, useEffect, useRef } from 'react';
import { tagApi, Tag } from '@/lib/api';

interface QuestionTagInputProps {
    questionId: string;
    initialTags: string[] | any[]; // Backend can return array of strings or array of Tag objects
    onTagsChange: (newTags: string[]) => void;
    disabled?: boolean;
}

export default function QuestionTagInput({
    questionId,
    initialTags = [],
    onTagsChange,
    disabled = false
}: QuestionTagInputProps) {
    // Normalize initial tags to an array of strings
    const normalizedTags = initialTags.map((t: any) => typeof t === 'string' ? t : (t.name || t.slug || '')).filter(Boolean);

    const [tags, setTags] = useState<string[]>(normalizedTags);
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<Tag[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync state when initial props change
    useEffect(() => {
        setTags(initialTags.map((t: any) => typeof t === 'string' ? t : (t.name || t.slug || '')).filter(Boolean));
    }, [initialTags]);

    // Click outside to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch suggestions with debounce
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!inputValue.trim()) {
                setSuggestions([]);
                return;
            }
            setIsSearching(true);
            try {
                // Adjust per your actual tagApi response structure if different
                const response = await tagApi.getTags({ search: inputValue });
                if (response.success && response.data) {
                    // Filter out exact matches that are already selected
                    const filtered = response.data.filter(
                        (t: Tag) => !tags.some(selected => selected.toLowerCase() === t.name.toLowerCase())
                    );
                    setSuggestions(filtered);
                } else if (Array.isArray(response)) {
                    // Fallback if the interceptor/API changes format to raw array
                    setSuggestions(response.filter(
                        (t: Tag) => !tags.some(selected => selected.toLowerCase() === t.name.toLowerCase())
                    ));
                }
            } catch (error) {
                console.error("Failed to fetch tags", error);
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [inputValue, tags]);

    const handleAddTag = (tagName: string) => {
        const trimmed = tagName.trim();
        if (!trimmed) return;

        // Prevent duplicates
        if (tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
            setInputValue('');
            setShowSuggestions(false);
            return;
        }

        const newTags = [...tags, trimmed];
        setTags(newTags);
        onTagsChange(newTags); // Trigger external save
        setInputValue('');
        setShowSuggestions(false);
    };

    const handleRemoveTag = (tagNameToRemove: string) => {
        if (disabled) return;
        const newTags = tags.filter(t => t !== tagNameToRemove);
        setTags(newTags);
        onTagsChange(newTags); // Trigger external save
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag(inputValue);
        } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
            // Remove last tag if backspace is pressed on empty input
            e.preventDefault();
            handleRemoveTag(tags[tags.length - 1]);
        }
    };

    return (
        <div className="relative flex flex-col gap-2" ref={wrapperRef}>
            <div className={`min-h-[42px] p-1.5 bg-white dark:bg-slate-900 border ${showSuggestions ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 dark:border-slate-700'} rounded-xl flex flex-wrap items-center gap-1.5 transition-all w-full relative z-10`} >
                {tags.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-300 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
                    >
                        # {tag}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-0.5 hover:bg-primary/20 hover:text-primary-700 dark:hover:text-primary text-primary/70 rounded-full p-0.5 outline-none flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                        )}
                    </span>
                ))}

                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder={tags.length === 0 ? "Add tags..." : ""}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 px-2 h-7"
                    onFocus={() => setShowSuggestions(true)}
                />

                {isSearching && (
                    <div className="px-2">
                        <span className="material-symbols-outlined text-slate-400 text-sm animate-spin">progress_activity</span>
                    </div>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && inputValue.trim() && !isSearching && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                    {suggestions.length > 0 ? (
                        <ul className="py-1">
                            {suggestions.map((suggestion) => (
                                <li key={suggestion.id}>
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary flex items-center justify-between transition-colors"
                                        onClick={() => handleAddTag(suggestion.name)}
                                    >
                                        <span><span className="text-slate-400 mr-1.5">#</span>{suggestion.name}</span>
                                    </button>
                                </li>
                            ))}
                            {/* Always allow adding the exact typed string if it doesn't match an existing suggestion */}
                            {!suggestions.some(s => s.name.toLowerCase() === inputValue.trim().toLowerCase()) && (
                                <li>
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-2 border-t border-slate-100 dark:border-slate-700 text-sm text-primary font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors"
                                        onClick={() => handleAddTag(inputValue)}
                                    >
                                        <span>Create tag "<span className="font-bold">{inputValue.trim()}</span>"</span>
                                        <span className="material-symbols-outlined text-sm">add_circle</span>
                                    </button>
                                </li>
                            )}
                        </ul>
                    ) : (
                        <div className="p-1">
                            <button
                                type="button"
                                className="w-full text-left px-4 py-2 text-sm text-primary font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors rounded-lg"
                                onClick={() => handleAddTag(inputValue)}
                            >
                                <span>Create tag "<span className="font-bold">{inputValue.trim()}</span>"</span>
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
