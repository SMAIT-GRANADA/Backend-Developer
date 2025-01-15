  const userService = require('../services/userService');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  const login = async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({
          status: false,
          message: 'Username dan password harus diisi'
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          username: username,
          isActive: true
        },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!user || user.password !== password) {
        return res.status(401).json({
          status: false,
          message: 'Username atau password salah'
        });
      }

      // Set session
      req.session.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        roles: user.roles.map(r => r.role.name)
      };

      return res.status(200).json({
        status: true,
        message: 'Login berhasil',
        data: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          roles: user.roles.map(r => r.role.name)
        }
      });

    } catch (error) {
      console.error('Error in login:', error);
      return res.status(500).json({
        status: false,
        message: 'Terjadi kesalahan internal server'
      });
    }
  };

  const createUser = async (req, res) => {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({
        status: true,
        message: 'User berhasil dibuat',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        status: false,
        message: error.message
      });
    }
  };

  const getAllUsers = async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({
        status: true,
        message: 'Data users berhasil diambil',
        data: users
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Gagal mengambil data users'
      });
    }
  };

  const getUserById = async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json({
        status: true,
        message: 'Data user berhasil diambil',
        data: user
      });
    } catch (error) {
      res.status(error.message === 'User tidak ditemukan' ? 404 : 500).json({
        status: false,
        message: error.message
      });
    }
  };

  const updateUser = async (req, res) => {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json({
        status: true,
        message: 'User berhasil diupdate',
        data: user
      });
    } catch (error) {
      res.status(error.message === 'User tidak ditemukan' ? 404 : 400).json({
        status: false,
        message: error.message
      });
    }
  };

  const deleteUser = async (req, res) => {
    try {
      await userService.deleteUser(req.params.id);
      res.status(200).json({
        status: true,
        message: 'User berhasil dihapus'
      });
    } catch (error) {
      res.status(error.message === 'User tidak ditemukan' ? 404 : 500).json({
        status: false,
        message: error.message
      });
    }
  };
  
  const logout = async (req, res) => {
    try {
      req.session.destroy();
      res.status(200).json({
        status: true,
        message: 'Logout berhasil'
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: 'Gagal melakukan logout'
      });
    }
  };

  module.exports = {
    login,
    logout,
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser
  };