import {
    Injectable,
    NotFoundException,
    ConflictException,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../auth/enums/user-role.enum';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
        });
        if (!user) throw new NotFoundException('Usuário não encontrado');
        return user;
    }

    async create(dto: CreateUserDto): Promise<User> {
        const existing = await this.userRepository.findOne({ where: { email: dto.email } });
        if (existing) throw new ConflictException('E-mail já cadastrado');

        const user = this.userRepository.create({
            ...dto,
            role: dto.role ?? UserRole.OPERATOR,
            isActive: dto.isActive ?? true,
        });

        const saved = await this.userRepository.save(user);
        // Strip password from response
        const { password: _pw, ...result } = saved as any;
        return result as User;
    }

    async update(id: string, dto: UpdateUserDto): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Usuário não encontrado');

        if (dto.email && dto.email !== user.email) {
            const existing = await this.userRepository.findOne({ where: { email: dto.email } });
            if (existing) throw new ConflictException('E-mail já cadastrado');
        }

        // Handle password update separately (needs hashing via @BeforeInsert doesn't fire on update)
        if (dto.password) {
            user.password = await bcrypt.hash(dto.password, 10);
        }

        const { password: _pw, ...rest } = dto as any;
        Object.assign(user, rest);

        const saved = await this.userRepository.save(user);
        const { password: _saved, ...result } = saved as any;
        return result as User;
    }

    async remove(id: string, requestingUserId: string): Promise<void> {
        if (id === requestingUserId) throw new ForbiddenException('Você não pode excluir sua própria conta');
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Usuário não encontrado');
        await this.userRepository.remove(user);
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'password'],
        });
        if (!user) throw new NotFoundException('Usuário não encontrado');

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) throw new UnauthorizedException('Senha atual incorreta');

        user.password = await bcrypt.hash(newPassword, 10);
        await this.userRepository.save(user);
    }

    async updateProfile(userId: string, name: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('Usuário não encontrado');
        user.name = name;
        const saved = await this.userRepository.save(user);
        const { password: _pw, ...result } = saved as any;
        return result as User;
    }
}
