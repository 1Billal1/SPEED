import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as stringSimilarity from 'string-similarity';
const bibtexParse = require('bibtex-parse-js');

import { Submission, SubmissionDocument } from './schemas/submission.schema';
import { CreateSubmissionDto } from './dto/create-submission.dto';

export interface PlainSubmissionForDuplicateCheck {
  _id: string;
  title?: string;
  authors?: string[];
  journal?: string;
  year?: number;
  doi?: string;
  status: string;
  createdAt?: Date | string;
  similarityScore?: number;
}

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

  private normalizeTitle(title?: string): string {
    if (!title) return '';
    return title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
  }

  private escapeRegex(string: string): string {
    if (!string) return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async findSubmissionsByStatus(
    statusQueryFromFrontend: string,
    page: number = 1, 
    limit: number = 10
  ): Promise<{ submissions: SubmissionDocument[]; total: number; currentPage: number; totalPages: number }> {
    let dbStatusQuery: string;
    switch (statusQueryFromFrontend.toLowerCase()) {
      case 'pending':
        dbStatusQuery = 'pending';
        break;
      case 'accepted':
        dbStatusQuery = 'Accepted';
        break;
      case 'rejected':
        dbStatusQuery = 'Rejected';
        break;
      default:
        console.error(`[SVC-FindByStatus] Invalid status query from frontend: ${statusQueryFromFrontend}`);
        throw new BadRequestException(`Invalid status filter: ${statusQueryFromFrontend}`);
    }

    console.log(`--- [SVC-FindByStatus] ---`);
    console.log(`Frontend Query Status: "${statusQueryFromFrontend}"`);
    console.log(`Mapped DB Status for Query: "${dbStatusQuery}"`);
    console.log(`Page: ${page}, Limit: ${limit}`);
    
    const skip = (page - 1) * limit;
    const mongoQuery = { status: dbStatusQuery };

    const [submissions, total] = await Promise.all([
      this.submissionModel
        .find(mongoQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title authors journal year doi status createdAt rejectionReason')
        .exec(),
      this.submissionModel.countDocuments(mongoQuery)
    ]);

    const totalPages = Math.ceil(total / limit);

    console.log(`Found ${submissions.length} submissions in DB for status "${dbStatusQuery}" (page ${page}).`);
    console.log(`Total items for status "${dbStatusQuery}": ${total}, Total pages: ${totalPages}`);
    console.log(`--- [SVC-FindByStatus-EXIT] ---`);

    return {
      submissions,
      total,
      currentPage: page,
      totalPages,
    };
  }

  async create(createSubmissionDto: CreateSubmissionDto & { submitterId?: string }): Promise<SubmissionDocument> {
    const submissionData: any = { ...createSubmissionDto, status: 'pending' };
    if (createSubmissionDto.submitterId && Types.ObjectId.isValid(createSubmissionDto.submitterId)) {
      submissionData.submitterId = new Types.ObjectId(createSubmissionDto.submitterId);
    }
    const newSubmission = new this.submissionModel(submissionData);
    return newSubmission.save();
  }

  async search(query: string): Promise<SubmissionDocument[]> {
    const regex = new RegExp(this.escapeRegex(query), 'i');
    return this.submissionModel.find({
      $or: [
        { title: regex },
        { authors: regex },
        { journal: regex },
        { doi: regex },
        ...(!isNaN(Number(query)) ? [{ year: Number(query) }] : [])
      ],
    }).exec();
  }
  
  async findById(id: string): Promise<SubmissionDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      console.warn(`SubmissionsService: findById called with invalid ID format: ${id}`);
      return null;
    }
    return this.submissionModel.findById(id).exec();
  }

  async getPendingBySubmitter(submitterId: string): Promise<SubmissionDocument[]> {
    if (!Types.ObjectId.isValid(submitterId)) return [];
    if (!this.submissionModel.schema.path('submitterId')) { 
      console.warn("SubmissionsService: 'submitterId' field does not exist on Submission schema");
      return Promise.resolve([]);
    }
    return this.submissionModel.find({ 
      submitterId: new Types.ObjectId(submitterId),
      status: 'pending'
    }).exec();
  }

  async editSubmission(id: string, updateDto: Partial<CreateSubmissionDto>): Promise<SubmissionDocument | null> {
    const submission = await this.findById(id);
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status !== 'pending') throw new ForbiddenException('Cannot edit non-pending submission.');
    
    if (!submission.editHistory) submission.editHistory = [];
    const previousState = {
      title: submission.title,
      authors: submission.authors ? [...submission.authors] : [],
      journal: submission.journal,
      year: submission.year,
      doi: submission.doi,
    };
    submission.editHistory.push({
      editedAt: new Date(),
      previous: previousState
    });
    
    Object.assign(submission, updateDto);
    return submission.save();
  }
  
  async findPendingForModeration(): Promise<SubmissionDocument[]> {
    return this.submissionModel.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPotentialDuplicates(
    submissionIdToExclude: string,
    titleToCheck?: string,
    doiToCheck?: string,
  ): Promise<PlainSubmissionForDuplicateCheck[]> {
    const potentialDuplicatesMap = new Map<string, PlainSubmissionForDuplicateCheck>();
    const SIMILARITY_THRESHOLD = 0.80;
    const selectFields = 'title authors journal year doi status createdAt';

    const toPlainDuplicate = (doc: any, score?: number): PlainSubmissionForDuplicateCheck => {
      const idStr = doc._id instanceof Types.ObjectId ? doc._id.toString() : String(doc._id);
      return {
        _id: idStr,
        title: doc.title,
        authors: doc.authors || [],
        journal: doc.journal,
        year: doc.year,
        doi: doc.doi,
        status: doc.status,
        createdAt: doc.createdAt,
        ...(score !== undefined && { similarityScore: score }),
      };
    };

    if (doiToCheck && doiToCheck.trim() !== '') {
      const normalizedDoi = doiToCheck.trim().toLowerCase();
      const doiMatches = await this.submissionModel.find({
        _id: { $ne: new Types.ObjectId(submissionIdToExclude) },
        doi: { $regex: new RegExp(`^${this.escapeRegex(normalizedDoi)}$`, 'i') },
        status: 'Accepted',
      }).select(selectFields).lean().exec();

      doiMatches.forEach(match => {
        potentialDuplicatesMap.set(match._id.toString(), toPlainDuplicate(match, 1.0));
      });
    }

    if (titleToCheck && titleToCheck.trim() !== '') {
      const normalizedTitleToCheck = this.normalizeTitle(titleToCheck);
      if (normalizedTitleToCheck.length > 5) {
        const candidateSubmissions = await this.submissionModel.find({
          _id: { $ne: new Types.ObjectId(submissionIdToExclude) },
          status: 'Accepted',
          title: { $exists: true, $ne: null, $regex: /\S/ }
        }).select(selectFields).lean().exec();

        for (const existingDoc of candidateSubmissions) {
          if (existingDoc.title) {
            const normalizedExistingTitle = this.normalizeTitle(existingDoc.title);
            if (normalizedExistingTitle.length > 5) {
              const similarity = stringSimilarity.compareTwoStrings(normalizedTitleToCheck, normalizedExistingTitle);
              if (similarity >= SIMILARITY_THRESHOLD) {
                const plain = toPlainDuplicate(existingDoc, similarity);
                const existingMapEntry = potentialDuplicatesMap.get(plain._id);
                if (!existingMapEntry || (existingMapEntry.similarityScore || 0) < similarity) {
                  potentialDuplicatesMap.set(plain._id, plain);
                }
              }
            }
          }
        }
      }
    }
    
    const results = Array.from(potentialDuplicatesMap.values());
    results.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
    return results.slice(0, 5);
  }

  async moderateSubmission(
    id: string,
    newStatus: string,
    rejectionReason?: string,
    moderatorId?: string,
    duplicateOfId?: string
  ): Promise<SubmissionDocument | null> {
    const submissionToUpdate = await this.findById(id);
    if (!submissionToUpdate) throw new NotFoundException(`Submission with ID "${id}" not found`);

    if (submissionToUpdate.status !== 'pending' && submissionToUpdate.status === newStatus) {
      console.warn(`Submission ${id} is already in status "${newStatus}". No action taken.`);
      return submissionToUpdate;
    }

    const updatePayload: Partial<SubmissionDocument> & { 
      moderatedAt?: Date;
      moderatedBy?: Types.ObjectId;
      isDuplicateOf?: Types.ObjectId | undefined;
    } = {
      status: newStatus,
      moderatedAt: new Date(),
    };

    if (moderatorId && Types.ObjectId.isValid(moderatorId)) {
      updatePayload.moderatedBy = new Types.ObjectId(moderatorId);
    }

    if (newStatus === 'Rejected') {
      if (!rejectionReason) throw new BadRequestException('Rejection reason is required when rejecting.');
      updatePayload.rejectionReason = rejectionReason;
      if (duplicateOfId && Types.ObjectId.isValid(duplicateOfId) && 
          (rejectionReason.toLowerCase().includes('duplicate') || 
           rejectionReason.toLowerCase().includes('already in speed'))) {
        updatePayload.isDuplicateOf = new Types.ObjectId(duplicateOfId);
      } else {
        updatePayload.isDuplicateOf = undefined;
      }
    } else {
      updatePayload.rejectionReason = undefined;
      updatePayload.isDuplicateOf = undefined;
    }
    
    return this.submissionModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true }
    ).exec();
  }
}