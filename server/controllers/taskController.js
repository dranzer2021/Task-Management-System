import Task from '../models/Task.js';
import { unlink } from 'fs/promises';
import path from 'path';

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    // console.log('Request body:', req.body);
    // console.log('Files:', req.files);

    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    // Validate required fields
    if (!title || !description || !status || !priority || !dueDate || !assignedTo) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: { title, description, status, priority, dueDate, assignedTo }
      });
    }

    // Create task
    const taskData = {
      title,
      description,
      status,
      priority,
      dueDate: new Date(dueDate),
      assignedTo,
      createdBy: req.user._id,
      attachments: []
    };

    // Add attachments if any
    if (req.files && req.files.length > 0) {
      taskData.attachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    // console.log('Creating task with data:', taskData);
    const task = await Task.create(taskData);

    // Populate assignedTo and createdBy fields
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ 
      message: 'Error creating task', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all tasks with filtering and pagination
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    // Add date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      filter.dueDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Build sort object
    let sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort = { createdAt: -1 }; // Default sort by creation date
    }

    // If user is not admin, only show tasks they created or are assigned to
    if (req.user.role !== 'admin') {
      filter.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    const tasks = await Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    const total = await Task.countDocuments(filter);

    res.json({
      tasks,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update basic fields
    Object.assign(task, req.body);

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      // Remove old files if replacing
      if (req.body.removeAttachments) {
        for (const attachment of task.attachments) {
          await unlink(attachment.path);
        }
        task.attachments = [];
      }

      // Add new files
      const newAttachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      }));

      task.attachments = [...task.attachments, ...newAttachments];
    }

    const updatedTask = await task.save();

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Delete associated files
    for (const attachment of task.attachments) {
      try {
        await unlink(attachment.path);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    await task.remove();

    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download task attachment
// @route   GET /api/tasks/:id/attachments/:attachmentId
// @access  Private
export const downloadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const attachment = task.attachments.id(req.params.attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    res.download(attachment.path, attachment.filename);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload task attachment
// @route   POST /api/tasks/:id/attachments
// @access  Private
export const uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const newAttachments = req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }));

    task.attachments.push(...newAttachments);
    await task.save();

    res.status(201).json({ 
      message: 'Attachments uploaded successfully',
      attachments: task.attachments 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task attachment
// @route   DELETE /api/tasks/:id/attachments/:attachmentId
// @access  Private
export const deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const attachment = task.attachments.id(req.params.attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Delete the file from the filesystem
    try {
      await unlink(attachment.path);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Remove the attachment from the task
    task.attachments.pull(req.params.attachmentId);
    await task.save();

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 