import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Edit3, Calendar, Clock, AlertCircle } from 'lucide-react';
import { todoService, type Todo, type CreateTodoRequest } from '@/service/todo.server';

interface TodoSectionProps {
  userRole: 'coach' | 'parent';
}

const TodoSection: React.FC<TodoSectionProps> = ({ userRole }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await todoService.getLatestTodos();
      if (response.success && response.data.todos) {
        const sortedTodos = todoService.sortTodosByPriority(response.data.todos);
        setTodos(sortedTodos);
      } else {
        setError('Failed to fetch todos. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      setError('Failed to load todos. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate) return;

    try {
      if (editingTodo) {
        // Update existing todo
        const response = await todoService.updateTodo(editingTodo._id, {
          title: formData.title,
          dueDate: formData.dueDate,
          timezone: formData.timezone
        });
        if (response.success) {
          setTodos(prev => prev.map(todo => 
            todo._id === editingTodo._id ? response.data : todo
          ));
        }
      } else {
        // Create new todo
        const createData: CreateTodoRequest = {
          title: formData.title,
          dueDate: formData.dueDate,
          timezone: formData.timezone
        };
        const response = await todoService.createTodo(createData);
        if (response.success) {
          setTodos(prev => [response.data, ...prev]);
        }
      }
      
      // Reset form
      setFormData({ title: '', dueDate: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      setShowAddForm(false);
      setEditingTodo(null);
    } catch (error) {
      console.error('Error saving todo:', error);
      setError('Failed to save todo. Please try again.');
    }
  };

  const handleToggleStatus = async (todo: Todo) => {
    try {
      const response = await todoService.toggleTodoStatus(todo._id, todo.isCompleted);
      if (response.success) {
        setTodos(prev => prev.map(t => 
          t._id === todo._id ? response.data : t
        ));
      }
    } catch (error) {
      console.error('Error toggling todo status:', error);
      setError('Failed to update todo status. Please try again.');
    }
  };

  const handleDelete = async (todoId: string) => {
    try {
      const response = await todoService.deleteTodo(todoId);
      if (response.success) {
        setTodos(prev => prev.filter(t => t._id !== todoId));
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      setError('Failed to delete todo. Please try again.');
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      dueDate: new Date(todo.dueDate).toISOString().split('T')[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setFormData({ title: '', dueDate: '', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    setShowAddForm(false);
  };

  const getPriorityColor = (todo: Todo) => {
    if (todoService.isOverdue(todo)) return 'border-red-500 bg-red-50';
    if (todoService.isDueSoon(todo)) return 'border-orange-500 bg-orange-50';
    return 'border-gray-300 bg-white';
  };

  const getPriorityIcon = (todo: Todo) => {
    if (todoService.isOverdue(todo)) return '🔴';
    if (todoService.isDueSoon(todo)) return '🟠';
    return '⚪';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading todos...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchTodos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {userRole === 'coach' ? 'Coach Tasks' : 'Parent Tasks'}
            </h2>
            <p className="text-sm text-gray-500">Manage your daily tasks and priorities</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingTodo ? 'Update Task' : 'Add Task'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No tasks yet</p>
            <p className="text-xs text-gray-400">Add your first task to get started</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo._id}
              className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${getPriorityColor(todo)}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleStatus(todo)}
                  className="flex-shrink-0 mt-1"
                >
                  {todo.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 hover:text-green-500" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${todo.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {todo.title}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{todoService.formatDueDate(todo.dueDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(todo.dueDate).toLocaleDateString()}</span>
                    </div>
                    <span className="text-lg">{getPriorityIcon(todo)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(todo)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit task"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(todo._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Stats */}
      {todos.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {todos.filter(t => !t.isCompleted).length}
                </div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {todos.filter(t => t.isCompleted).length}
                </div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {todos.filter(t => todoService.isOverdue(t)).length}
                </div>
                <div className="text-xs text-gray-600">Overdue</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Total Tasks</div>
              <div className="text-2xl font-bold text-gray-900">{todos.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoSection;
