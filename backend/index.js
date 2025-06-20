const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// SQLite setup
const db = new sqlite3.Database('./tasks.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    description TEXT,
    priority TEXT,
    dueDate TEXT
  )`);
});

// Get all tasks
app.get('/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    // Convert completed from 0/1 to boolean
    const tasks = rows.map(row => ({ ...row, completed: !!row.completed }));
    res.json(tasks);
  });
});

// Add a new task
app.post('/tasks', (req, res) => {
  const { text, description = '', priority = 'Medium', dueDate = '' } = req.body;
  if (!text) return res.status(400).json({ error: 'Task text is required' });
  db.run(
    'INSERT INTO tasks (text, completed, description, priority, dueDate) VALUES (?, 0, ?, ?, ?)',
    [text, description, priority, dueDate],
    function (err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      db.get('SELECT * FROM tasks WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ ...row, completed: !!row.completed });
      });
    }
  );
});

// Update a task
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { text, completed, description, priority, dueDate } = req.body;
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
    if (err || !task) return res.status(404).json({ error: 'Task not found' });
    const newText = typeof text === 'string' ? text : task.text;
    const newCompleted = typeof completed === 'boolean' ? (completed ? 1 : 0) : task.completed;
    const newDescription = typeof description === 'string' ? description : task.description;
    const newPriority = typeof priority === 'string' ? priority : task.priority;
    const newDueDate = typeof dueDate === 'string' ? dueDate : task.dueDate;
    db.run(
      'UPDATE tasks SET text = ?, completed = ?, description = ?, priority = ?, dueDate = ? WHERE id = ?',
      [newText, newCompleted, newDescription, newPriority, newDueDate, id],
      function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, row) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          res.json({ ...row, completed: !!row.completed });
        });
      }
    );
  });
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 