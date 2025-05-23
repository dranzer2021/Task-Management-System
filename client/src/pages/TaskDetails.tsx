import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Document, Page } from 'react-pdf';
import * as pdfjs from 'pdfjs-dist';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { 
  PaperClipIcon, 
  UserIcon, 
  CalendarIcon, 
  FlagIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { setCurrentTask } from '../features/tasks/taskSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { RootState, Attachment } from '../types';
import api from '../utils/api';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFDocumentProxy {
  numPages: number;
}

const TaskDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentTask, isLoading, error } = useSelector((state: RootState) => state.tasks);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        if (!taskId) return;
        const response = await api.get(`/tasks/${taskId}`);
        dispatch(setCurrentTask(response.data));
      } catch (err) {
        console.error('Error fetching task details:', err);
      }
    };

    fetchTaskDetails();

    return () => {
      dispatch(setCurrentTask(null));
      // Cleanup any blob URLs when component unmounts
      if (selectedFile) {
        URL.revokeObjectURL(selectedFile);
      }
    };
  }, [taskId, dispatch]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentTask) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload only PDF files');
      return;
    }

    if (currentTask.attachments && currentTask.attachments.length >= 3) {
      alert('Maximum 3 attachments allowed');
      return;
    }

    const formData = new FormData();
    formData.append('attachments', file);

    try {
      const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update the task with the new attachment
      if (response.data && response.data.attachments) {
        dispatch(setCurrentTask({
          ...currentTask,
          attachments: response.data.attachments
        }));
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert(err instanceof Error ? err.message : 'Failed to upload file');
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this attachment?') || !currentTask) return;

    try {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);

      dispatch(setCurrentTask({
        ...currentTask,
        attachments: currentTask.attachments?.filter(a => a._id !== attachmentId) || []
      }));
    } catch (err) {
      console.error('Error deleting attachment:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete attachment');
    }
  };

  const handleViewAttachment = async (attachment: Attachment) => {
    try {
      const response = await api.get(`/tasks/${taskId}/attachments/${attachment._id}`, {
        responseType: 'blob'
      });
      
      // Clean up previous blob URL if exists
      if (selectedFile) {
        URL.revokeObjectURL(selectedFile);
      }
      
      const fileUrl = URL.createObjectURL(response.data);
      setSelectedFile(fileUrl);
    } catch (err) {
      console.error('Error viewing attachment:', err);
      alert('Failed to load PDF file');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: PDFDocumentProxy) => {
    setNumPages(numPages);
  };

  if (isLoading || !currentTask) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-semibold leading-6 text-gray-900">
                  {currentTask.title}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Task Details and Attachments
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Assigned To
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {currentTask.assignedTo ? 
                    `${currentTask.assignedTo.firstName} ${currentTask.assignedTo.lastName}` : 
                    'Unassigned'
                  }
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Status
                </dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  <span className={`px-2 py-1 text-sm rounded-full ${getStatusColor(currentTask.status)}`}>
                    {currentTask.status.replace('_', ' ').charAt(0).toUpperCase() + 
                     currentTask.status.replace('_', ' ').slice(1)}
                  </span>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Due Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : 'No due date'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FlagIcon className="h-5 w-5 mr-2" />
                  Priority
                </dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  <span className={`px-2 py-1 text-sm rounded-full ${getPriorityColor(currentTask.priority)}`}>
                    {currentTask.priority.charAt(0).toUpperCase() + currentTask.priority.slice(1)}
                  </span>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {currentTask.description || 'No description provided'}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <PaperClipIcon className="h-5 w-5 mr-2" />
                  Attachments
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <div className="space-y-4">
                    {currentTask?.attachments && currentTask.attachments.length > 0 ? (
                      currentTask.attachments.map((attachment) => (
                        <div key={attachment._id} className="flex items-center justify-between">
                          <button
                            onClick={() => handleViewAttachment(attachment)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {attachment.filename}
                          </button>
                          <button
                            onClick={() => handleDeleteAttachment(attachment._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    ) : (
                      <p>No attachments</p>
                    )}
                    
                    {(!currentTask.attachments || currentTask.attachments.length < 3) && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Add PDF attachment
                        </label>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="mt-1 block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100"
                        />
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-gray-900">PDF Preview</h4>
              <button
                onClick={() => {
                  URL.revokeObjectURL(selectedFile);
                  setSelectedFile(null);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <Document
              file={selectedFile}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<LoadingSpinner />}
            >
              {Array.from(new Array(numPages || 0), (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  className="mb-4"
                  loading={<LoadingSpinner />}
                />
              ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetails; 