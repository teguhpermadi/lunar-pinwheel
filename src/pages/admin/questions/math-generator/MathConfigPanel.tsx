import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MathPreviewConfig, MathLevel, MathDomain, mathGeneratorApi } from '@/lib/api';
import { ChevronDown, RefreshCw, Loader2, Settings2 } from 'lucide-react';

interface MathConfigPanelProps {
    onGenerate: (config: MathPreviewConfig) => void;
    isLoading: boolean;
}

const OPERATIONS = [
    { value: 'addition', label: 'Penjumlahan (+)' },
    { value: 'subtraction', label: 'Pengurangan (-)' },
    { value: 'multiplication', label: 'Perkalian (×)' },
    { value: 'division', label: 'Pembagian (÷)' },
];

const SHAPES = [
    { value: 'cube', label: 'Kubus' },
    { value: 'rectangular_prism', label: 'Balok' },
    { value: 'sphere', label: 'Bola' },
    { value: 'cylinder', label: 'Silinder' },
    { value: 'cone', label: 'Kerucut' },
    { value: 'pyramid', label: 'Limas' },
];

const ANGLE_TYPES = [
    { value: 'complementary', label: 'Complementary' },
    { value: 'supplementary', label: 'Supplementary' },
    { value: 'vertical', label: 'Vertical' },
];

const NUMBER_TYPES = [
    { value: 'natural', label: 'Natural' },
    { value: 'whole', label: 'Whole' },
    { value: 'integer', label: 'Integer' },
    { value: 'rational', label: 'Rational' },
    { value: 'real', label: 'Real' },
];

