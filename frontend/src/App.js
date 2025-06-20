import React, { useEffect, useState } from 'react';
import './App.css';

const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low'];

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ text: '', description: '', priority: 'Medium', dueDate: '', progress: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editTask, setEditTask] = useState({ text: '', description: '', priority: 'Medium', dueDate: '', progress: 0 });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Backend API URL
  const API_URL = 'http://localhost:5000/tasks';

  // Fetch tasks from backend
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTasks(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch tasks');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Replace add-task form with modal logic
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // Add a new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.text.trim()) return;
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (!res.ok) throw new Error('Failed to add task');
      setNewTask({ text: '', description: '', priority: 'Medium', dueDate: '' });
      fetchTasks();
      setShowModal(false);
    } catch (err) {
      setError('Failed to add task');
    }
  };

  // Delete a task
  const handleDeleteTask = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  // Toggle completed
  const handleToggleCompleted = async (task) => {
    try {
      const res = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      });
      if (!res.ok) throw new Error('Failed to update task');
      fetchTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  // Start editing
  const handleEditStart = (task) => {
    setEditId(task.id);
    setEditTask({
      text: task.text,
      description: task.description || '',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate || ''
    });
    setShowEditModal(true);
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditId(null);
    setEditTask({ text: '', description: '', priority: 'Medium', dueDate: '' });
    setShowEditModal(false);
  };

  // Save edited task
  const handleEditSave = async (task) => {
    if (!editTask.text.trim()) return;
    try {
      const res = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTask)
      });
      if (!res.ok) throw new Error('Failed to update task');
      setEditId(null);
      setEditTask({ text: '', description: '', priority: 'Medium', dueDate: '' });
      setShowEditModal(false);
      fetchTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  // Filtering and searching
  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.text.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter =
      filter === 'All' ||
      (filter === 'Completed' && task.completed) ||
      (filter === 'In Progress' && !task.completed) ||
      (filter === 'Urgent' && task.priority === 'Urgent');
    return matchesSearch && matchesFilter;
  });

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const inProgressTasks = tasks.filter(t => !t.completed).length;
  const urgentTasks = tasks.filter(t => t.priority === 'Urgent').length;

  return (
    <div className="dashboard-bg">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="app-logo">🟣</div>
          <div>
            <h2>TaskFlow</h2>
            <span className="subtitle">Unique Task Manager</span>
          </div>
        </div>
        <div className="sidebar-stats">
          <div className="stat total">Total Tasks <span>{totalTasks}</span></div>
          <div className="stat completed">Completed <span>{completedTasks}</span></div>
          <div className="stat inprogress">In Progress <span>{inProgressTasks}</span></div>
          <div className="stat urgent">{urgentTasks} Urgent Tasks</div>
        </div>
        <div className="sidebar-actions">
          <div>📅 Today's Tasks</div>
          <div>⏰ Overdue</div>
          <div>👤 Assigned to Me</div>
        </div>
      </aside>
      <main className="main-content">
        <header className="main-header">
          <div>
            <h1>My Tasks</h1>
            <span className="main-subtitle">Manage your work with style</span>
          </div>
          <button className="add-task-btn" onClick={handleOpenModal}>+ Add Task</button>
        </header>
        <div className="search-filter-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
        {/* Modal for Add Task */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
              <h2>Create New Task</h2>
              <form onSubmit={handleAddTask} className="modal-task-form">
                <input
                  type="text"
                  value={newTask.text}
                  onChange={e => setNewTask({ ...newTask, text: e.target.value })}
                  placeholder="Task title"
                  required
                />
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description"
                  rows={3}
                />
                <div className="modal-row">
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
                <button type="submit" className="modal-create-btn">Create Task</button>
              </form>
            </div>
          </div>
        )}
        {/* Edit Task Modal */}
        {showEditModal && (
          <div className="modal-overlay" onClick={handleEditCancel}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={handleEditCancel}>&times;</button>
              <h2>Edit Task</h2>
              <form onSubmit={e => { e.preventDefault(); handleEditSave(tasks.find(t => t.id === editId)); }} className="modal-task-form">
                <input
                  type="text"
                  value={editTask.text}
                  onChange={e => setEditTask({ ...editTask, text: e.target.value })}
                  placeholder="Task title"
                  required
                />
                <textarea
                  value={editTask.description}
                  onChange={e => setEditTask({ ...editTask, description: e.target.value })}
                  placeholder="Task description"
                  rows={3}
                />
                <div className="modal-row">
                  <select
                    value={editTask.priority}
                    onChange={e => setEditTask({ ...editTask, priority: e.target.value })}
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input
                    type="date"
                    value={editTask.dueDate}
                    onChange={e => setEditTask({ ...editTask, dueDate: e.target.value })}
                  />
                </div>
                <button type="submit" className="modal-create-btn">Save</button>
              </form>
            </div>
          </div>
        )}
        {loading ? (
          <p>Loading tasks...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="task-grid dashboard-grid">
            {filteredTasks.length === 0 ? (
              <div className="task-card empty">No tasks found!</div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className={`task-card dashboard-card${task.completed ? ' completed' : ''}`}>
                  <div className="task-card-content dashboard-card-content">
                    <div className="task-badges">
                      <span className={`priority-badge ${task.priority.toLowerCase()}`}>{task.priority}</span>
                      {task.completed && <span className="done-badge">Done</span>}
                    </div>
                    <div className="task-title-row">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleCompleted(task)}
                        title="Mark as completed"
                      />
                      <span className="task-text dashboard-title" onDoubleClick={() => handleEditStart(task)} title="Double-click to edit">
                        {task.text}
                      </span>
                    </div>
                    <div className="task-desc">{task.description}</div>
                    <div className="task-meta-row">
                      <span className={task.dueDate ? "task-date" : "task-date invisible"}>{task.dueDate || 'placeholder'}</span>
                    </div>
                    <button onClick={() => handleEditStart(task)} className="edit-btn" title="Edit"><span role="img" aria-label="edit">✏️</span></button>
                    <button onClick={() => handleDeleteTask(task.id)} className="delete-btn" title="Delete"><span role="img" aria-label="delete">🗑️</span></button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
