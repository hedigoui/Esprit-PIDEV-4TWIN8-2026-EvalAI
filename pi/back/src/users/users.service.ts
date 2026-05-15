// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
//   UnauthorizedException,
//   Inject,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { MongoRepository } from 'typeorm';
// import { ObjectId } from 'mongodb';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcrypt';
// import { Users, UserRole } from './users.models';
// import { EmailService } from '../email/email.service';

// @Injectable()
// export class UsersService {
//   constructor(
//     @InjectRepository(Users)
//     private readonly userRepository: MongoRepository<Users>,
//     private readonly jwtService: JwtService,
//     private readonly emailService: EmailService,
//   ) {}

//   async create(data: {
//     email: string;
//     password: string;
//     firstName: string;
//     lastName: string;
//     role: UserRole;
//     isActive: boolean;
//   }): Promise<Users> {
//     try {
//       console.log('📝 Creating user with email:', data.email);

//       const existingUser = await this.userRepository.findOneBy({
//         email: data.email,
//       });

//       if (existingUser) {
//         throw new BadRequestException('Email already exists');
//       }

//       const hashedPassword = await bcrypt.hash(data.password, 10);
//       console.log('✅ Password hashed successfully');

//       const user = this.userRepository.create({
//         email: data.email,
//         password: hashedPassword,
//         firstName: data.firstName,
//         lastName: data.lastName,
//         role: data.role,
//         isActive: data.isActive ?? true,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       });

//       const savedUser = await this.userRepository.save(user);
//       console.log('✅ User saved successfully with ID:', savedUser._id);

//       // Send welcome email (don't await - let it run in background)
//       this.emailService.sendWelcomeEmail(
//         savedUser.email,
//         `${savedUser.firstName} ${savedUser.lastName}`
//       ).catch(error => {
//         console.error('Background email sending failed:', error.message);
//       });

//       // Return user without password
//       const { password, ...result } = savedUser;
//       return result as Users;
//     } catch (error) {
//       console.error('❌ Error in create method:', error);
//       throw error;
//     }
//   }

//   async findAll(): Promise<Users[]> {
//     return this.userRepository.find();
//   }

//   async findOne(id: string): Promise<Users> {
//     if (!ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid user ID format');
//     }

//     const user = await this.userRepository.findOneBy({
//       _id: new ObjectId(id)
//     });

//     if (!user) {
//       throw new NotFoundException('User not found');
//     }

//     return user;
//   }

//   async findByEmail(email: string): Promise<Users | null> {
//     return this.userRepository.findOneBy({ email });
//   }

//   async update(
//     id: string,
//     data: Partial<{
//       email: string;
//       password: string;
//       firstName: string;
//       lastName: string;
//       role: UserRole;
//       isActive: boolean;
//     }>,
//   ): Promise<Users> {
//     if (!ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid user ID format');
//     }

//     const user = await this.findOne(id);

//     const statusChanged = data.isActive !== undefined && data.isActive !== user.isActive;
//     const oldStatus = user.isActive;

//     if (data.password) {
//       data.password = await bcrypt.hash(data.password, 10);
//     }

//     Object.assign(user, data);
//     user.updatedAt = new Date();

//     const updatedUser = await this.userRepository.save(user);

//     if (statusChanged) {
//       console.log(`📧 Status changed for user ${updatedUser.email}: ${oldStatus} -> ${updatedUser.isActive}`);

//       // Send status change email (don't await)
//       this.emailService.sendStatusChangeEmail(
//         updatedUser.email,
//         `${updatedUser.firstName} ${updatedUser.lastName}`,
//         updatedUser.isActive
//       ).catch(error => {
//         console.error('Background status email sending failed:', error.message);
//       });
//     }

//     return updatedUser;
//   }

//   async remove(id: string): Promise<{ message: string }> {
//     if (!ObjectId.isValid(id)) {
//       throw new BadRequestException('Invalid user ID format');
//     }

