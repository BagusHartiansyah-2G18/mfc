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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FlexibleFormsService } from './flexible-forms.service';
import {
  CreateDataFormDto,
  UpdateDataFormDto,
  UpdateFormAccessDto,
  SubmitFormValueDto,
  UpdateFormValueDto,
  UploadFormFileDto,
  QueryFormDto,
  QueryFormDataDto,
  QueryFormCatalogDto,
  QueryDatasetDto,
  CreateFormApiKeyDto,
} from './dto/flexible-form.dto';
import { JwtAuthGuard, RequestWithUser } from '../auth/jwt-auth.guard';

@Controller('notes/forms')
export class FormsCatalogController {
  constructor(private readonly formsService: FlexibleFormsService) {}

  @Get('catalog')
  @UseGuards(JwtAuthGuard)
  async getCatalog(@Query() query: QueryFormCatalogDto, @Req() req: RequestWithUser) {
    return await this.formsService.getFormsCatalog(req.user!, query);
  }

  @Get('dataset')
  @UseGuards(JwtAuthGuard)
  async getDataset(@Query() query: QueryDatasetDto, @Req() req: RequestWithUser) {
    return await this.formsService.getDatasetMetadata(req.user!, query);
  }
}

@Controller('notes/:kdJudul/forms')
export class FlexibleFormsController {
  constructor(private readonly formsService: FlexibleFormsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getForms(
    @Param('kdJudul') kdJudul: string,
    @Query() query: QueryFormDto,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.getForms(kdJudul, req.user!, query);
  }

  // Upload lampiran form (terpisah): simpan berkas ke disk, balikkan URL + metadata.
  // Klien hanya menyimpan URL tersebut pada jawaban form (answers).
  @Post(':formId/upload')
  @UseGuards(JwtAuthGuard)
  async uploadFormFile(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Body() dto: UploadFormFileDto,
    @Req() req: RequestWithUser
  ) {
    const origin = `${req.protocol}://${req.get('host')}`;
    return await this.formsService.saveFormFile(kdJudul, formId, dto, req.user!, origin);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createForm(
    @Param('kdJudul') kdJudul: string,
    @Body() dto: CreateDataFormDto,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.createForm(kdJudul, dto, req.user!);
  }

  @Get(':formId')
  @UseGuards(JwtAuthGuard)
  async getFormDetail(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.getFormDetail(kdJudul, formId, req.user);
  }

  @Put(':formId')
  @UseGuards(JwtAuthGuard)
  async updateForm(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Body() dto: UpdateDataFormDto,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.updateForm(kdJudul, formId, dto, req.user!);
  }

  @Delete(':formId')
  @UseGuards(JwtAuthGuard)
  async deleteForm(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.deleteForm(kdJudul, formId, req.user!);
  }

  @Put(':formId/access')
  @UseGuards(JwtAuthGuard)
  async updateFormAccess(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Body() dto: UpdateFormAccessDto,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.updateFormAccess(kdJudul, formId, dto, req.user!);
  }

  // Dynamic Flat Projection API
  @Get(':formId/data')
  @UseGuards(JwtAuthGuard)
  async getFormDataFlat(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Query() query: QueryFormDataDto,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.getFormDataFlat(kdJudul, formId, query, req.user);
  }

  @Post(':formId/values')
  @UseGuards(JwtAuthGuard)
  async submitFormValue(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Body() dto: SubmitFormValueDto,
    @Req() req: RequestWithUser
  ) {
    const originHost = req.headers['host'] || 'noted:4203';
    return await this.formsService.submitFormValue(kdJudul, formId, dto, req.user, originHost);
  }

  @Put(':formId/values/:valueId')
  @UseGuards(JwtAuthGuard)
  async updateFormValue(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Param('valueId') valueId: string,
    @Body() dto: UpdateFormValueDto,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.updateFormValue(kdJudul, formId, valueId, dto, req.user!);
  }

  @Delete(':formId/values/:valueId')
  @UseGuards(JwtAuthGuard)
  async deleteFormValue(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Param('valueId') valueId: string,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.deleteFormValue(kdJudul, formId, valueId, req.user!);
  }

  @Get(':formId/export')
  @UseGuards(JwtAuthGuard)
  async exportFormData(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Query('format') format: string,
    @Query() query: QueryFormDataDto,
    @Req() req: RequestWithUser,
    @Res() res: Response
  ) {
    const exported = await this.formsService.exportFormData(
      kdJudul,
      formId,
      format || 'json',
      req.user,
      query
    );
    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    return res.send(exported.content);
  }

  @Get(':formId/api-keys')
  @UseGuards(JwtAuthGuard)
  async listApiKeys(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.listFormApiKeys(kdJudul, formId, req.user!);
  }

  @Post(':formId/api-keys')
  @UseGuards(JwtAuthGuard)
  async createApiKey(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Body() dto: CreateFormApiKeyDto,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.createFormApiKey(kdJudul, formId, dto, req.user!);
  }

  @Delete(':formId/api-keys/:keyId')
  @UseGuards(JwtAuthGuard)
  async revokeApiKey(
    @Param('kdJudul') kdJudul: string,
    @Param('formId') formId: string,
    @Param('keyId') keyId: string,
    @Req() req: RequestWithUser
  ) {
    return await this.formsService.revokeFormApiKey(kdJudul, formId, keyId, req.user!);
  }
}

// -------------------------------------------------------------
// Controller Khusus Konsumsi Publik Bebas Login
// -------------------------------------------------------------
@Controller('public/forms')
export class PublicFormsController {
  constructor(private readonly formsService: FlexibleFormsService) {}

  @Get(':shareSlug')
  async getPublicForm(@Param('shareSlug') shareSlug: string) {
    return await this.formsService.getPublicFormBySlug(shareSlug);
  }

  @Get(':shareSlug/data')
  async getPublicFormData(
    @Param('shareSlug') shareSlug: string,
    @Query() query: QueryFormDataDto
  ) {
    return await this.formsService.getPublicFormDataBySlug(shareSlug, query);
  }

  @Post(':shareSlug/upload')
  async uploadPublicFormFile(
    @Param('shareSlug') shareSlug: string,
    @Body() dto: UploadFormFileDto,
    @Req() req: any
  ) {
    const origin = `${req.protocol}://${req.get('host')}`;
    return await this.formsService.savePublicFormFile(shareSlug, dto, origin);
  }

  @Post(':shareSlug/values')
  async submitPublicForm(
    @Param('shareSlug') shareSlug: string,
    @Body() dto: SubmitFormValueDto,
    @Req() req: any
  ) {
    const originHost = req.headers['host'] || 'public-portal';
    return await this.formsService.submitPublicFormBySlug(shareSlug, dto, originHost);
  }
}
