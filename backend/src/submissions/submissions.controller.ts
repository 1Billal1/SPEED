import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Controller('api/submissions')
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
}
