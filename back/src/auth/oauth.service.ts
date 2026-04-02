import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Users, UserRole } from '../users/users.models';

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(Users)
    private readonly userRepository: MongoRepository<Users>,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthUser(profile: any): Promise<any> {
    const { email, firstName, lastName, provider: _provider } = profile;

    let user = await this.userRepository.findOneBy({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = await this.userRepository.save({
        email,
        firstName,
        lastName,
        role: UserRole.STUDENT, // Default role for OAuth users
        isActive: true, // OAuth users are auto-activated
        password: '', // OAuth users don't have passwords
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return user;
  }

  async generateJWT(user: Users) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }
}
