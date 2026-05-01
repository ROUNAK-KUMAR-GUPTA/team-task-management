const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// Get all projects for current user
router.get('/', authenticate, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.name as admin_name, pm.role as my_role
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id
    JOIN users u ON u.id = p.admin_id
    WHERE pm.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(projects);
});

// Create project
router.post('/', authenticate, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const result = db.prepare('INSERT INTO projects (name, description, admin_id) VALUES (?, ?, ?)').run(name, description || '', req.user.id);
  // Add creator as Admin member
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.user.id, 'Admin');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.json(project);
});

// Get single project
router.get('/:id', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Access denied' });

  const project = db.prepare('SELECT p.*, u.name as admin_name FROM projects p JOIN users u ON u.id = p.admin_id WHERE p.id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `).all(req.params.id);

  res.json({ ...project, members, my_role: member.role });
});

// Update project (Admin only)
router.put('/:id', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member || member.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });

  const { name, description } = req.body;
  db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?').run(name, description, req.params.id);
  res.json({ success: true });
});

// Delete project (Admin only)
router.delete('/:id', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member || member.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Add member (Admin only)
router.post('/:id/members', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member || member.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });

  const { user_id, role } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  try {
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, user_id, role || 'Member');
    res.json({ success: true, user });
  } catch (e) {
    res.status(409).json({ error: 'User already a member' });
  }
});

// Remove member (Admin only)
router.delete('/:id/members/:userId', authenticate, (req, res) => {
  const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member || member.role !== 'Admin') return res.status(403).json({ error: 'Admins only' });

  if (parseInt(req.params.userId) === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' });

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ success: true });
});

module.exports = router;