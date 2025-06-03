import { Controller, Post, Body, Get, Query, Patch, Param, BadRequestException, NotFoundException, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { SubmissionsService, PlainSubmissionForDuplicateCheck } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { SubmissionDocument } from './schemas/submission.schema';
import { Types } from 'mongoose';

interface SubmissionDetailsWithDuplicates {
  submission: SubmissionDocument;
  potentialDuplicates: PlainSubmissionForDuplicateCheck[];
}

@Controller('api/submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('parse-bibtex')
  async parseBibtex(@Body() body: { bibtex: string }): Promise<Partial<CreateSubmissionDto>> {
    return this.submissionsService.parseBibtex(body.bibtex);
  }

  @Post()
  async create(@Body() createSubmissionDto: CreateSubmissionDto): Promise<SubmissionDocument> {
    return this.submissionsService.create(createSubmissionDto);
  }

  @Get('search')
  async searchSubmissions(@Query('query') query: string): Promise<SubmissionDocument[]> {
    return this.submissionsService.search(query);
  }

  @Get('my-pending')
  async getMyPending(@Query('submitterId') submitterId: string): Promise<SubmissionDocument[]> {
    return this.submissionsService.getPendingBySubmitter(submitterId);
  }

  @Get('find-by-status')
  async findSubmissionsController(
    @Query('status') status: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!status) {
      throw new BadRequestException('Status query parameter is required.');
    }
    return this.submissionsService.findSubmissionsByStatus(status, page, limit);
  }

  @Get(':id/details-for-moderation')
  async getSubmissionDetailsForModeration(@Param('id') id: string): Promise<SubmissionDetailsWithDuplicates> {
    const submission: SubmissionDocument | null = await this.submissionsService.findById(id);
    
    if (!submission) {
      throw new NotFoundException(`Submission with ID "${id}" not found`);
    }
    
    let potentialDuplicates: PlainSubmissionForDuplicateCheck[] = []; 
    const submissionIdString = (submission._id instanceof Types.ObjectId || typeof submission._id?.toString === 'function') 
                            ? submission._id.toString() : null;

    if (!submissionIdString) {
        throw new Error(`Critical error: Submission ${id} has an invalid _id.`);
    }
    
    if (submission.status === 'pending') {
        potentialDuplicates = await this.submissionsService.findPotentialDuplicates(
            submissionIdString,
            submission.title,
            submission.doi,
        );
    }
    
    return { 
      submission: submission, 
      potentialDuplicates 
    };
  }

  @Patch(':id/moderate')
  async moderateSubmission(
    @Param('id') id: string,
    @Body() body: { status: string; rejectionReason?: string; duplicateOfId?: string },
  ): Promise<SubmissionDocument | null> {
    const validModerationStatuses = ['Accepted', 'Rejected'];
    if (!body.status || !validModerationStatuses.includes(body.status)) {
        throw new BadRequestException(`Invalid status provided for moderation. Must be one of: ${validModerationStatuses.join(', ')}`);
    }
    if (body.status === 'Rejected' && (!body.rejectionReason || body.rejectionReason.trim() === '')) {
        throw new BadRequestException('Rejection reason is required when status is "Rejected".');
    }
    
    return this.submissionsService.moderateSubmission(
        id, 
        body.status, 
        body.rejectionReason,
        body.duplicateOfId
    );
  }

  @Patch(':id')
  async editSubmission(
    @Param('id') id: string, 
    @Body() updateDto: Partial<CreateSubmissionDto>,
  ): Promise<SubmissionDocument | null> {
    return this.submissionsService.editSubmission(id, updateDto);
  }
}