export default function MathConfigPanel({ onGenerate, isLoading }: MathConfigPanelProps) {
    const [levels, setLevels] = useState<MathLevel[]>([]);
    const [domains, setDomains] = useState<MathDomain[]>([]);
    const [isFetchingMeta, setIsFetchingMeta] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);

    const [config, setConfig] = useState<MathPreviewConfig>({
        domain: 'arithmetic',
        level: 1,
        count: 5,
        operation: 'addition',
        number_type: 'natural',
        operand_count: 2,
        with_story: false,
        with_distractors: true,
        distractor_count: 3,
        score: 1,
        timer: 60,
    });

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await mathGeneratorApi.getLevels();
                if (response.success) {
                    setLevels(response.data.levels);

                    const domainsData = response.data.domains;
                    const domainsArray = Array.isArray(domainsData)
                        ? domainsData
                        : Object.entries(domainsData).map(([key, val]: [string, any]) => ({
                            name: key,
                            display_name: val.name || key,
                            description: val.description || '',
                            available_operations: val.operations,
                            available_shapes: val.shapes,
                            available_types: val.types,
                        }));
                    setDomains(domainsArray);
                }
            } catch (error) {
                console.error('Failed to fetch math metadata:', error);
            } finally {
                setIsFetchingMeta(false);
            }
        };
        fetchMetadata();
    }, []);

    const selectedDomain = domains.find(d => d.name === config.domain);
    const selectedLevel = levels.find(l => l.level === config.level);

    const updateConfig = <K extends keyof MathPreviewConfig>(key: K, value: MathPreviewConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = () => {
        onGenerate(config);
    };

    const handleRandomSeed = () => {
        updateConfig('seed', Math.floor(Math.random() * 999999999));
    };

    const getDomainLabel = () => selectedDomain?.display_name || config.domain;
    const getLevelLabel = () => {
        if (!selectedLevel) return `Level ${config.level}`;
        return `Level ${config.level} (${selectedLevel.difficulty.charAt(0).toUpperCase() + selectedLevel.difficulty.slice(1)})`;
    };
    const getOperationLabel = () => {
        if (config.domain !== 'arithmetic' || !config.operation) return null;
        return OPERATIONS.find(op => op.value === config.operation)?.label || config.operation;
    };

    if (isFetchingMeta) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header - always visible, clickable to toggle */}
            <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 flex-shrink-0">
                        <Settings2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">Konfigurasi Soal</h3>
                        {!isExpanded && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                                {getDomainLabel()} · {getLevelLabel()} · {config.count} soal
                                {getOperationLabel() && ` · ${getOperationLabel()}`}
                            </p>
                        )}
                    </div>
                </div>
                <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ml-2 ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {/* Collapsible content */}
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 sm:space-y-5 border-t border-slate-100 dark:border-slate-800">
                            {/* Domain & Level */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Domain</label>
                                    <div className="relative">
                                        <select
                                            value={config.domain}
                                            onChange={(e) => updateConfig('domain', e.target.value)}
                                            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            {domains.map(domain => (
                                                <option key={domain.name} value={domain.name}>{domain.display_name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Level (1-7)</label>
                                    <div className="relative">
                                        <select
                                            value={config.level}
                                            onChange={(e) => updateConfig('level', parseInt(e.target.value))}
                                            className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            {levels.map(level => (
                                                <option key={level.level} value={level.level}>
                                                    Level {level.level} - {level.difficulty.charAt(0).toUpperCase() + level.difficulty.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Count */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Jumlah Soal</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={config.count}
                                    onChange={(e) => updateConfig('count', parseInt(e.target.value) || 1)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            {/* Domain-specific options */}
                            {config.domain === 'arithmetic' && (
                                <div className="space-y-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opsi Aritmatika</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Operasi</label>
                                            <div className="relative">
                                                <select
                                                    value={config.operation}
                                                    onChange={(e) => updateConfig('operation', e.target.value)}
                                                    className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    {OPERATIONS.map(op => (
                                                        <option key={op.value} value={op.value}>{op.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipe Bilangan</label>
                                            <div className="relative">
                                                <select
                                                    value={config.number_type}
                                                    onChange={(e) => updateConfig('number_type', e.target.value)}
                                                    className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    {(selectedLevel?.allowed_number_types || NUMBER_TYPES.map(n => n.value))
                                                        .map(type => {
                                                            const nt = NUMBER_TYPES.find(n => n.value === type);
                                                            return <option key={type} value={type}>{nt?.label || type}</option>;
                                                        })}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Jumlah Operand</label>
                                        <input
                                            type="number"
                                            min={2}
                                            max={5}
                                            value={config.operand_count}
                                            onChange={(e) => updateConfig('operand_count', parseInt(e.target.value) || 2)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            )}

                            {config.domain === 'geometry' && (
                                <div className="space-y-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opsi Geometri</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bentuk</label>
                                            <div className="relative">
                                                <select
                                                    value={config.shape}
                                                    onChange={(e) => updateConfig('shape', e.target.value)}
                                                    className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    {SHAPES.map(shape => (
                                                        <option key={shape.value} value={shape.value}>{shape.label}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dimensi</label>
                                            <div className="relative">
                                                <select
                                                    value={config.dimension}
                                                    onChange={(e) => updateConfig('dimension', e.target.value)}
                                                    className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="2D">2D (Luas)</option>
                                                    <option value="3D">3D (Volume)</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {config.domain === 'angles' && (
                                <div className="space-y-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opsi Sudut</p>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipe Sudut</label>
                                        <div className="relative">
                                            <select
                                                value={config.type}
                                                onChange={(e) => updateConfig('type', e.target.value)}
                                                className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                {ANGLE_TYPES.map(type => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Common Options */}
                            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Opsi Umum</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Skor per Soal</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={5}
                                            value={config.score}
                                            onChange={(e) => updateConfig('score', parseInt(e.target.value) || 1)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Timer (detik)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            step={15}
                                            value={config.timer}
                                            onChange={(e) => updateConfig('timer', parseInt(e.target.value) || 0)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Hint (opsional)</label>
                                    <input
                                        type="text"
                                        value={config.hint || ''}
                                        onChange={(e) => updateConfig('hint', e.target.value || undefined)}
                                        placeholder="Petunjuk untuk siswa..."
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.with_story || false}
                                            onChange={(e) => updateConfig('with_story', e.target.checked)}
                                            className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Dengan Cerita</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={config.with_distractors || false}
                                            onChange={(e) => updateConfig('with_distractors', e.target.checked)}
                                            className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Distractors</span>
                                    </label>
                                </div>
                                {config.with_distractors && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Jumlah Distractor</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={5}
                                            value={config.distractor_count}
                                            onChange={(e) => updateConfig('distractor_count', parseInt(e.target.value) || 3)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Seed (opsional)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={config.seed || ''}
                                            onChange={(e) => updateConfig('seed', e.target.value ? parseInt(e.target.value) : undefined)}
                                            placeholder="Auto-random"
                                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleRandomSeed}
                                            className="px-4 py-2.5 sm:py-3 bg-slate-200 dark:bg-slate-700 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full bg-primary text-white rounded-xl text-sm font-bold py-3 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate Soal'
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Collapsed: Generate button stays visible */}
            {!isExpanded && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full bg-primary text-white rounded-xl text-sm font-bold py-3 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            'Generate Soal'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
