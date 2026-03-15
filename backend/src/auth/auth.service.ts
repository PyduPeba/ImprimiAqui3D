import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.userRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'role', 'isActive', 'storeId'],
        });

        if (!user || !(await user.validatePassword(password))) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Usuário inativo');
        }

        return this.generateTokens(user);
    }

    private generateTokens(user: User) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            storeId: user.storeId
        };

        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                storeId: user.storeId,
            },
        };
    }

    // Método auxiliar para criar o primeiro admin se necessário
    async createInitialAdmin(email: string, password: string) {
        const exists = await this.userRepository.findOne({ where: { email } });
        if (exists) return;

        const admin = this.userRepository.create({
            email,
            password,
            role: UserRole.ADMIN,
            isActive: true,
        });

        return this.userRepository.save(admin);
    }
}
