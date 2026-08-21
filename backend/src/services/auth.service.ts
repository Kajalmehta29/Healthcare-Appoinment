import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'medsync-super-secret-key-12345';

export class AuthService {
  static async login(email: string, password?: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new Error('INVALID_PASSWORD');
      }
    } else {
      console.log(`Demo passwordless login allowed: ${email}`);
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    };
  }

  static async register(email: string, name: string, password?: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('EMAIL_ALREADY_IN_USE');
    }

    const hashedPassword = await bcrypt.hash(password || 'password', 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: 'PATIENT',
        patientProfile: {
          create: {
            name,
            email: email.toLowerCase(),
          },
        },
      },
    });

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }

  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }

  static async updateProfile(userId: string, data: { name: string; email: string; phone?: string | null; password?: string | null }) {
    const updateData: any = {
      name: data.name,
      email: data.email.toLowerCase(),
    };

    if (data.phone) {
      updateData.phone = data.phone;
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    if (updatedUser.role === 'PATIENT') {
      await prisma.patientProfile.update({
        where: { userId },
        data: { name: data.name, email: data.email.toLowerCase(), phone: data.phone },
      });
    } else if (updatedUser.role === 'DOCTOR') {
      await prisma.doctorProfile.update({
        where: { userId },
        data: { name: data.name, email: data.email.toLowerCase(), phone: data.phone },
      });
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
      phone: updatedUser.phone,
      createdAt: updatedUser.createdAt,
    };
  }
}
