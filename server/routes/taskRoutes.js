import express from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  downloadAttachment,
  uploadAttachment,
  deleteAttachment
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

// Attachment routes
router.post('/:id/attachments',
  checkResourceOwnership(Task),
  upload.array('attachments', 3),
  handleFileUploadError,
  uploadAttachment
);
router.get('/:id/attachments/:attachmentId', downloadAttachment);
router.delete('/:id/attachments/:attachmentId', checkResourceOwnership(Task), deleteAttachment);

// Other routes
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.delete('/:id', checkResourceOwnership(Task), deleteTask);

export default router; 