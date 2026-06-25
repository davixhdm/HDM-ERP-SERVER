const Project = require('../../models/tenant/Project');
const Task = require('../../models/tenant/Task');
const logger = require('../../utils/logger');

// ==================== PROJECTS ====================

const getProjects = async (req, res) => {
  try {
    const { status, client, search, page = 1, limit = 50 } = req.query;
    const filter = { tenantId: req.tenantId };
    if (status && status !== 'all') filter.status = status;
    if (client) filter.client = client;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('client', 'companyName')
        .populate('manager', 'firstName lastName')
        .populate('team', 'firstName lastName')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Project.countDocuments(filter)
    ]);

    // Get task counts per project
    const projectIds = projects.map(p => p._id);
    const taskCounts = await Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: '$projectId', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } }
    ]);

    const countMap = {};
    taskCounts.forEach(tc => { countMap[tc._id.toString()] = tc; });

    const data = projects.map(p => ({
      ...p.toObject(),
      taskCount: countMap[p._id.toString()]?.total || 0,
      doneCount: countMap[p._id.toString()]?.done || 0
    }));

    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    logger.error('Get projects error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, tenantId: req.tenantId })
      .populate('client', 'companyName email phone')
      .populate('manager', 'firstName lastName email')
      .populate('team', 'firstName lastName email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    logger.error('Get project error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description, status, priority, startDate, endDate, budget, client, manager, team } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Project name required' });

    const project = await Project.create({
      tenantId: req.tenantId,
      name, description, status, priority, startDate, endDate,
      budget: budget || 0, client, manager, team: team || [],
      createdBy: req.user._id
    });

    const populated = await Project.findById(project._id)
      .populate('client', 'companyName')
      .populate('manager', 'firstName lastName')
      .populate('team', 'firstName lastName');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    logger.error('Create project error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true }
    ).populate('client', 'companyName').populate('manager', 'firstName lastName').populate('team', 'firstName lastName');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    logger.error('Update project error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    await Task.deleteMany({ projectId: project._id });
    res.json({ success: true, message: 'Project and associated tasks deleted' });
  } catch (err) {
    logger.error('Delete project error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== TASKS ====================

const getTasks = async (req, res) => {
  try {
    const filter = { tenantId: req.tenantId, projectId: req.params.projectId };
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'firstName lastName')
      .populate('dependencies', 'title status')
      .sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) {
    logger.error('Get tasks error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo, dueDate, estimatedHours, dependencies } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Task title required' });

    const maxOrder = await Task.findOne({ tenantId: req.tenantId, projectId: req.params.projectId })
      .sort({ order: -1 }).select('order');
    const order = (maxOrder?.order || 0) + 1;

    const task = await Task.create({
      tenantId: req.tenantId,
      projectId: req.params.projectId,
      title, description, status, priority, assignedTo, dueDate,
      estimatedHours: estimatedHours || 0, dependencies: dependencies || [],
      order, createdBy: req.user._id
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName')
      .populate('dependencies', 'title status');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    logger.error('Create task error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, tenantId: req.tenantId },
      req.body,
      { new: true }
    ).populate('assignedTo', 'firstName lastName').populate('dependencies', 'title status');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    logger.error('Update task error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.taskId, tenantId: req.tenantId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    // Remove from dependencies
    await Task.updateMany({ dependencies: task._id }, { $pull: { dependencies: task._id } });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    logger.error('Delete task error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['todo', 'in_progress', 'review', 'done'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, tenantId: req.tenantId },
      { status },
      { new: true }
    ).populate('assignedTo', 'firstName lastName');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    logger.error('Update task status error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const reorderTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) return res.status(400).json({ success: false, message: 'Tasks array required' });

    const ops = tasks.map(({ _id, order, status, projectId }) => ({
      updateOne: {
        filter: { _id, tenantId: req.tenantId },
        update: { order, status, projectId }
      }
    }));

    await Task.bulkWrite(ops);
    res.json({ success: true, message: 'Tasks reordered' });
  } catch (err) {
    logger.error('Reorder tasks error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ==================== STATS ====================

const getProjectStats = async (req, res) => {
  try {
    const projects = await Project.find({ tenantId: req.tenantId });
    const tasks = await Task.find({ tenantId: req.tenantId });

    const statusCounts = { planning: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 };
    let totalBudget = 0;

    projects.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      totalBudget += p.budget || 0;
    });

    const taskStatusCounts = { todo: 0, in_progress: 0, review: 0, done: 0 };
    tasks.forEach(t => { taskStatusCounts[t.status] = (taskStatusCounts[t.status] || 0) + 1; });

    res.json({
      success: true,
      data: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        projectStatusCounts: statusCounts,
        taskStatusCounts,
        totalBudget,
        completionRate: tasks.length > 0 ? Math.round((taskStatusCounts.done / tasks.length) * 100) : 0
      }
    });
  } catch (err) {
    logger.error('Get project stats error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getProjects, getProject, createProject, updateProject, deleteProject,
  getTasks, createTask, updateTask, deleteTask, updateTaskStatus, reorderTasks,
  getProjectStats
};