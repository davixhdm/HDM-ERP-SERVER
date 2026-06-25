const express = require('express');
const router = express.Router();
const {
  getProjects, getProject, createProject, updateProject, deleteProject,
  getTasks, createTask, updateTask, deleteTask, updateTaskStatus, reorderTasks,
  getProjectStats
} = require('../../controllers/tenant/projectController');

// Projects - list and create
router.get('/', getProjects);
router.post('/', createProject);
router.get('/stats', getProjectStats);

// Tasks
router.get('/:projectId/tasks', getTasks);
router.post('/:projectId/tasks', createTask);
router.put('/tasks/reorder', reorderTasks);
router.put('/tasks/:taskId', updateTask);
router.put('/tasks/:taskId/status', updateTaskStatus);
router.delete('/tasks/:taskId', deleteTask);

// Project by ID - LAST
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

module.exports = router;