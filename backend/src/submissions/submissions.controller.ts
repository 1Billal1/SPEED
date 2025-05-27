import { Controller, Post, Body } from '@nestjs/common';
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
}
