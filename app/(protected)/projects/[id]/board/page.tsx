'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { 
  ArrowLeft, 
  Plus,
  MoreVertical,
  Calendar,
  User,
  Tag as TagIcon,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  getProjectBoardItems,
  addProjectBoardItem,
  updateProjectBoardItem,
  deleteProjectBoardItem,
  type ProjectBoardItem
} from '@/lib/supabase/projects';
import { createClient } from '@/lib/supabase/client';
import { InlineNotification, notify } from '@/components/ui/inline-notification';

const BOARD_COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'review', label: 'Review', color: 'bg-yellow-100' },
  { id: 'done', label: 'Done', color: 'bg-green-100' },
];

const PRIORITY_COLORS = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [items, setItems] = useState<ProjectBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    status: 'todo' as const,
    priority: 'medium' as const,
  });

  useEffect(() => {
    if (projectId) {
      loadBoardItems();
      setupRealtime();
    }
  }, [projectId]);

  const loadBoardItems = async () => {
    try {
      setIsLoading(true);
      const boardItems = await getProjectBoardItems(projectId);
      setItems(boardItems);
    } catch (error: any) {
      console.error('Error loading board items:', error);
      notify.error(error.message || 'Failed to load board');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtime = () => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`project-board-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_board_items',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => [...prev, payload.new as ProjectBoardItem]);
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(item => 
            item.id === payload.new.id ? payload.new as ProjectBoardItem : item
          ));
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(item => item.id !== payload.old.id));
        }
        loadBoardItems(); // Reload to get proper ordering
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddItem = async () => {
    if (!newItem.title.trim()) {
      notify.error('Title is required');
      return;
    }

    try {
      await addProjectBoardItem(projectId, {
        ...newItem,
        position: items.filter(i => i.status === newItem.status).length,
      });
      setNewItem({ title: '', description: '', status: 'todo', priority: 'medium' });
      setShowAddModal(false);
      notify.success('Item added');
    } catch (error: any) {
      notify.error(error.message || 'Failed to add item');
    }
  };

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedItem) return;

    try {
      const item = items.find(i => i.id === draggedItem);
      if (!item || item.status === newStatus) {
        setDraggedItem(null);
        return;
      }

      const itemsInNewColumn = items.filter(i => i.status === newStatus);
      await updateProjectBoardItem(draggedItem, {
        status: newStatus as any,
        position: itemsInNewColumn.length,
      });
      
      notify.success('Item moved');
    } catch (error: any) {
      notify.error(error.message || 'Failed to move item');
    } finally {
      setDraggedItem(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteProjectBoardItem(itemId);
      notify.success('Item deleted');
    } catch (error: any) {
      notify.error(error.message || 'Failed to delete item');
    }
  };

  const getItemsByStatus = (status: string) => {
    return items
      .filter(item => item.status === status)
      .sort((a, b) => a.position - b.position);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4780C6] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading board...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <InlineNotification className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50" />
        
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="max-w-[1920px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href={`/projects/${projectId}`}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Project Board</h1>
                  <p className="text-sm text-gray-500">Manage tasks and track progress</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>
        </header>

        {/* Board */}
        <div className="max-w-[1920px] mx-auto px-6 py-8">
          <div className="grid grid-cols-4 gap-6">
            {BOARD_COLUMNS.map((column) => {
              const columnItems = getItemsByStatus(column.id);
              
              return (
                <div
                  key={column.id}
                  className="flex flex-col"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                >
                  {/* Column Header */}
                  <div className={`${column.color} rounded-t-lg p-4 mb-2`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{column.label}</h3>
                      <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                        {columnItems.length}
                      </span>
                    </div>
                  </div>

                  {/* Column Items */}
                  <div className="flex-1 space-y-3 min-h-[400px]">
                    {columnItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => handleDragStart(item.id)}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-move"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900 flex-1">{item.title}</h4>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                            {item.priority}
                          </span>
                          {item.due_date && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <TagIcon className="w-3 h-3" />
                              {item.tags.length}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {columnItems.length === 0 && (
                      <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                        <p className="text-sm text-gray-400">No items</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Add Board Item</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter item title"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={newItem.status}
                      onChange={(e) => setNewItem(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6]"
                    >
                      {BOARD_COLUMNS.map(col => (
                        <option key={col.id} value={col.id}>{col.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newItem.priority}
                      onChange={(e) => setNewItem(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    onClick={handleAddItem}
                    className="flex-1 px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors"
                  >
                    Add Item
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewItem({ title: '', description: '', status: 'todo', priority: 'medium' });
                    }}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}











