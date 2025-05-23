import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  downloadAttachment
} from '../controllers/taskController.js';
import { protect, checkResourceOwnership } from '../middleware/auth.js';
import upload, { handleFileUploadError } from '../middleware/upload.js';
import Task from '../models/Task.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes with file upload
router.post('/', upload.array('attachments', 3), handleFileUploadError, createTask);
router.put('/:id', 
  checkResourceOwnership(Task),
  upload.array('attachments', 3),
  handleFileUploadError,
  updateTask
);

// Other routes
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.delete('/:id', checkResourceOwnership(Task), deleteTask);
router.get('/:id/attachments/:attachmentId', downloadAttachment);

export default router; 