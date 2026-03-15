import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    currentPassword: string;

    @IsString()
    @MinLength(6)
    newPassword: string;
}

class UpdateProfileDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    // ─── Admin-only CRUD ────────────────────────────────────────────────────────

    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string, @Request() req: any) {
        return this.usersService.remove(id, req.user.sub);
    }

    // ─── Current-user actions (any authenticated user) ──────────────────────────

    @Patch('me/password')
    @HttpCode(HttpStatus.NO_CONTENT)
    changePassword(@Body() dto: ChangePasswordDto, @Request() req: any) {
        return this.usersService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
    }

    @Patch('me/profile')
    updateProfile(@Body() dto: UpdateProfileDto, @Request() req: any) {
        return this.usersService.updateProfile(req.user.sub, dto.name);
    }
}
