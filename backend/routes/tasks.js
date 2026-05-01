const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Helper: check project membership and role
function getMembership(projectId, userId) {
  return db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
}

// Get all tasks for a project
router.get('/project/:projectId', authenticate, (req, res) => {
  const member = getMembership(req.params.projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Access denied' });

  const tasks = db.prepare(`
    SELECT t.*, 
      u1.name as assigned_to_name, 
      u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assigned_to
    LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.project_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.projectId);
  res.json(tasks);
});

// Get tasks assigned to current user (all projects)
router.get('/my', authenticate, (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, p.name as project_name,
      u1.name as assigned_to_name,
      u2.name as created_by_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u1 ON u1.id = t.assigned_to
    LEFT JOIN users u2 ON u2.id = t.created_by
    JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
    WHERE t.assigned_to = ? OR pm.role = 'Admin'
    ORDER BY t.due_date ASC
  `).all(req.user.id, req.user.id);
  res.json(tasks);
});

// Create task (Admin only)
router.post('/', authenticate, (req, res) => {
  const { title, description, due_date, priority, project_id, assigned_to } = req.body;
  if (!title || !project_id) return res.status(400).json({ error: 'Title and project_id are required' });

  const member = getMembership(project_id, req.user.id);
  if (!member || member.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });

  const result = db.prepare(`
    INSERT INTO tasks (title, description, due_date, priority, project_id, assigned_to, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, description || '', due_date || null, priority || 'Medium', project_id, assigned_to || null, req.user.id);

  const task = db.prepare(`
    SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assigned_to
    LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.json(task);
});

// Update task
router.put('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = getMembership(task.project_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Access denied' });

  const { title, description, due_date, priority, status, assigned_to } = req.body;

  if (member.role === 'Admin') {
    // Admin can update everything
    db.prepare(`
      UPDATE tasks SET title=?, description=?, due_date=?, priority=?, status=?, assigned_to=? WHERE id=?
    `).run(title ?? task.title, description ?? task.description, due_date ?? task.due_date,
          priority ?? task.priority, status ?? task.status, assigned_to ?? task.assigned_to, req.params.id);
  } else {
    // Member can only update status of their own tasks
    if (task.assigned_to !== req.user.id) return res.status(403).json({ error: 'You can only update your own tasks' });
    if (status) db.prepare('UPDATE tasks SET status=? WHERE id=?').run(status, req.params.id);
  }

  const updated = db.prepare(`
    SELECT t.*, u1.name as assigned_to_name, u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assigned_to
    LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.id = ?
  `).get(req.params.id);
  res.json(updated);
});

// Delete task (Admin only)
router.delete('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const member = getMembership(task.project_id, req.user.id);
  if (!member || member.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;