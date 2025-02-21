const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const userService = require('../services/userService');
const authService = require('../services/authService');
const Mailer = require('../libs/mailer')
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
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    const result = await userService.getAllUsers(page, limit);

    return res.json({
      status: true,
      message: 'Data user berhasil diambil',
      data: result.data,
      meta: result.meta
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
    await userService.deleteUser(id);

    return res.json({
      status: true,
      message: 'User berhasil dihapus'
    });

  } catch (error) {
    console.error('Delete user error:', error);

    if (error.message.includes('Tidak dapat menghapus')) {
      return res.status(403).json({
        status: false,
        message: error.message
      });
    }

    if (error.message.includes('tidak ditemukan')) {
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

async function forgotPassword(req, res) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        status: false,
        message: 'Username harus diisi'
      });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'Username tidak terdaftar'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      }
    });

    await Mailer.sendPasswordResetEmail(user.email, otp);

    return res.json({
      status: true,
      message: 'OTP telah dikirim ke email Anda'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}

async function verifyOtp(req, res) {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        status: false,
        message: 'OTP harus diisi'
      });
    }
    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        otp,
        expiresAt: { gt: new Date() },
        isUsed: false,
        isVerified: false
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true
      }
    });

    if (!passwordReset) {
      return res.status(400).json({
        status: false,
        message: 'OTP tidak valid atau sudah kadaluarsa'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: {
        resetToken,
        isVerified: true
      }
    });

    return res.json({
      status: true,
      message: 'OTP terverifikasi',
      data: {
        resetToken
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan internal server'
    });
  }
}
async function resetPassword(req, res) {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: 'Token reset, password baru, dan konfirmasi password harus diisi'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: 'Password baru dan konfirmasi password tidak cocok'
      });
    }

    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        resetToken,
        isVerified: true,
        isUsed: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true
      }
    });

    if (!passwordReset) {
      return res.status(400).json({
        status: false,
        message: 'Token reset tidak valid atau sudah kadaluarsa'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: false,
        message: 'Password minimal 8 karakter'
      });
    }

    await userService.updateUser(passwordReset.userId, { password: newPassword });

    await prisma.passwordReset.update({
      where: { id: passwordReset.id },
      data: { isUsed: true }
    });

    await authService.invalidateAllUserTokens(passwordReset.userId);

    await Mailer.sendPasswordChangeNotification(passwordReset.user.email);

    return res.json({
      status: true,
      message: 'Password berhasil direset'
    });

  } catch (error) {
    console.error('Reset password error:', error);
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
  updatePassword,
  forgotPassword,
  verifyOtp,
  resetPassword
};