//     const user = await this.findOne(id);
//     await this.userRepository.remove(user);
//     console.log(`✅ User deleted: ${user.email}`);
//     return { message: 'User deleted successfully' };
//   }

//   async signin(email: string, password: string): Promise<{
//     access_token: string;
//     user: {
//       id: string;
//       email: string;
//       firstName: string;
//       lastName: string;
//       role: UserRole;
//       isActive: boolean;
//     }
//   }> {
//     try {
//       console.log('🔐 Signin attempt for email:', email);

//       const user = await this.userRepository.findOneBy({ email });

//       if (!user) {
//         throw new UnauthorizedException('Invalid credentials');
//       }

//       if (!user.isActive) {
//         throw new UnauthorizedException('Account is deactivated');
//       }

//       const isPasswordValid = await bcrypt.compare(password, user.password);

//       if (!isPasswordValid) {
//         throw new UnauthorizedException('Invalid credentials');
//       }

//       const payload = {
//         sub: user._id.toString(),
//         email: user.email,
//         role: user.role,
//         firstName: user.firstName,
//         lastName: user.lastName
//       };

//       const access_token = this.jwtService.sign(payload);
//       console.log('✅ JWT token created for user:', user.email);

//       return {
//         access_token,
//         user: {
//           id: user._id.toString(),
//           email: user.email,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           role: user.role,
//           isActive: user.isActive
//         }
//       };
//     } catch (error) {
//       console.error('❌ Error in signin method:', error);
//       throw error;
//     }
//   }
// }
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Users, UserRole } from './users.models';
import { EmailService } from '../email/email.service';
import type { Express } from 'express';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: MongoRepository<Users>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // Generate avatar URL using DiceBear API
  private generateAvatarUrl(
    userId: string,
    firstName: string,
    lastName: string,
    gender?: 'male' | 'female',
  ): string {
    const sex = gender === 'female' ? 'female' : 'male';
    const seed = `${sex}-${userId}-${firstName}-${lastName}`;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9&sex=${sex}`;
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gender?: 'male' | 'female';
    role: UserRole;
    isActive: boolean;
  }): Promise<Users> {
    try {
      const existingUser = await this.userRepository.findOneBy({
        email: data.email,
      });

      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user object first to get the ID
      const user = this.userRepository.create({
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        role: data.role,
        isActive: data.isActive ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedUser = await this.userRepository.save(user);

      // Generate avatar URL using the saved user ID
      const avatarUrl = this.generateAvatarUrl(
        savedUser._id.toString(),
        data.firstName,
        data.lastName,
        data.gender,
      );

      // Update user with avatar
      savedUser.avatar = avatarUrl;
      await this.userRepository.save(savedUser);

      // Send welcome email (don't await - let it run in background)
      this.emailService
        .sendWelcomeEmail(
          savedUser.email,
          `${savedUser.firstName} ${savedUser.lastName}`,
        )
        .catch((error) => {
          console.error('Background email sending failed:', error.message);
        });

      // Return user without password
      const { password: _password, ...result } = savedUser;
      return result as Users;
    } catch (error) {
      throw error;
    }
  }

  async findAll(): Promise<Users[]> {
    return this.userRepository.find();
  }

  async findAllPaginated(page: number, limit: number) {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const [data, total] = await Promise.all([
      this.userRepository.find({
        order: { createdAt: 'DESC' },
        skip,
        take: safeLimit,
      }),
      this.userRepository.count(),
    ]);

    return { data, total, page: safePage, limit: safeLimit };
  }

  async findOne(id: string): Promise<Users> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userRepository.findOneBy({
      _id: new ObjectId(id),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<Users | null> {
    return this.userRepository.findOneBy({ email });
  }

  async update(
    id: string,
    data: Partial<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      isActive: boolean;
    }>,
  ): Promise<Users> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.findOne(id);

    const statusChanged =
      data.isActive !== undefined && data.isActive !== user.isActive;
    const oldStatus = user.isActive;

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    Object.assign(user, data);
    user.updatedAt = new Date();

    const updatedUser = await this.userRepository.save(user);

    if (statusChanged) {
      console.log(
        `📧 Status changed for user ${updatedUser.email}: ${oldStatus} -> ${updatedUser.isActive}`,
      );

      // Send status change email (don't await)
      this.emailService
        .sendStatusChangeEmail(
          updatedUser.email,
          `${updatedUser.firstName} ${updatedUser.lastName}`,
          updatedUser.isActive,
        )
        .catch((error) => {
          console.error(
            'Background status email sending failed:',
            error.message,
          );
        });
    }

    return updatedUser;
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    console.log(`✅ User deleted: ${user.email}`);
    return { message: 'User deleted successfully' };
  }

  async getStudents(): Promise<Users[]> {
    try {
      console.log('🔍 Fetching all students from database');
      console.log('🔍 Looking for role:', UserRole.STUDENT);

      // First, let's see all users to debug
      const allUsers = await this.userRepository.find();
      console.log(`📊 Total users in database: ${allUsers.length}`);
      console.log(
        '📊 All users:',
        allUsers.map((u) => ({ id: u._id, email: u.email, role: u.role })),
      );

      // Now filter for students
      const students = await this.userRepository.find({
        where: { role: UserRole.STUDENT },
        order: { createdAt: 'DESC' },
      });

      console.log(`✅ Found ${students.length} students`);
      console.log(
        '📊 Students found:',
        students.map((s) => ({ id: s._id, email: s.email, role: s.role })),
      );

      return students.map((s) => {
        const { password: _password, ...rest } = s as Users & { password?: string };
        return rest as Users;
      });
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      throw error;
    }
  }

  async getInstructors(): Promise<Users[]> {
    try {
      console.log('🔍 Fetching all instructors from database');
      console.log('🔍 Looking for role:', UserRole.INSTRUCTOR);

      const instructors = await this.userRepository.find({
        where: { role: UserRole.INSTRUCTOR },
        order: { createdAt: 'DESC' },
      });

      console.log(`✅ Found ${instructors.length} instructors`);
      return instructors.map((i) => {
        const { password: _password, ...rest } = i as Users & { password?: string };
        return rest as Users;
      });
    } catch (error) {
      console.error('❌ Error fetching instructors:', error);
      throw error;
    }
  }

  async signin(
    email: string,
    password: string,
  ): Promise<{
    access_token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      gender?: 'male' | 'female';
      phone?: string;
      bio?: string;
      role: UserRole;
      isActive: boolean;
      isTemporaryPassword: boolean;
    };
  }> {
    try {
      console.log('🔐 Signin attempt for email:', email);

      const user = await this.userRepository.findOneBy({ email });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      const access_token = this.jwtService.sign(payload);
      console.log('✅ JWT token created for user:', user.email);

      return {
        access_token,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          gender: user.gender,
          phone: user.phone,
          bio: user.bio,
          role: user.role,
          isActive: user.isActive,
          isTemporaryPassword: user.isTemporaryPassword || false,
        },
      };
    } catch (error) {
      console.error('❌ Error in signin method:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      console.log('🔐 Forgot password request for email:', email);

      const user = await this.userRepository.findOneBy({ email });

      // Don't reveal if email exists or not (security best practice)
      if (!user) {
        console.log(
          '⚠️ Email not found, but returning success message for security',
        );
        return {
          message:
            'If the email exists, a new password has been sent to your email.',
        };
      }

      // Generate a simple, easy-to-type temporary password (8 characters: letters and numbers)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; // Excluding confusing chars
      let newPassword = '';
      for (let i = 0; i < 8; i++) {
        newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password immediately with temporary flag
      user.password = hashedPassword;
      user.isTemporaryPassword = true;
      user.updatedAt = new Date();
      await this.userRepository.save(user);

      // Send new password via email
      await this.emailService.sendNewPasswordEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        newPassword,
      );

      console.log('✅ New password generated and email sent');
      return {
        message:
          'If the email exists, a new password has been sent to your email.',
      };
    } catch (error) {
      console.error('❌ Error in forgotPassword method:', error);
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          'Unable to send password reset email at the moment',
        );
      }
      throw error;
    }
  }

  async changeTemporaryPassword(
    userId: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      console.log('🔐 Change temporary password request for user ID:', userId);

      if (!newPassword) {
        throw new BadRequestException(
          'New password is required',
        );
      }

      if (newPassword.length < 6) {
        throw new BadRequestException(
          'New password must be at least 6 characters',
        );
      }

      if (!ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Find user
      const user = await this.userRepository.findOneBy({
        _id: new ObjectId(userId),
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.isTemporaryPassword) {
        throw new BadRequestException(
          'Password change not required for this user',
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and clear temporary flag
      user.password = hashedPassword;
      user.isTemporaryPassword = false;
      user.updatedAt = new Date();
      await this.userRepository.save(user);

      console.log('✅ Temporary password changed successfully for user:', user.email);
      return { message: 'Password has been changed successfully.' };
    } catch (error) {
      console.error('❌ Error in changeTemporaryPassword method:', error);
      throw error;
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      console.log('🔐 Change password request for user ID:', userId);

      if (!currentPassword || !newPassword) {
        throw new BadRequestException(
          'Current password and new password are required',
        );
      }

      if (newPassword.length < 6) {
        throw new BadRequestException(
          'New password must be at least 6 characters',
        );
      }

      if (!ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Find user
      const user = await this.userRepository.findOneBy({
        _id: new ObjectId(userId),
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      user.password = hashedPassword;
      user.updatedAt = new Date();
      await this.userRepository.save(user);

      console.log('✅ Password changed successfully for user:', user.email);
      return { message: 'Password has been changed successfully.' };
    } catch (error) {
      console.error('❌ Error in changePassword method:', error);
      throw error;
    }
  }

  async uploadAvatar(id: string, file: Express.Multer.File): Promise<any> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file type
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        );
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('File too large. Maximum size is 5MB.');
      }

      // For now, we'll store the file info as base64
      // In production, you'd want to upload to cloud storage
      const avatarData = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        data: file.buffer.toString('base64'),
      };

      const user = await this.userRepository.findOneBy({
        _id: new ObjectId(id),
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.avatar = `data:${file.mimetype};base64,${avatarData.data}`;
      user.updatedAt = new Date();

      const updatedUser = await this.userRepository.save(user);
      console.log('✅ Avatar uploaded successfully for user:', user.email);

      // Return updated user without password
      const { password: _password, ...profile } = updatedUser;
      return profile;
    } catch (error) {
      console.error('❌ Error in uploadAvatar method:', error);
      throw error;
    }
  }

  async getProfile(id: string): Promise<any> {
    try {
      const user = await this.userRepository.findOneBy({
        _id: new ObjectId(id),
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Return user without password
      const { password: _password, ...profile } = user;
      return profile;
    } catch (error) {
      console.error('❌ Error in getProfile method:', error);
      throw error;
    }
  }

  async updateProfile(
    id: string,
    updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      gender?: 'male' | 'female';
      phone?: string;
      bio?: string;
      avatar?: string;
    },
  ): Promise<any> {
    try {
      const user = await this.userRepository.findOneBy({
        _id: new ObjectId(id),
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if email is being updated and if it's already taken
      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await this.userRepository.findOneBy({
          email: updateData.email,
        });
        if (existingUser) {
          throw new BadRequestException('Email already exists');
        }
      }

      // Update only provided fields
      Object.assign(user, updateData);
      user.updatedAt = new Date();

      const updatedUser = await this.userRepository.save(user);
      console.log('✅ Profile updated successfully for user:', user.email);

      // Return updated user without password
      const { password: _password, ...profile } = updatedUser;
      return profile;
    } catch (error) {
      console.error('❌ Error in updateProfile method:', error);
      throw error;
    }
  }
}
