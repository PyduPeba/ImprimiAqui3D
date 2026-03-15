import { Controller, Get, Put, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    findAll(@Request() req: any) {
        return this.notificationsService.findByUser(req.user.id);
    }

    @Get('unread-count')
    getUnreadCount(@Request() req: any) {
        const userId = req.user?.id || req.user?.userId;
        return this.notificationsService.getUnreadCount(userId);
    }

    @Put(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Put('read-all')
    markAllAsRead(@Request() req: any) {
        const userId = req.user?.id || req.user?.userId;
        return this.notificationsService.markAllAsRead(userId);
    }
}
