import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import {
  CreateNoteDto,
  UpdateNoteDto,
  QueryNoteDto,
  QuerySubNoteDto,
  AddMemberDto,
  UpdateMemberDto,
  AddNoteFileDto,
  ScaffoldStagesDto,
  CreateApprovalDto,
  DecideApprovalDto,
  CreateTransactionDto,
  CreateChecklistDto,
  UpdateChecklistDto,
} from './dto/note.dto';
import { JwtAuthGuard, RequestWithUser } from '../auth/jwt-auth.guard';

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('health')
  health() {
    return {
      success: true,
      status: 'ok',
      service: 'api-noted',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getNotes(@Query() query: QueryNoteDto, @Req() req: RequestWithUser) {
    return await this.notesService.getNotes(query, req.user!);
  }

  @Get('sub')
  @UseGuards(JwtAuthGuard)
  async getSubNotes(@Query() query: QuerySubNoteDto, @Req() req: RequestWithUser) {
    return await this.notesService.getSubNotes(query, req.user!);
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getMetrics(@Req() req: RequestWithUser) {
    return await this.notesService.getMetrics(req.user!);
  }

  @Get(':kdJudul')
  @UseGuards(JwtAuthGuard)
  async getNoteDetail(
    @Param('kdJudul') kdJudul: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.getSubNotes({ kdJudul }, req.user!);
  }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  async createNote(@Body() dto: CreateNoteDto, @Req() req: RequestWithUser) {
    return await this.notesService.createNote(dto, req.user!);
  }

  @Put('upd')
  @UseGuards(JwtAuthGuard)
  async updateNote(@Body() dto: UpdateNoteDto, @Req() req: RequestWithUser) {
    return await this.notesService.updateNote(dto, req.user!);
  }

  @Delete(':kdJudul')
  @UseGuards(JwtAuthGuard)
  async deleteNote(
    @Param('kdJudul') kdJudul: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.deleteNote(kdJudul, req.user!);
  }

  // --- Preview sebelum hapus (menghitung jumlah catatan terdampak) ---
  @Get(':kdJudul/delete-preview')
  @UseGuards(JwtAuthGuard)
  async deletePreview(
    @Param('kdJudul') kdJudul: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.getDeletePreview(kdJudul, req.user!);
  }

  // --- Pulihkan Catatan dari Arsip ---
  @Post(':kdJudul/restore')
  @UseGuards(JwtAuthGuard)
  async restoreNote(
    @Param('kdJudul') kdJudul: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.restoreNote(kdJudul, req.user!);
  }

  // --- Auto-Scaffold 5 Tahapan MFC Standard ---
  @Post(':kdJudul/scaffold-stages')
  @UseGuards(JwtAuthGuard)
  async scaffoldStages(
    @Param('kdJudul') kdJudul: string,
    @Body() dto: ScaffoldStagesDto,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.scaffoldStages(kdJudul, dto, req.user!);
  }

  // --- Kelola Anggota & Follower ---
  @Get(':kdJudul/members')
  @UseGuards(JwtAuthGuard)
  async getMembers(
    @Param('kdJudul') kdJudul: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.getMembers(kdJudul, req.user!);
  }

  @Post(':kdJudul/members')
  @UseGuards(JwtAuthGuard)
  async addMember(
    @Param('kdJudul') kdJudul: string,
    @Body() dto: AddMemberDto,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.addMember(kdJudul, dto, req.user!);
  }

  @Put(':kdJudul/members/:accessId')
  @UseGuards(JwtAuthGuard)
  async updateMember(
    @Param('kdJudul') kdJudul: string,
    @Param('accessId') accessId: string,
    @Body() dto: UpdateMemberDto,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.updateMember(kdJudul, accessId, dto, req.user!);
  }

  @Delete(':kdJudul/members/:accessId')
  @UseGuards(JwtAuthGuard)
  async removeMember(
    @Param('kdJudul') kdJudul: string,
    @Param('accessId') accessId: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.removeMember(kdJudul, accessId, req.user!);
  }

  // --- Agregasi Dokumen Bukti Dukung lintas catatan ---
  @Get('documents')
  @UseGuards(JwtAuthGuard)
  async getAllFiles(@Query() query: any, @Req() req: RequestWithUser) {
    return await this.notesService.getAllFiles(query, req.user!);
  }

  // --- Kelola Berkas Media Bukti Dukung (PDF & Foto) ---
  @Get(':kdJudul/files')
  @UseGuards(JwtAuthGuard)
  async getFiles(
    @Param('kdJudul') kdJudul: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.getFiles(kdJudul, req.user!);
  }

  @Post(':kdJudul/files')
  @UseGuards(JwtAuthGuard)
  async addFile(
    @Param('kdJudul') kdJudul: string,
    @Body() dto: AddNoteFileDto,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.addFile(kdJudul, dto, req.user!);
  }

  @Delete(':kdJudul/files/:fileId')
  @UseGuards(JwtAuthGuard)
  async removeFile(
    @Param('kdJudul') kdJudul: string,
    @Param('fileId') fileId: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.removeFile(kdJudul, fileId, req.user!);
  }

  // --- Kelola Persetujuan Tahapan (Approval Gateways) ---
  @Get(':kdJudul/approvals')
  @UseGuards(JwtAuthGuard)
  async getApprovals(
    @Param('kdJudul') kdJudul: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.getApprovals(kdJudul, req.user!);
  }

  @Post(':kdJudul/approvals')
  @UseGuards(JwtAuthGuard)
  async requestApproval(
    @Param('kdJudul') kdJudul: string,
    @Body() dto: CreateApprovalDto,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.requestApproval(kdJudul, dto, req.user!);
  }

  @Put(':kdJudul/approvals/:approvalId')
  @UseGuards(JwtAuthGuard)
  async decideApproval(
    @Param('kdJudul') kdJudul: string,
    @Param('approvalId') approvalId: string,
    @Body() dto: DecideApprovalDto,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.decideApproval(kdJudul, approvalId, dto, req.user!);
  }

  // --- Form Pendukung: Transaksi Realisasi Finansial (Buku Kas) ---
  @Get(':kdJudul/transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(
    @Param('kdJudul') kdJudul: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.getTransactions(kdJudul, req.user!);
  }

  @Post(':kdJudul/transactions')
  @UseGuards(JwtAuthGuard)
  async addTransaction(
    @Param('kdJudul') kdJudul: string,
    @Body() dto: CreateTransactionDto,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.addTransaction(kdJudul, dto, req.user!);
  }

  @Delete(':kdJudul/transactions/:trxId')
  @UseGuards(JwtAuthGuard)
  async removeTransaction(
    @Param('kdJudul') kdJudul: string,
    @Param('trxId') trxId: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.removeTransaction(kdJudul, trxId, req.user!);
  }

  // --- Form Pendukung: Ceklist Butir Capaian / Deliverables (Lbesic) ---
  @Get(':kdJudul/checklists')
  @UseGuards(JwtAuthGuard)
  async getChecklists(
    @Param('kdJudul') kdJudul: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.getChecklists(kdJudul, req.user!);
  }

  @Post(':kdJudul/checklists')
  @UseGuards(JwtAuthGuard)
  async addChecklist(
    @Param('kdJudul') kdJudul: string,
    @Body() dto: CreateChecklistDto,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.addChecklist(kdJudul, dto, req.user!);
  }

  @Put(':kdJudul/checklists/:itemId')
  @UseGuards(JwtAuthGuard)
  async updateChecklist(
    @Param('kdJudul') kdJudul: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistDto,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.updateChecklist(kdJudul, itemId, dto, req.user!);
  }

  @Delete(':kdJudul/checklists/:itemId')
  @UseGuards(JwtAuthGuard)
  async removeChecklist(
    @Param('kdJudul') kdJudul: string,
    @Param('itemId') itemId: string,
    @Req() req: RequestWithUser
  ) {
    return await this.notesService.removeChecklist(kdJudul, itemId, req.user!);
  }
}
