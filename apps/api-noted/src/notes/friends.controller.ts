import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { InviteFriendDto, RespondFriendDto } from './dto/friends.dto';
import {
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  RequestWithUser,
} from '../auth/jwt-auth.guard';

@Controller('friends')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  @RequirePermissions('noted:view')
  async getFriends(@Req() req: RequestWithUser) {
    return await this.friendsService.getFriends(req.user!);
  }

  @Get('lookup')
  @RequirePermissions('noted:view')
  async lookupUsers(@Req() req: RequestWithUser, @Query('q') q?: string) {
    return await this.friendsService.lookupUsers(req.user!, q || '');
  }

  @Post('invite')
  @RequirePermissions('noted:edit')
  async inviteFriend(@Req() req: RequestWithUser, @Body() dto: InviteFriendDto) {
    return await this.friendsService.inviteFriend(req.user!, dto);
  }

  @Put(':friendshipId')
  @RequirePermissions('noted:edit')
  async respondFriend(
    @Req() req: RequestWithUser,
    @Param('friendshipId') friendshipId: string,
    @Body() dto: RespondFriendDto
  ) {
    return await this.friendsService.respondFriend(req.user!, friendshipId, dto);
  }

  @Delete(':friendshipId')
  @RequirePermissions('noted:delete')
  async removeFriend(
    @Req() req: RequestWithUser,
    @Param('friendshipId') friendshipId: string
  ) {
    return await this.friendsService.removeFriend(req.user!, friendshipId);
  }
}
