import Swal from 'sweetalert2';

interface Option {
    id?: string;
    key: string;
    content: string;
    is_correct: boolean;
    uuid: string;
}

interface ShortAnswerInputProps {
    options: Option[];
    onChange: (options: Option[]) => void;
}

export default function ShortAnswerInput({ options, onChange }: ShortAnswerInputProps) {
    const generateKey = (index: number) => `SA${index + 1}`;

    const handleAddOption = () => {
        const newOption: Option = {
            key: generateKey(options.length),
            content: '',
            is_correct: true,
            uuid: crypto.randomUUID()
        };
        onChange([...options, newOption]);
    };

    const handleRemoveOption = (uuid: string) => {
        if (options.length <= 1) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: 'Minimum 1 jawaban diperlukan',
                showConfirmButton: false,
                timer: 2000
            });
            return;
        }

        const newOptions = options
            .filter(opt => opt.uuid !== uuid)
            .map((opt, idx) => ({ ...opt, key: generateKey(idx) }));
        onChange(newOptions);
    };

    const handleContentChange = (uuid: string, content: string) => {
        const newOptions = options.map(opt =>
            opt.uuid === uuid ? { ...opt, content } : opt
        );
        onChange(newOptions);
    };

    return (
        <section className="space-y-6">
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-widest">Accepted Answers</label>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-emerald-500 flex items-start gap-4">
                <span className="material-symbols-outlined text-emerald-500 text-3xl">spellcheck</span>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Short Answer</h3>
                    <p className="text-slate-500 text-sm mt-1">
                        Tambahkan satu atau beberapa jawaban yang diterima. Jawaban siswa akan dicocokkan dengan daftar jawaban berikut.
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {options.map((option, index) => (
                    <div key={option.uuid} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-all hover:border-emerald-200 dark:hover:border-emerald-800 focus-within:ring-2 focus-within:ring-emerald-500/10">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl flex items-center justify-center font-bold shrink-0 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 text-sm">
                                {index + 1}
                            </div>

                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={option.content}
                                    onChange={(e) => handleContentChange(option.uuid, e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none border"
                                    placeholder="Ketik jawaban yang diterima..."
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="p-2 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg" title="Accepted Answer">
                                    <span className="material-symbols-outlined">check_circle</span>
                                </div>
                                <button
                                    onClick={() => handleRemoveOption(option.uuid)}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    title="Hapus Jawaban"
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
                className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-slate-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2 mb-12"
            >
                <span className="material-symbols-outlined">add_circle</span>
                Tambah Jawaban
            </button>
        </section>
    );
}
