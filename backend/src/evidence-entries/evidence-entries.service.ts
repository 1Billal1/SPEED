// backend/src/evidence-entries/evidence-entries.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import * as stringSimilarity from 'string-similarity';
import {
  EvidenceEntry,
  EvidenceEntryDocument,
} from './schemas/evidence-entry.schema';
import { CreateEvidenceEntryDto } from './dto/create-evidence-entry.dto';
import {
  Submission,
  SubmissionDocument,
} from '../submissions/schemas/submission.schema';

export interface SearchEvidenceParams {
  sePractice?: string;
  keywords?: string;
  page?: number;
  limit?: number;
}

export interface PopulatedSubmissionForSearch {
  _id: string;
  title?: string;
  authors?: string[];
  authorRaw?: string;
  year?: number;
  journal?: string;
  booktitle?: string;
  publisher?: string;
  doi?: string;
  url?: string;
  bibtexEntryType?: string;
  rawBibtex?: string;
  extractedText?: string;
}

export interface SearchEvidenceResult {
  evidence: Array<
    Omit<EvidenceEntryDocument, 'submissionId' | '_id'> & {
      _id: string;
      submissionId?: PopulatedSubmissionForSearch | string;
    }
  >;
  total: number;
  currentPage: number;
  totalPages: number;
}

@Injectable()
export class EvidenceEntriesService {
  constructor(
    @InjectModel(EvidenceEntry.name)
    private evidenceEntryModel: Model<EvidenceEntryDocument>,
    @InjectModel(Submission.name)
    private submissionModel: Model<SubmissionDocument>,
  ) {}

  async create(
    createEvidenceEntryDto: CreateEvidenceEntryDto,
    analystId: string,
  ): Promise<EvidenceEntryDocument> {
    if (
      !createEvidenceEntryDto.submissionId ||
      !Types.ObjectId.isValid(createEvidenceEntryDto.submissionId)
    ) {
      throw new BadRequestException('Invalid or missing submissionId.');
    }
    if (!analystId || !Types.ObjectId.isValid(analystId)) {
      throw new BadRequestException('Invalid or missing analystId.');
    }

    const submissionObjectId = new Types.ObjectId(
      createEvidenceEntryDto.submissionId,
    );
    const analystObjectId = new Types.ObjectId(analystId);

    const submission = await this.submissionModel
      .findById(submissionObjectId)
      .exec();

    if (!submission) {
      throw new NotFoundException(
        `Submission with ID ${createEvidenceEntryDto.submissionId} not found.`,
      );
    }

    const submissionIdString = (submission._id as Types.ObjectId).toString();

    if (submission.status !== 'Accepted') {
      throw new ForbiddenException(
        `Submission ${submissionIdString} is not in 'Accepted' state. Current status: ${submission.status}`,
      );
    }

    if (typeof createEvidenceEntryDto.extractedText === 'string') {
      submission.extractedText = createEvidenceEntryDto.extractedText;
    }

    submission.status = 'Analyzed';
    submission.moderatedBy = analystObjectId;
    submission.moderatedAt = new Date();
    await submission.save();

    const newEvidenceEntryData = {
      ...createEvidenceEntryDto,
      submissionId: submissionObjectId,
      analyzedBy: analystObjectId,
    };

    const newEvidenceEntry = new this.evidenceEntryModel(newEvidenceEntryData);
    return newEvidenceEntry.save();
  }

  async findAllForSubmission(
    submissionId: string,
  ): Promise<EvidenceEntryDocument[]> {
    if (!Types.ObjectId.isValid(submissionId)) return [];
    return this.evidenceEntryModel
      .find({ submissionId: new Types.ObjectId(submissionId) })
      .exec();
  }

