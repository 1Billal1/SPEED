// src/submissions/submissions.controller.ts
import { Controller, Post, Body, Get, Query, Patch, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common'; // Added UseGuards etc.
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
// Assuming you might have a SubmissionStatus enum in your schema file if you adopt it
// import { SubmissionStatus } from './schemas/submission.schema';

// --- TODO: Add Auth Guards and Role Decorators when ready ---
// import { AuthGuard } from '@nestjs/passport';
// import { RolesGuard } from '../auth/guards/roles.guard'; // Adjust path
// import { Roles } from '../auth/decorators/roles.decorator'; // Adjust path
// import { UserRole } from '../users/schemas/user.schema'; // Adjust path to your User schema/enum

@Controller('api/submissions') // Base path is /api/submissions
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('parse-bibtex')
  async parseBibtex(@Body() body: { bibtex: string }) {
    return this.submissionsService.parseBibtex(body.bibtex);
  }

  @Post()
  async create(@Body() createSubmissionDto: CreateSubmissionDto) {
    return this.submissionsService.create(createSubmissionDto);
  }

  @Get('search')
  async searchSubmissions(@Query('query') query: string): Promise<any[]> {
    return this.submissionsService.search(query);
  }

  // This is for a specific submitter's pending items, not all pending items for moderators
  @Get('my-pending')
  async getMyPending(@Query('submitterId') submitterId: string) {
    return this.submissionsService.getPendingBySubmitter(submitterId);
  }

  // --- NEW ENDPOINT FOR MODERATORS ---
  @Get('pending-moderation') // Changed from 'pending' to be more descriptive and avoid clashes
  // @UseGuards(AuthGuard('jwt'), RolesGuard) // TODO: Secure this endpoint
  // @Roles('moderator')                    // TODO: Secure this endpoint
  async getSubmissionsForModeration() {
    console.log("NestJS Controller: GET /api/submissions/pending-moderation hit");
    return this.submissionsService.findPendingForModeration(); // Needs this method in service
  }
  // --- END NEW ENDPOINT ---


  // --- NEW ENDPOINT FOR MODERATING A SUBMISSION ---
  @Patch(':id/moderate')
  // @UseGuards(AuthGuard('jwt'), RolesGuard) // TODO: Secure this endpoint
  // @Roles('moderator')                    // TODO: Secure this endpoint
  async moderateSubmission(
    @Param('id') id: string,
    @Body() body: { status: string; rejectionReason?: string }, // Use string for status for now
                                                               // Or import SubmissionStatus enum
  ) {
    console.log(`NestJS Controller: PATCH /api/submissions/${id}/moderate hit with status: ${body.status}`);
    // Validate status if using string
    const validStatuses = ['Accepted', 'Rejected']; // Or map from your SubmissionStatus enum
    if (body.status && !validStatuses.includes(body.status)) { // Basic validation if using string
        throw new BadRequestException('Invalid status value for moderation.');
    }
    if (body.status === 'Rejected' && !body.rejectionReason) {
        throw new BadRequestException('Rejection reason is required for rejected status.');
    }
    return this.submissionsService.moderateSubmission(
      id,
      body.status, // Pass as string, or cast to enum if service expects enum
      body.rejectionReason,
    );
  }
  // --- END NEW MODERATE ENDPOINT ---


  @Patch(':id')
  async editSubmission(@Param('id') id: string, @Body() updateDto: any) {
    // This endpoint seems to be for submitters editing their own pending submissions.
    // Ensure it has appropriate authorization checks.
    return this.submissionsService.editSubmission(id, updateDto);
  }
}