import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Button, Input, Select, DatePicker, Form, Upload, message } from 'antd';
import { DocumentPlusIcon } from '@heroicons/react/24/outline';

const { TextArea } = Input;

const CreateTask = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  
  // Fetch users for assignment
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users/assignable');
        setUsers(response.data.map((user: any) => ({
          value: user._id,
          label: `${user.firstName} ${user.lastName}`
        })));
      } catch (error) {
        console.error('Error fetching users:', error);
        message.error('Failed to fetch users');
      }
    };
    fetchUsers();
  }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Append basic fields
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('status', values.status);
      formData.append('priority', values.priority);
      formData.append('dueDate', values.dueDate.toISOString());
      formData.append('assignedTo', values.assignedTo);

      // Append files if any
      if (values.attachments && values.attachments.fileList) {
        values.attachments.fileList.forEach((file: any) => {
          if (file.originFileObj) {
            formData.append('attachments', file.originFileObj);
          }
        });
      }

      // Log the request data for debugging
      console.log('Form values:', values);
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await api.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Task creation response:', response.data);
      message.success('Task created successfully');
      navigate('/tasks');
    } catch (error: any) {
      console.error('Error creating task:', error.response?.data || error);
      message.error(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          status: 'todo',
          priority: 'medium',
        }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please enter task title' }]}
        >
          <Input placeholder="Enter task title" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter task description' }]}
        >
          <TextArea rows={4} placeholder="Enter task description" />
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="todo">To Do</Select.Option>
            <Select.Option value="in_progress">In Progress</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="low">Low</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="high">High</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="dueDate"
          label="Due Date"
          rules={[{ required: true, message: 'Please select due date' }]}
        >
          <DatePicker className="w-full" />
        </Form.Item>

        <Form.Item
          name="assignedTo"
          label="Assign To"
          rules={[{ required: true, message: 'Please select assignee' }]}
        >
          <Select
            placeholder="Select assignee"
            options={users}
          />
        </Form.Item>

        <Form.Item
          name="attachments"
          label="Attachments"
        >
          <Upload 
            multiple 
            beforeUpload={() => false}
            accept=".pdf,.doc,.docx,.txt"
          >
            <Button icon={<DocumentPlusIcon className="h-5 w-5" />}>Select Files</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} className="w-full">
            Create Task
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CreateTask; 