  private escapeRegex(str: string): string {
    if (!str) return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async searchEvidence(
    params: SearchEvidenceParams,
  ): Promise<SearchEvidenceResult> {
    const { sePractice, keywords, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    const query: FilterQuery<EvidenceEntryDocument> = {};
    const conditions: FilterQuery<EvidenceEntryDocument>[] = [];

    if (sePractice?.trim()) {
      conditions.push({
        sePractice: {
          $regex: new RegExp(`^${this.escapeRegex(sePractice.trim())}$`, 'i'),
        },
      });
    }

    if (keywords?.trim()) {
      const trimmedKeywords = keywords.trim();
      const keywordRegex = new RegExp(this.escapeRegex(trimmedKeywords), 'i');

      const matchingSubmissionDocs = await this.submissionModel
        .find({ $text: { $search: trimmedKeywords } })
        .select('_id')
        .lean()
        .exec();

      const matchingSubmissionIds = matchingSubmissionDocs.map((s) => s._id);

      const keywordOrConditions: FilterQuery<EvidenceEntryDocument>[] = [
        { sePractice: keywordRegex },
        { claim: keywordRegex },
        { analystNotes: keywordRegex },
      ];

      if (matchingSubmissionIds.length > 0) {
        keywordOrConditions.push({
          submissionId: { $in: matchingSubmissionIds },
        });
      }

      conditions.push({ $or: keywordOrConditions });
    }

    if (conditions.length > 0) {
      query.$and = conditions;
    } else if (!sePractice && !keywords) {
      console.log('[SVC SearchEvidence] No search criteria, returning empty.');
      return { evidence: [], total: 0, currentPage: page, totalPages: 0 };
    }

    console.log(
      '[SVC SearchEvidence] Final MongoDB Query for EvidenceEntry:',
      JSON.stringify(query, null, 2),
    );

    const evidenceEntries = await this.evidenceEntryModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate<{ submissionId: PopulatedSubmissionForSearch }>({
        path: 'submissionId',
        model: Submission.name,
        select:
          'title authors authorRaw year journal booktitle publisher doi url bibtexEntryType rawBibtex extractedText',
      })
      .exec();

    const total = await this.evidenceEntryModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const evidenceResults = evidenceEntries.map((entry) => {
      const plainEntry = entry.toObject() as any;

      if (
        plainEntry.submissionId &&
        typeof plainEntry.submissionId === 'object'
      ) {
        plainEntry.submissionId._id = (
          plainEntry.submissionId._id as Types.ObjectId
        ).toString();
      } else if (plainEntry.submissionId) {
        plainEntry.submissionId = (
          plainEntry.submissionId as Types.ObjectId
        ).toString();
      }

      plainEntry._id = (plainEntry._id as Types.ObjectId).toString();

      return plainEntry as Omit<
        EvidenceEntryDocument,
        'submissionId' | '_id'
      > & {
        _id: string;
        submissionId?: PopulatedSubmissionForSearch | string;
      };
    });

    return {
      evidence: evidenceResults,
      total,
      currentPage: page,
      totalPages,
    };
  }

  async moderateSubmission(
    id: string,
    newStatus: string,
    rejectionReason?: string,
    moderatorId?: string,
    duplicateOfId?: string,
  ): Promise<SubmissionDocument | null> {
    const submissionToUpdate = await this.submissionModel
      .findById(new Types.ObjectId(id))
      .exec();
    if (!submissionToUpdate)
      throw new NotFoundException(`Submission with ID "${id}" not found`);

    if (
      submissionToUpdate.status !== 'pending' &&
      submissionToUpdate.status === newStatus
    )
      return submissionToUpdate;

    const updatePayload: any = {
      status: newStatus,
      moderatedAt: new Date(),
    };

    if (moderatorId && Types.ObjectId.isValid(moderatorId)) {
      updatePayload.moderatedBy = new Types.ObjectId(moderatorId);
    }

    if (newStatus === 'Rejected') {
      if (!rejectionReason)
        throw new BadRequestException(
          'Rejection reason is required when rejecting.',
        );
      updatePayload.rejectionReason = rejectionReason;

      if (
        duplicateOfId &&
        Types.ObjectId.isValid(duplicateOfId) &&
        (rejectionReason.toLowerCase().includes('duplicate') ||
          rejectionReason.toLowerCase().includes('already in speed'))
      ) {
        updatePayload.isDuplicateOf = new Types.ObjectId(duplicateOfId);
      } else {
        updatePayload.isDuplicateOf = undefined;
      }
    } else {
      updatePayload.rejectionReason = undefined;
      updatePayload.isDuplicateOf = undefined;
    }

    return this.submissionModel
      .findByIdAndUpdate(id, { $set: updatePayload }, { new: true })
      .exec();
  }
}
