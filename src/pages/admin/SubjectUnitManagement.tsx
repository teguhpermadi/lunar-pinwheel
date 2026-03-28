import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    ChevronDown,
    Plus,
    Pencil,
    Trash2,
    ArrowUp,
    ArrowDown,
    GripVertical,
    BookOpen,
    Layers,
    FileText,
    FolderOpen,
    ChevronLeft
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PublishToggle } from '@/components/ui/PublishToggle';
import { subjectApi, learningPathApi, learningUnitApi, learningLessonApi, api, Subject, Classroom, LearningPath, LearningUnit, LearningLesson } from '@/lib/api';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const MySwal = withReactContent(Swal);

interface TreeNode {
    id: string;
    type: 'path' | 'unit' | 'lesson';
    title: string;
    order: number;
    is_published?: number;
    children?: TreeNode[];
    data: LearningPath | LearningUnit | LearningLesson;
    isExpanded?: boolean;
}

const contentTypeOptions = [
    { value: 'reading', label: 'Reading' },
    { value: 'video', label: 'Video' },
    { value: 'audio', label: 'Audio' },
    { value: 'web_link', label: 'Web Link' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'survey', label: 'Survey' }
];

function SortableTreeItem({
    node,
    onToggle,
    onEdit,
    onDelete,
    onAddChild,
    onMoveUp,
    onMoveDown,
    onTogglePublish,
    canMoveUp,
    canMoveDown,
    displayOrder,
    publishingIds
}: {
    node: TreeNode;
    onToggle: (id: string) => void;
    onEdit: (item: TreeNode) => void;
    onDelete: (item: TreeNode) => void;
    onAddChild: (parent: TreeNode) => void;
    onMoveUp: (item: TreeNode) => void;
    onMoveDown: (item: TreeNode) => void;
    onTogglePublish: (item: TreeNode) => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
    displayOrder: string;
    publishingIds: Set<string>;
}) {
    const isPublishing = publishingIds.has(node.id);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: node.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const getTypeIcon = () => {
        switch (node.type) {
            case 'path':
                return <FolderOpen className="size-4 text-amber-500" />;
            case 'unit':
                return <Layers className="size-4 text-indigo-500" />;
            case 'lesson':
                return <FileText className="size-4 text-emerald-500" />;
        }
    };

    const getTypeColor = () => {
        const isInactive = node.is_published !== 1;
        const bgClass = isInactive ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800';
        const borderClass = isInactive ? 'border-slate-200 dark:border-slate-700' : '';
        
        switch (node.type) {
            case 'path':
                return `${bgClass} ${isInactive ? borderClass : 'border-amber-200 dark:border-amber-700'}`;
            case 'unit':
                return `${bgClass} ${isInactive ? borderClass : 'border-indigo-200 dark:border-indigo-700'}`;
            case 'lesson':
                return `${bgClass} ${isInactive ? borderClass : 'border-emerald-200 dark:border-emerald-700'}`;
        }
    };

    const getTypeBadge = () => {
        switch (node.type) {
            case 'path':
                return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">PATH</span>;
            case 'unit':
                return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">UNIT</span>;
            case 'lesson':
                return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">LESSON</span>;
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-2">
            <div 
                className={`flex items-center gap-2 p-3 rounded-xl border ${getTypeColor()} hover:shadow-md transition-shadow ${node.type !== 'lesson' ? 'cursor-pointer' : ''}`}
                onClick={() => node.type !== 'lesson' && onToggle(node.id)}
            >
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 w-8 text-center">{displayOrder}</span>

                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                >
                    <GripVertical className="size-4 text-slate-400" />
                </button>

                {node.type !== 'lesson' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(node.id);
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                    >
                        {node.isExpanded ? (
                            <ChevronDown className="size-4 text-slate-500" />
                        ) : (
                            <ChevronRight className="size-4 text-slate-500" />
                        )}
                    </button>
                )}

                {node.type === 'lesson' && <div className="w-5" />}

                {getTypeIcon()}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-semibold truncate ${node.is_published === 1 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{node.title}</span>
                        {getTypeBadge()}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoveUp(node);
                        }}
                        disabled={!canMoveUp}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                    >
                        <ArrowUp className="size-4 text-slate-500" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMoveDown(node);
                        }}
                        disabled={!canMoveDown}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                    >
                        <ArrowDown className="size-4 text-slate-500" />
                    </button>
                    {node.type !== 'lesson' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddChild(node);
                            }}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                            title={`Add ${node.type === 'path' ? 'Unit' : 'Lesson'}`}
                        >
                            <Plus className="size-4 text-slate-500" />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(node);
                        }}
                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        title="Edit"
                    >
                        <Pencil className="size-4 text-slate-500" />
                    </button>
                    <PublishToggle
                        checked={node.is_published === 1}
                        onChange={() => {
                            onTogglePublish(node);
                        }}
                        loading={isPublishing}
                        title={node.is_published ? 'Published' : 'Draft'}
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(node);
                        }}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        title="Delete"
                    >
                        <Trash2 className="size-4 text-red-500" />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {node.isExpanded && node.children && (node.type === 'path' || node.children.length > 0) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-8 mt-2 border-l-2 border-slate-200 dark:border-slate-700 pl-4"
                    >
                        {node.children.length > 0 ? (
                            <SortableContext items={node.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                {node.children.map((child, idx) => (
                                    <SortableTreeItem
                                        key={child.id}
                                        node={child}
                                        onToggle={onToggle}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onAddChild={onAddChild}
                                        onMoveUp={onMoveUp}
                                        onMoveDown={onMoveDown}
                                        onTogglePublish={onTogglePublish}
                                        canMoveUp={idx > 0}
                                        canMoveDown={idx < node.children!.length - 1}
                                        displayOrder={child.type === 'unit' ? `${displayOrder}.${idx + 1}` : `${displayOrder}.${idx + 1}`}
                                        publishingIds={publishingIds}
                                    />
                                ))}
                            </SortableContext>
                        ) : (
                            <div className="text-sm text-slate-400 dark:text-slate-500 py-2 px-4">
                                No items yet. Click + to add one.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TreeSkeleton({ depth = 0 }: { depth?: number }) {
    return (
        <div className={`ml-${depth * 8} mb-2`}>
            <Skeleton className="h-12 w-full rounded-xl" />
        </div>
    );
}

export default function SubjectUnitManagement() {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();

    const [subject, setSubject] = useState<Subject | null>(null);
    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [modalType, setModalType] = useState<'path' | 'unit' | 'lesson'>('path');
    const [selectedItem, setSelectedItem] = useState<TreeNode | null>(null);
    const [parentNode, setParentNode] = useState<TreeNode | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        is_published: false,
        xp_reward: 0,
        content_type: 'reading',
        question_bank_id: ''
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    useEffect(() => {
        if (subjectId) {
            fetchSubjectData();
            fetchLearningPaths();
        }
    }, [subjectId]);

    const fetchSubjectData = async () => {
        try {
            const response = await subjectApi.getSubject(subjectId!);
            if (response.success && response.data) {
                setSubject(response.data);
                if (response.data.classroom) {
                    setClassroom(response.data.classroom);
                }
            }
        } catch (error) {
            console.error('Failed to fetch subject:', error);
        }
    };

    const fetchLearningPaths = async () => {
        setIsLoading(true);
        try {
            const response = await learningPathApi.getBySubject(subjectId!, { per_page: 100 });
            console.log('API Response paths:', JSON.stringify(response.data, null, 2));
            if (response.success && response.data) {
                const paths = response.data.data || response.data;
                console.log('Raw paths is_published:', paths.map((p: LearningPath) => ({ id: p.id, is_published: p.is_published, type: typeof p.is_published })));
                
                const tree: TreeNode[] = await Promise.all(
                    paths.map(async (path: LearningPath) => {
                        let unitsWithLessons = path.units || [];
                        
                        if (unitsWithLessons.length === 0) {
                            try {
                                const pathDetail = await learningPathApi.getLearningPath(path.id);
                                if (pathDetail.success && pathDetail.data) {
                                    unitsWithLessons = pathDetail.data.units || [];
                                }
                            } catch (e) {
                                console.error('Failed to fetch path detail:', e);
                            }
                        }
                        
                        const unitsWithFetchedLessons = await Promise.all(
                            unitsWithLessons.map(async (unit: LearningUnit) => {
                                let lessons = unit.lessons || [];
                                
                                if (lessons.length === 0) {
                                    try {
                                        const unitResponse = await api.get(`/learning-units/${unit.id}`);
                                        if (unitResponse.data.success && unitResponse.data.data) {
                                            lessons = unitResponse.data.data.lessons || [];
                                        }
                                    } catch (e) {
                                        console.error('Failed to fetch unit detail:', e);
                                    }
                                }
                                
                                return {
                                    id: unit.id,
                                    type: 'unit' as const,
                                    title: unit.title,
                                    order: unit.order,
                                    is_published: Number(unit.is_published) as 0 | 1,
                                    data: unit,
                                    isExpanded: true,
                                    children: lessons.map((lesson: LearningLesson) => ({
                                        id: lesson.id,
                                        type: 'lesson' as const,
                                        title: lesson.title,
                                        order: lesson.order,
                                        is_published: Number(lesson.is_published) as 0 | 1,
                                        data: lesson
                                    }))
                                };
                            })
                        );
                        
                        return {
                            id: path.id,
                            type: 'path' as const,
                            title: path.title,
                            order: path.order,
                            is_published: Number(path.is_published) as 0 | 1,
                            data: path,
                            isExpanded: true,
                            children: unitsWithFetchedLessons
                        };
                    })
                );
                
                tree.sort((a, b) => a.order - b.order);
                tree.forEach(path => {
                    if (path.children) {
                        path.children.sort((a, b) => a.order - b.order);
                        path.children.forEach(unit => {
                            if (unit.children) {
                                unit.children.sort((a, b) => a.order - b.order);
                            }
                        });
                    }
                });

                const propagatePublishedStatus = (nodes: TreeNode[]): TreeNode[] => {
                    return nodes.map(node => {
                        const children = node.children ? propagatePublishedStatus(node.children) : [];
                        const parentPublished = node.is_published === 1;
                        return {
                            ...node,
                            is_published: parentPublished ? 1 : 0,
                            children: children.map(child => ({
                                ...child,
                                is_published: parentPublished ? child.is_published : 0,
                                children: child.children?.map(grandChild => ({
                                    ...grandChild,
                                    is_published: parentPublished ? grandChild.is_published : 0
                                }))
                            }))
                        };
                    });
                };

                const treeWithPropagatedStatus = propagatePublishedStatus(tree);
                
                setTreeData(treeWithPropagatedStatus);
            }
        } catch (error) {
            console.error('Failed to fetch learning paths:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        setTreeData(prev => {
            const updateChildren = (nodes: TreeNode[]): TreeNode[] => {
                return nodes.map(node => {
                    if (node.id === id) {
                        return { ...node, isExpanded: !node.isExpanded };
                    }
                    if (node.children) {
                        return { ...node, children: updateChildren(node.children) };
                    }
                    return node;
                });
            };
            return updateChildren(prev);
        });
    };

    const handleAddChild = (parent: TreeNode) => {
        setParentNode(parent);
        setModalType(parent.type === 'path' ? 'unit' : 'lesson');
        setModalMode('create');
        setFormData({
            title: '',
            description: '',
            is_published: false,
            xp_reward: 0,
            content_type: 'reading',
            question_bank_id: ''
        });
        setModalOpen(true);
    };

    const handleEdit = (item: TreeNode) => {
        setSelectedItem(item);
        setModalType(item.type);
        setModalMode('edit');

        if (item.type === 'path') {
            const path = item.data as LearningPath;
            setFormData({
                title: path.title,
                description: path.description || '',
                is_published: path.is_published === 1,
                xp_reward: 0,
                content_type: 'reading',
                question_bank_id: ''
            });
        } else if (item.type === 'unit') {
            const unit = item.data as LearningUnit;
            setFormData({
                title: unit.title,
                description: '',
                is_published: unit.is_published === 1,
                xp_reward: unit.xp_reward || 0,
                content_type: 'reading',
                question_bank_id: ''
            });
        } else {
            const lesson = item.data as LearningLesson;
            setFormData({
                title: lesson.title,
                description: '',
                is_published: lesson.is_published === 1,
                xp_reward: lesson.xp_reward || 0,
                content_type: lesson.content_type,
                question_bank_id: lesson.question_bank_id || ''
            });
        }
        setModalOpen(true);
    };

    const handleDelete = async (item: TreeNode) => {
        const typeLabel = item.type === 'path' ? 'Learning Path' : item.type === 'unit' ? 'Learning Unit' : 'Learning Lesson';
        
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: `You want to delete "${item.title}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                if (item.type === 'path') {
                    await learningPathApi.deleteLearningPath(item.id);
                } else if (item.type === 'unit') {
                    await learningUnitApi.deleteLearningUnit(item.id);
                } else {
                    await learningLessonApi.deleteLearningLesson(item.id);
                }

                MySwal.fire('Deleted!', `${typeLabel} has been deleted.`, 'success');
                fetchLearningPaths();
            } catch (error) {
                console.error('Failed to delete:', error);
                MySwal.fire('Error!', `Failed to delete ${typeLabel.toLowerCase()}.`, 'error');
            }
        }
    };

    const handleTogglePublish = async (item: TreeNode) => {
        console.log('handleTogglePublish called:', { item });
        
        setPublishingIds(prev => new Set(prev).add(item.id));
        
        try {
            const newPublished = item.is_published ? 0 : 1;
            console.log('Toggling:', { id: item.id, type: item.type, current: item.is_published, new: newPublished });
            
            let response;
            if (item.type === 'path') {
                response = await learningPathApi.updateLearningPath(item.id, { is_published: newPublished });
            } else if (item.type === 'unit') {
                response = await learningUnitApi.updateLearningUnit(item.id, { is_published: newPublished });
            } else if (item.type === 'lesson') {
                response = await learningLessonApi.updateLearningLesson(item.id, { is_published: newPublished });
            }
            
            console.log('API Response:', response);
            
            setTreeData(prev => {
                const updateItemAndChildren = (nodes: TreeNode[]): TreeNode[] => {
                    return nodes.map(node => {
                        if (node.id === item.id) {
                            const updatedNode = { ...node, is_published: newPublished };
                            if (updatedNode.children) {
                                updatedNode.children = updatedNode.children.map(child => ({
                                    ...child,
                                    is_published: newPublished,
                                    children: child.children?.map(grandChild => ({
                                        ...grandChild,
                                        is_published: newPublished
                                    }))
                                }));
                            }
                            return updatedNode;
                        }
                        if (node.children) {
                            return { ...node, children: updateItemAndChildren(node.children) };
                        }
                        return node;
                    });
                };
                return updateItemAndChildren(prev);
            });
        } catch (error) {
            console.error('Failed to toggle publish:', error);
            MySwal.fire('Error!', 'Failed to update publish status.', 'error');
        } finally {
            setPublishingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
        }
    };

    const handleSubmit = async () => {
        try {
            const publishedValue = formData.is_published ? 1 : 0;
            
            if (modalMode === 'create') {
                if (modalType === 'path') {
                    await learningPathApi.createLearningPath({
                        subject_id: subjectId!,
                        classroom_id: subject?.classroom_id || '',
                        title: formData.title,
                        description: formData.description || undefined,
                        is_published: publishedValue
                    });
                } else if (modalType === 'unit') {
                    await learningUnitApi.createLearningUnit({
                        learning_path_id: parentNode!.id,
                        title: formData.title,
                        xp_reward: formData.xp_reward || undefined
                    });
                } else {
                    await learningLessonApi.createLearningLesson({
                        learning_unit_id: parentNode!.id,
                        title: formData.title,
                        content_type: formData.content_type,
                        question_bank_id: formData.question_bank_id || undefined,
                        xp_reward: formData.xp_reward || undefined
                    });
                }
                MySwal.fire('Success!', 'Item created successfully.', 'success');
            } else {
                if (modalType === 'path') {
                    await learningPathApi.updateLearningPath(selectedItem!.id, {
                        title: formData.title,
                        description: formData.description || undefined,
                        is_published: publishedValue
                    });
                } else if (modalType === 'unit') {
                    await learningUnitApi.updateLearningUnit(selectedItem!.id, {
                        title: formData.title,
                        xp_reward: formData.xp_reward || undefined,
                        is_published: publishedValue
                    });
                } else {
                    await learningLessonApi.updateLearningLesson(selectedItem!.id, {
                        title: formData.title,
                        content_type: formData.content_type,
                        question_bank_id: formData.question_bank_id || undefined,
                        xp_reward: formData.xp_reward || undefined,
                        is_published: publishedValue
                    });
                }
                MySwal.fire('Success!', 'Item updated successfully.', 'success');
            }
            setModalOpen(false);
            fetchLearningPaths();
        } catch (error) {
            console.error('Failed to save:', error);
            MySwal.fire('Error!', 'Failed to save item.', 'error');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const findAndReorder = (nodes: TreeNode[], type: 'path' | 'unit' | 'lesson'): TreeNode[] => {
            const items = nodes.filter(n => n.type === type);
            const activeIndex = items.findIndex(i => i.id === activeId);
            const overIndex = items.findIndex(i => i.id === overId);

            if (activeIndex === -1 || overIndex === -1) return nodes;

            const reordered = [...items];
            const [moved] = reordered.splice(activeIndex, 1);
            reordered.splice(overIndex, 0, moved);

            const updatedItems = reordered.map((item, idx) => ({ ...item, order: idx }));
            
            return nodes.map(node => {
                if (node.type === type) {
                    return updatedItems.find(u => u.id === node.id) || node;
                }
                if (node.children) {
                    return { ...node, children: findAndReorder(node.children, type === 'path' ? 'unit' : 'lesson') };
                }
                return node;
            });
        };

        setTreeData(prev => findAndReorder(prev, 'path'));
    };

    const findParentNode = (nodes: TreeNode[], itemId: string): TreeNode | null => {
        for (const node of nodes) {
            if (node.children) {
                if (node.children.some(c => c.id === itemId)) {
                    return node;
                }
                const found = findParentNode(node.children, itemId);
                if (found) return found;
            }
        }
        return null;
    };

    const handleReorder = async (item: TreeNode, direction: 'up' | 'down') => {
        let siblings: TreeNode[] = [];
        
        if (item.type === 'path') {
            siblings = treeData;
        } else {
            const parentNode = findParentNode(treeData, item.id);
            siblings = parentNode?.children || [];
        }
        
        const currentIndex = siblings.findIndex(s => s.id === item.id);
        
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === siblings.length - 1) return;

        const newSiblings = [...siblings];
        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        [newSiblings[currentIndex], newSiblings[swapIndex]] = [newSiblings[swapIndex], newSiblings[currentIndex]];

        const reorderItems = newSiblings.map((s, idx) => ({ id: s.id, order: idx }));

        try {
            if (item.type === 'path') {
                await learningPathApi.reorderLearningPaths(reorderItems);
                setTreeData(prev => {
                    const pathIndex = prev.findIndex(p => p.id === item.id);
                    if (pathIndex === -1) return prev;
                    const newTree = [...prev];
                    [newTree[pathIndex], newTree[swapIndex]] = [newTree[swapIndex], newTree[pathIndex]];
                    return newTree.map((p, idx) => ({ ...p, order: idx }));
                });
            } else if (item.type === 'unit') {
                await learningUnitApi.reorderLearningUnits(reorderItems);
                setTreeData(prev => {
                    const updateUnits = (nodes: TreeNode[]): TreeNode[] => {
                        return nodes.map(node => {
                            if (node.children?.some(c => c.id === item.id)) {
                                const newChildren = [...node.children];
                                const unitIdx = newChildren.findIndex(c => c.id === item.id);
                                if (unitIdx === -1) return node;
                                const swapIdx = direction === 'up' ? unitIdx - 1 : unitIdx + 1;
                                if (swapIdx < 0 || swapIdx >= newChildren.length) return node;
                                [newChildren[unitIdx], newChildren[swapIdx]] = [newChildren[swapIdx], newChildren[unitIdx]];
                                return { ...node, children: newChildren.map((c, idx) => ({ ...c, order: idx })) };
                            }
                            if (node.children) {
                                return { ...node, children: updateUnits(node.children) };
                            }
                            return node;
                        });
                    };
                    return updateUnits(prev);
                });
            } else {
                await learningLessonApi.reorderLearningLessons(reorderItems);
                setTreeData(prev => {
                    const updateLessons = (nodes: TreeNode[]): TreeNode[] => {
                        return nodes.map(node => {
                            if (node.children) {
                                const childIdx = node.children.findIndex(c => c.id === item.id);
                                if (childIdx !== -1) {
                                    const newChildren = [...node.children];
                                    const swapIdx = direction === 'up' ? childIdx - 1 : childIdx + 1;
                                    if (swapIdx < 0 || swapIdx >= newChildren.length) return node;
                                    [newChildren[childIdx], newChildren[swapIdx]] = [newChildren[swapIdx], newChildren[childIdx]];
                                    return { ...node, children: newChildren.map((c, idx) => ({ ...c, order: idx })) };
                                }
                                return { ...node, children: updateLessons(node.children) };
                            }
                            return node;
                        });
                    };
                    return updateLessons(prev);
                });
            }
        } catch (error) {
            console.error('Failed to reorder:', error);
            MySwal.fire('Error!', 'Failed to reorder items.', 'error');
        }
    };

    const getAllItems = (nodes: TreeNode[], type?: 'path' | 'unit' | 'lesson'): TreeNode[] => {
        let items: TreeNode[] = [];
        nodes.forEach(node => {
            if (!type || node.type === type) {
                items.push(node);
            }
            if (node.children) {
                items = items.concat(getAllItems(node.children, type));
            }
        });
        return items;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 space-y-6 max-w-7xl mx-auto"
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/subjects')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ChevronLeft className="size-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {subject?.name || 'Subject Units'}
                        </h2>
                        {subject?.code && (
                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-medium">
                                {subject.code}
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage Learning Paths, Units, and Lessons
                        {classroom && <span className="ml-2">• {classroom.name}</span>}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setModalType('path');
                        setModalMode('create');
                        setFormData({
                            title: '',
                            description: '',
                            is_published: false,
                            xp_reward: 0,
                            content_type: 'reading',
                            question_bank_id: ''
                        });
                        setModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                >
                    <Plus className="size-4.5" />
                    New Learning Path
                </button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <TreeSkeleton />
                    <TreeSkeleton />
                    <TreeSkeleton />
                </div>
            ) : treeData.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="size-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Learning Paths Yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Create your first learning path to get started.</p>
                    <button
                        onClick={() => {
                            setModalType('path');
                            setModalMode('create');
                            setFormData({
                                title: '',
                                description: '',
                                is_published: false,
                                xp_reward: 0,
                                content_type: 'reading',
                                question_bank_id: ''
                            });
                            setModalOpen(true);
                        }}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all"
                    >
                        Add Learning Path
                    </button>
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={getAllItems(treeData, 'path').map(n => n.id)} strategy={verticalListSortingStrategy}>
                        {treeData.map((node, idx) => (
                            <SortableTreeItem
                                key={node.id}
                                node={node}
                                onToggle={toggleExpand}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onAddChild={handleAddChild}
                                onMoveUp={(item) => handleReorder(item, 'up')}
                                onMoveDown={(item) => handleReorder(item, 'down')}
                                onTogglePublish={handleTogglePublish}
                                canMoveUp={idx > 0}
                                canMoveDown={idx < treeData.length - 1}
                                displayOrder={`${idx + 1}`}
                                publishingIds={publishingIds}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            )}

            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                            {modalMode === 'create' ? 'Add' : 'Edit'} {modalType === 'path' ? 'Learning Path' : modalType === 'unit' ? 'Learning Unit' : 'Learning Lesson'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder={`Enter ${modalType} title`}
                                />
                            </div>

                            {modalType === 'path' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="Optional description"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_published"
                                            checked={formData.is_published}
                                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                            className="rounded border-slate-300 text-primary focus:ring-primary/20"
                                        />
                                        <label htmlFor="is_published" className="text-sm text-slate-700 dark:text-slate-300">
                                            Publish immediately
                                        </label>
                                    </div>
                                </>
                            )}

                            {(modalType === 'unit' || modalType === 'lesson') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            XP Reward
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.xp_reward}
                                            onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                                            min="0"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_published"
                                            checked={formData.is_published}
                                            onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                            className="rounded border-slate-300 text-primary focus:ring-primary/20"
                                        />
                                        <label htmlFor="is_published" className="text-sm text-slate-700 dark:text-slate-300">
                                            Publish immediately
                                        </label>
                                    </div>
                                </>
                            )}

                            {modalType === 'lesson' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Content Type *
                                    </label>
                                    <select
                                        value={formData.content_type}
                                        onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        {contentTypeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!formData.title}
                                className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {modalMode === 'create' ? 'Create' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}