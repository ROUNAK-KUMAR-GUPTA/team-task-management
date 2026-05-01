const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // Get all projects user belongs to
  const projects = db.prepare(`
    SELECT p.id FROM projects p
    JOIN project_members pm ON pm.project_id = p.id
    WHERE pm.user_id = ?
  `).all(userId).map(p => p.id);

  if (projects.length === 0) {
    return res.json({
      total_tasks: 0,
      by_status: { 'To Do': 0, 'In Progress': 0, 'Done': 0 },
      overdue: 0,
      tasks_per_user: [],
      my_tasks: 0
    });
  }

  const placeholders = projects.map(() => '?').join(',');

  // Total tasks across all user's projects
  const total = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders})`).get(...projects);

  // Tasks by status
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks
    WHERE project_id IN (${placeholders})
    GROUP BY status
  `).all(...projects);

  // Overdue tasks (due_date < today and status != Done)
  const overdue = db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE project_id IN (${placeholders})
    AND due_date IS NOT NULL AND due_date < ?
    AND status != 'Done'
  `).get(...projects, today);

  // Tasks per user
  const tasksPerUser = db.prepare(`
    SELECT u.name, COUNT(t.id) as count
    FROM tasks t
    JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id IN (${placeholders})
    GROUP BY t.assigned_to
    ORDER BY count DESC
  `).all(...projects);

  // My tasks
  const myTasks = db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE project_id IN (${placeholders}) AND assigned_to = ?
  `).get(...projects, userId);

  // Status map
  const statusMap = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
  byStatus.forEach(s => { statusMap[s.status] = s.count; });

  // Recent tasks
  const recentTasks = db.prepare(`
    SELECT t.*, p.name as project_name, u.name as assigned_to_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id IN (${placeholders})
    ORDER BY t.created_at DESC LIMIT 5
  `).all(...projects);

  res.json({
    total_tasks: total.count,
    by_status: statusMap,
    overdue: overdue.count,
    tasks_per_user: tasksPerUser,
    my_tasks: myTasks.count,
    recent_tasks: recentTasks,
    total_projects: projects.length
  });
});

module.exports = router;