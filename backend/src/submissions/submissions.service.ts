import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// Import correctly
const bibtexParse = require('bibtex-parse-js');

import { Submission } from './schemas/submission.schema';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name)
    private submissionModel: Model<Submission>,
  ) {}

  async parseBibtex(bibtexContent: string): Promise<Partial<CreateSubmissionDto>> {
    try {
      const entries = bibtexParse.toJSON(bibtexContent);

      if (!entries || entries.length === 0 || !entries[0].entryTags) {
        throw new Error('Invalid entry format from BibTeX parser');
      }

      const tags = entries[0].entryTags;

      return {
        title: this.removeBibtexBraces(tags.title),
        authors: tags.author
          ? tags.author.split(' and ').map((a: string) => a.trim())
          : [],
        journal: this.removeBibtexBraces(tags.journal || tags.booktitle || ''),
        year: tags.year ? parseInt(tags.year, 10) : undefined,
        doi: this.removeBibtexBraces(tags.doi || '')
      };
    } catch (error: any) {
      console.error('BibTeX parsing error:', error);
      throw new BadRequestException(`Failed to parse BibTeX: ${error.message || error}`);
    }
  }

  private removeBibtexBraces(value?: string): string {
    return value ? value.replace(/[{}]/g, '') : '';
  }

  async create(createSubmissionDto: CreateSubmissionDto): Promise<Submission> {
    const submission = new this.submissionModel({
      ...createSubmissionDto,
      status: 'pending',
      submittedAt: new Date()
    });
    return submission.save();
  }

  async search(query: string): Promise<Submission[]> {
    const regex = new RegExp(query, 'i');
    return this.submissionModel.find({
      $or: [
        { title: regex },
        { authors: regex },
        { journal: regex },
        { doi: regex },
        { year: isNaN(+query) ? undefined : +query },
      ].filter(Boolean),
    }).exec();
  }
}
