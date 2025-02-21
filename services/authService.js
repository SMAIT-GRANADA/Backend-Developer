const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const authConfig = require("../config/auth");

function generateTokens(user) {
  if (!authConfig.accessToken.secret) {
    throw new Error('JWT_ACCESS_SECRET tidak dikonfigurasi');
  }
  if (!authConfig.refreshToken.secret) {
    throw new Error('JWT_REFRESH_SECRET tidak dikonfigurasi');
  }

  const accessToken = jwt.sign(
    {
      id: user.id,
      username: user.username,
      roles: user.roles.map((r) => r.role.name),
    },
    authConfig.accessToken.secret,
    { expiresIn: authConfig.accessToken.expiresIn }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    authConfig.refreshToken.secret,
    { expiresIn: authConfig.refreshToken.expiresIn }
  );

  return { accessToken, refreshToken };
}

async function verifyAccessToken(token) {
  try {
    return jwt.verify(token, authConfig.accessToken.secret);
  } catch (error) {
    throw new Error("Invalid access token");
  }
}

async function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, authConfig.refreshToken.secret);
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
}

async function saveToken(userId, refreshToken) {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);

  await invalidateAllUserTokens(userId);

  return await prisma.token.create({
    data: {
      userId,
      refreshToken,
      expiresAt: expirationDate,
    },
  });
}

async function invalidateToken(refreshToken) {
  return await prisma.token.updateMany({
    where: {
      refreshToken,
      isValid: true,
    },
    data: {
      isValid: false,
    },
  });
}

async function invalidateAllUserTokens(userId) {
  return await prisma.token.updateMany({
    where: {
      userId,
      isValid: true,
    },
    data: {
      isValid: false,
    },
  });
}

async function refreshAccessToken(refreshToken) {
  try {
    const decoded = await verifyRefreshToken(refreshToken);

    const tokenRecord = await prisma.token.findFirst({
      where: {
        refreshToken,
        isValid: true,
        userId: decoded.id,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!tokenRecord) {
      throw new Error("Invalid refresh token");
    }

    return jwt.sign(
      {
        id: tokenRecord.user.id,
        username: tokenRecord.user.username,
        roles: tokenRecord.user.roles.map((r) => r.role.name),
      },
      authConfig.accessToken.secret,
      { expiresIn: authConfig.accessToken.expiresIn }
    );
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
}

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  saveToken,
  invalidateToken,
  invalidateAllUserTokens,
  refreshAccessToken,
};