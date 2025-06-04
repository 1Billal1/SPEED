// backend/src/evidence-entries/evidence-entries.controller.ts
import { 
  Controller, Post, Body, Get, Param, Req,
  ValidationPipe, BadRequestException, Query,
  DefaultValuePipe, ParseIntPipe
} from '@nestjs/common';
import { EvidenceEntriesService, SearchEvidenceResult, SearchEvidenceParams } from './evidence-entries.service'; 
import { CreateEvidenceEntryDto } from './dto/create-evidence-entry.dto';
import { EvidenceEntryDocument } from './schemas/evidence-entry.schema';

@Controller('api/evidence-entries')
export class EvidenceEntriesController {
  constructor(private readonly evidenceEntriesService: EvidenceEntriesService) {}

  @Post()
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })) 
    createEvidenceEntryDto: CreateEvidenceEntryDto,
    @Req() req: any,
  ): Promise<EvidenceEntryDocument> {
    const placeholderAnalystId = '683aa648339e2cf7c04c9d4b'; 
    const analystId = req.user?.id || placeholderAnalystId; 

    if (!analystId || (analystId === placeholderAnalystId && !req.user?.id) ) {
      console.warn(`[CTRL Evidence] WARNING: Using placeholder analyst ID: ${placeholderAnalystId}`);
    }
    if (!analystId) {
        throw new BadRequestException("Analyst ID could not be determined.");
    }
    return this.evidenceEntriesService.create(createEvidenceEntryDto, analystId);
  }

  @Get('by-submission/:submissionId')
  async findAllForSubmission(@Param('submissionId') submissionId: string): Promise<EvidenceEntryDocument[]> {
    return this.evidenceEntriesService.findAllForSubmission(submissionId);
  }

  @Get('search')
  async searchEvidence(
    @Query('sePractice') sePractice?: string,
    @Query('keywords') keywords?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ): Promise<SearchEvidenceResult> {
    const params: SearchEvidenceParams = { sePractice, keywords, page, limit };
    return this.evidenceEntriesService.searchEvidence(params);
  }
}