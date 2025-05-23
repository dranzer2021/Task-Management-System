import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { RootState } from '@/types';
import { Button, Input, Select, DatePicker, Form, Upload, message } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
import {DocumentPlusIcon} from '@heroicons/react/24/outline'
import dayjs from 'dayjs';

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
        // Use the api instance which already has the base URL configured
        const response = await api.get('/users/assignable');
        console.log('Users response:', response);
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
      if (values.attachments) {
        values.attachments.fileList.forEach((file: any) => {
          formData.append('attachments', file.originFileObj);
        });
      }

      await api.post('/tasks', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      message.success('Task created successfully');
      navigate('/dashboard');
    } catch (error) {
      message.error('Failed to create task');
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
          status: 'pending',
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
            <Select.Option value="pending">Pending</Select.Option>
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
          <Upload multiple beforeUpload={() => false}>
            <Button icon={<DocumentPlusIcon />}>Select Files</Button>
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