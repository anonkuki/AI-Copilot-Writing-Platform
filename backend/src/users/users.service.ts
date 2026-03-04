import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('邮箱已被注册');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0],
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      const token = this.generateToken(user.id, user.email);
      return this.buildAuthPayload(user, token);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw new UnauthorizedException('邮箱或密码错误');
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        throw new UnauthorizedException('邮箱或密码错误');
      }

      const userInfo = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      };
      const token = this.generateToken(user.id, user.email);
      return this.buildAuthPayload(userInfo, token);
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const passwordValid = await bcrypt.compare(oldPassword, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: '密码修改成功' };
  }

  private buildAuthPayload(user: any, token: string) {
    return {
      user,
      accessToken: token,
      refreshToken: token,
      access_token: token,
      refresh_token: token,
      user_info: user,
    };
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, username: email });
  }

  private handlePrismaError(error: any): never {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2021') {
      this.logger.error('Database table not found', error.message);
      throw new ServiceUnavailableException('数据库未初始化，请先执行迁移');
    }

    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('邮箱已被注册');
    }

    if (error instanceof ConflictException || error instanceof UnauthorizedException) {
      throw error;
    }

    this.logger.error('Database operation failed', error?.message || String(error));
    throw new ServiceUnavailableException('服务暂时不可用，请稍后重试');
  }
}
