import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Middleware to check if user can modify a resource
export const checkResourceOwnership = (Model) => async (req, res, next) => {
  try {
    const resource = await Model.findById(req.params.id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Allow admins to modify any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // For tasks, check if user is assigned to the task or created it
    if (Model.modelName === 'Task') {
      if (
        resource.assignedTo.toString() === req.user._id.toString() ||
        resource.createdBy.toString() === req.user._id.toString()
      ) {
        return next();
      }
    }

    // For users, check if user is modifying their own profile
    if (Model.modelName === 'User') {
      if (resource._id.toString() === req.user._id.toString()) {
        return next();
      }
    }

    return res.status(403).json({ message: 'Not authorized to modify this resource' });
  } catch (error) {
    next(error);
  }
}; 