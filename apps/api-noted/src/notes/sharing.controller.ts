import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SharingService } from './sharing.service';
import { UpdateNoteSharingDto } from './dto/sharing.dto';
import { QuerySubNoteDto } from './dto/note.dto';
import { JwtAuthGuard, RequestWithUser } from '../auth/jwt-auth.guard';

@Controller('sharing')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @Get('shared-with-me')
  @UseGuards(JwtAuthGuard)
  async getSharedWithMe(@Req() req: RequestWithUser) {
    return await this.sharingService.getSharedWithMe(req.user!);
  }

  @Get('public-catalog')
  async getPublicCatalog() {
    return await this.sharingService.getPublicCatalog();
  }

  @Get('public-sub')
  async getPublicSub(@Query() query: QuerySubNoteDto) {
    return await this.sharingService.getPublicSubNotes(query);
  }

  // Halaman Mandiri di Luar Dashboard: Mode Publik / Mode Khusus Anggota
  @Get('note-detail/:kdJudul')
  async getNoteDetail(
    @Param('kdJudul') kdJudul: string,
    @Req() req: any
  ) {
    const authHeader = req.headers?.['authorization'] as string | undefined;
    return await this.sharingService.getNoteDetail(kdJudul, authHeader);
  }

  @Put('notes/:kdJudul')
  @UseGuards(JwtAuthGuard)
  async updateNoteSharing(
    @Param('kdJudul') kdJudul: string,
    @Body() dto: UpdateNoteSharingDto,
    @Req() req: RequestWithUser
  ) {
    return await this.sharingService.updateNoteSharing(kdJudul, dto, req.user!);
  }
}
