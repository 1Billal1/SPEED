// backend/src/submissions/submissions.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
<<<<<<< Updated upstream
import { Model } from 'mongoose';
const bibtexParse = require('bibtex-parse-js');
=======
import { Model, Types } from 'mongoose'; // Import Types
const bibtexParse = require('bibtex-parse-js'); // Assuming this is how you import it
>>>>>>> Stashed changes

import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { CreateSubmissionDto } from './dto/create-submission.dto';

// Optional: If you choose to use an enum for status values passed around
// export enum ServiceSubmissionStatus {
//   PENDING = 'pending',
//   ACCEPTED = 'Accepted',
//   REJECTED = 'Rejected',
// }

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
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
        authors: tags.author ? tags.author.split(' and ').map((a: string) => a.trim()) : [],
        journal: this.removeBibtexBraces(tags.journal || tags.booktitle || ''),
        year: tags.year ? parseInt(tags.year, 10) : undefined,
        doi: this.removeBibtexBraces(tags.doi || ''),
      };
    } catch (error: any) {
      console.error('BibTeX parsing error:', error);
      throw new BadRequestException(`Failed to parse BibTeX: ${error.message || error}`);
    }
  }

  private removeBibtexBraces(value?: string): string {
    return value ? value.replace(/[{}]/g, '') : '';
  }

  async create(createSubmissionDto: CreateSubmissionDto): Promise<SubmissionDocument> {
    const submissionData = {
      ...createSubmissionDto,
      status: 'pending', // Default status on creation
      // submittedAt will be handled by timestamps: true in schema as createdAt
    };
    const newSubmission = new this.submissionModel(submissionData);
    return newSubmission.save();
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async search(query: string): Promise<SubmissionDocument[]> {
    console.log(`SubmissionsService: Searching for query "${query}"`);
    const regex = new RegExp(this.escapeRegex(query), 'i');
    return this.submissionModel.find({
      $or: [
        { title: regex },
        { authors: regex },
        { journal: regex },
        { doi: regex },
        // Add year search if query can be parsed as a number
        ...( !isNaN(Number(query)) ? [{ year: Number(query) }] : [] )
      ],
    }).exec();
  }

  async getPendingBySubmitter(submitterId: string): Promise<SubmissionDocument[]> {
    console.log(`SubmissionsService: Getting pending for submitter ID "${submitterId}"`);
    if (!this.submissionModel.schema.path('submitterId')) {
        console.warn("SubmissionsService: 'submitterId' field does not exist on Submission schema. getPendingBySubmitter will return empty.");
        return Promise.resolve([]);
    }
    return this.submissionModel.find({ submitterId: new Types.ObjectId(submitterId), status: 'pending' }).exec();
  }

  async editSubmission(id: string, updateDto: Partial<CreateSubmissionDto>): Promise<SubmissionDocument | null> {
    console.log(`SubmissionsService: Editing submission ID "${id}"`);
    const submission = await this.submissionModel.findById(id).exec();
    if (!submission) {
      throw new NotFoundException('Submission not found');
    }
    if (submission.status !== 'pending') {
      throw new ForbiddenException('Cannot edit submission after moderation or if not pending.');
    }
    if (!submission.editHistory) {
        submission.editHistory = [];
    }
    submission.editHistory.push({
      editedAt: new Date(),
      previous: { 
        title: submission.title, authors: [...submission.authors], journal: submission.journal,
        year: submission.year, doi: submission.doi,
       } 
    });
    Object.assign(submission, updateDto);
    return submission.save();
  }
  
  async findPendingForModeration(): Promise<SubmissionDocument[]> {
    console.log("NestJS Service: findPendingForModeration searching for status 'pending'");
    return this.submissionModel.find({ status: 'pending' }).sort({ createdAt: -1 }).exec(); // Sort by newest
  }

  async moderateSubmission(
    id: string,
    newStatus: string, // e.g., "Accepted" or "Rejected" (ensure these are the exact strings you want to store)
    rejectionReason?: string,
    moderatorId?: string // Optional, pass from controller if you implement user tracking
  ): Promise<SubmissionDocument | null> {
    console.log(`NestJS Service: moderateSubmission for ID ${id} to status ${newStatus}`);
    const submissionToUpdate = await this.submissionModel.findById(id).exec();

    if (!submissionToUpdate) {
      throw new NotFoundException(`Submission with ID "${id}" not found`);
    }

    const updatePayload: any = {
      status: newStatus,
      moderatedAt: new Date(),
    };
    if (moderatorId) {
      updatePayload.moderatedBy = new Types.ObjectId(moderatorId);
    }

    if (newStatus === 'Rejected') { // Use the exact string you intend to store
      if (!rejectionReason) {
        throw new BadRequestException('Rejection reason is required when rejecting.');
      }
      updatePayload.rejectionReason = rejectionReason;
    } else {
      // If changing status from Rejected to Accepted, or just Accepted, clear reason
      updatePayload.rejectionReason = undefined; 
    }
    
    return this.submissionModel.findByIdAndUpdate(id, { $set: updatePayload }, { new: true }).exec();
  }
  
}