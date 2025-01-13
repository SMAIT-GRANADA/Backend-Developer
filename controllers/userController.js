const userService = require('../services/userService');

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(error.message === 'User not found' ? 404 : 500).json({
      status: 'error',
      message: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    res.status(error.message === 'User not found' ? 404 : 400).json({
      status: 'error',
      message: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(error.message === 'User not found' ? 404 : 500).json({
      status: 'error',
      message: error.message
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};