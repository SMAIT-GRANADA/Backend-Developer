const { PrismaClient } = require('@prisma/client');
const userService = require('../services/userService');
const authService = require('../services/authService');

const prisma = new PrismaClient();

// Login handler
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        status: false,
        message: 'Username dan password harus diisi'
      });
    }
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Username atau password salah'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        status: false,
        message: 'Akun anda tidak aktif. Silakan hubungi administrator'
      });
    }

    // Validate password
    const isValid = await userService.validatePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        status: false,
        message: 'Username atau password salah'
      });
    }

    // Generate tokens
    const tokens = authService.generateTokens(user);

    await authService.saveToken(user.id, tokens.refreshToken);
    req.session.user = {
      id: user.id,
      username: user.username,
      roles: user.roles.map(r => r.role.name),
      accessToken: tokens.accessToken, 
      refreshToken: tokens.refreshToken
    };

    return res.json({
      status: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          roles: user.roles.map(r => r.role.name)
        },
        tokens
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

// Logout handler
async function logout(req, res) {
  try {
    if (req.session.user) {
      await authService.invalidateToken(req.session.user.refreshToken);
      req.session.destroy();
    }

    return res.json({
      status: true,
      message: 'Logout berhasil'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      status: false, 
      message: 'Terjadi kesalahan internal server'
    });
  }
}

// Create new user
async function createUser(req, res) {
  try {
    const userData = req.body;

    if (!userData.username || !userData.password || !userData.name || !userData.email || !userData.roleId) {
      return res.status(400).json({
        status: false,
        message: 'Data user tidak lengkap'
      });
    }

    const result = await userService.createUser(userData);

    return res.status(201).json({
      status: true,
      message: 'User berhasil dibuat',
      data: result
    });

  } catch (error) {
    console.error('Create user error:', error);

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        status: false,
        message: error.message
      });
    }

    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

// Get all users
async function getAllUsers(req, res) {
  try {
    const users = await userService.getAllUsers();

    return res.json({
      status: true,
      message: 'Data user berhasil diambil',
      data: users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

// Get user by ID
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User tidak ditemukan'
      });
    }

    return res.json({
      status: true,
      message: 'Data user berhasil diambil',
      data: user
    });

  } catch (error) {
    console.error('Get user by id error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

// Update user
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const userData = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }

    const currentUser = await userService.getUserById(id);
    if (currentUser.roles.some(r => r.role.name === 'superadmin') && 
        !req.user.roles.includes('superadmin')) {
      return res.status(403).json({
        status: false,
        message: 'Tidak dapat mengubah data superadmin'
      });
    }

    const updatedUser = await userService.updateUser(id, userData);

    return res.json({
      status: true,
      message: 'User berhasil diperbarui',
      data: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: false,
        message: error.message
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        status: false,
        message: error.message
      });
    }

    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

// Delete user
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({
        status: false,
        message: 'ID tidak valid'
      });
    }
    const currentUser = await userService.getUserById(id);
    if (currentUser.roles.some(r => r.role.name === 'superadmin')) {
      return res.status(403).json({
        status: false,
        message: 'Tidak dapat menghapus akun superadmin'
      });
    }

    await userService.deleteUser(id);

    return res.json({
      status: true,
      message: 'User berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete user error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: false,
        message: error.message
      });
    }

    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function getProfile(req, res) {
  try {
    const user = await userService.getUserById(req.user.id);

    return res.json({
      status: true,
      message: 'Profile berhasil diambil',
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

// Update current user's password
async function updatePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        message: 'Password lama dan baru harus diisi'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    const isValid = await userService.validatePassword(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({
        status: false,
        message: 'Password lama tidak sesuai'
      });
    }

    await userService.updateUser(req.user.id, { password: newPassword });

    await authService.invalidateAllUserTokens(req.user.id);
    req.session.destroy();

    return res.json({
      status: true,
      message: 'Password berhasil diperbarui. Silakan login kembali'
    });

  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

module.exports = {
  login,
  logout,
  createUser,
  getAllUsers, 
  getUserById,
  updateUser,
  deleteUser,
  getProfile,
  updatePassword
};