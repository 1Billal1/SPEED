// backend/src/submissions/submissions.service.ts
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
    private submissionModel: Model<SubmissionDocument> // ONLY THIS INJECTION
  ) {}

  async parseBibtex(bibtexContent: string): Promise<Partial<CreateSubmissionDto>> {
    try {
      const entries = bibtexParse.toJSON(bibtexContent);
      if (!entries || entries.length === 0) {
        throw new Error('No BibTeX entries found or invalid format.');
      }
  
      const entry = entries[0];
      if (!entry.entryTags || !entry.citationKey || !entry.entryType) {
        throw new Error('Parsed BibTeX entry is missing essential parts.');
      }
  
      const tags = entry.entryTags;
      const parsedData: Partial<CreateSubmissionDto> = {
        rawBibtex: bibtexContent,
        bibtexEntryType: entry.entryType.toUpperCase(),
        title: this.removeBibtexBraces(tags.title),
        authors: tags.author ? tags.author.split(' and ').map((a: string) => a.trim()) : [],
        authorRaw: tags.author,
        year: tags.year ? parseInt(tags.year, 10) : undefined,
        journal: this.removeBibtexBraces(tags.journal),
        booktitle: this.removeBibtexBraces(tags.booktitle),
        publisher: this.removeBibtexBraces(tags.publisher),
        doi: this.removeBibtexBraces(tags.doi),
        url: this.removeBibtexBraces(tags.url),
        volume: this.removeBibtexBraces(tags.volume),
        number: this.removeBibtexBraces(tags.number || tags.issue),
        pages: this.removeBibtexBraces(tags.pages),
        abstract: this.removeBibtexBraces(tags.abstract),
      };
  
      Object.keys(parsedData).forEach(
        key => parsedData[key as keyof typeof parsedData] === undefined 
          && delete parsedData[key as keyof typeof parsedData]
      );
  
      return parsedData;
    } catch (error: any) {
      console.error('BibTeX parsing error in service:', error);
      throw new BadRequestException(
        `Failed to parse BibTeX: ${error.message || 'Unknown parsing error'}`
      );
    }
  }

  private removeBibtexBraces(value?: string): string {
    return value ? value.replace(/[{}]/g, '') : '';
  }

  private normalizeTitle(title?: string): string {
    if (!title) return '';
    return title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
  }

  async create(createSubmissionDto: CreateSubmissionDto & { submitterId?: string }): Promise<SubmissionDocument> {
    const submissionData: any = { ...createSubmissionDto, status: 'pending' };
    if (createSubmissionDto.submitterId && Types.ObjectId.isValid(createSubmissionDto.submitterId)) {
        submissionData.submitterId = new Types.ObjectId(createSubmissionDto.submitterId);
    }
    const newSubmission = new this.submissionModel(submissionData);
    return newSubmission.save();
  }

  private escapeRegex(string: string): string {
    if (!string) return '';
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async search(query: string): Promise<SubmissionDocument[]> {
    const regex = new RegExp(this.escapeRegex(query), 'i');
    return this.submissionModel.find({
      $or: [ { title: regex }, { authors: regex }, { journal: regex }, { doi: regex },
        ...( !isNaN(Number(query)) ? [{ year: Number(query) }] : [] )],
    }).exec();
  }
  
  async findById(id: string): Promise<SubmissionDocument | null> {
    if (!Types.ObjectId.isValid(id)) { console.warn(`SubmissionsService: findById called with invalid ID format: ${id}`); return null; }
    return this.submissionModel.findById(id).exec();
  }

  async getPendingBySubmitter(submitterId: string): Promise<SubmissionDocument[]> {
    if (!Types.ObjectId.isValid(submitterId)) return [];
    if (!this.submissionModel.schema.path('submitterId')) { console.warn("SubmissionsService: 'submitterId' field does not exist."); return Promise.resolve([]); }
    return this.submissionModel.find({ submitterId: new Types.ObjectId(submitterId), status: 'pending' }).exec();
  }

  async editSubmission(id: string, updateDto: Partial<CreateSubmissionDto>): Promise<SubmissionDocument | null> {
    const submission = await this.findById(id); 
    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status !== 'pending') throw new ForbiddenException('Cannot edit non-pending submission.');
    if (!submission.editHistory) submission.editHistory = [];
    const submissionIdString = (submission._id instanceof Types.ObjectId || typeof submission._id?.toString === 'function') ? submission._id.toString() : null;
    if (!submissionIdString) throw new Error(`Critical error: Fetched submission has an invalid _id.`);
    console.log(`[SVC editSubmission] Editing submission with ID: ${submissionIdString}`);
    const previousState = {
      title: submission.title, authors: submission.authors ? [...submission.authors] : [], 
      journal: submission.journal, year: submission.year, doi: submission.doi,
    };
    submission.editHistory.push({ editedAt: new Date(), previous: previousState });
    Object.assign(submission, updateDto);
    return submission.save();
  }
  
  async findPendingForModeration(): Promise<SubmissionDocument[]> { 
    return this.submissionModel.find({ status: 'pending' }).sort({ createdAt: -1 }).exec();
  }

  async findSubmissionsByStatus(
    statusQueryFromFrontend: string,
    page: number = 1, 
    limit: number = 10
  ): Promise<{ submissions: SubmissionDocument[], total: number, currentPage: number, totalPages: number }> {
    let dbStatusQuery: string;
    switch (statusQueryFromFrontend.toLowerCase()) {
        case 'pending': dbStatusQuery = 'pending'; break;
        case 'accepted': dbStatusQuery = 'Accepted'; break;
        case 'rejected': dbStatusQuery = 'Rejected'; break;
        case 'analyzed': dbStatusQuery = 'Analyzed'; break; 
        default: throw new BadRequestException(`Invalid status filter: ${statusQueryFromFrontend}`);
    }
    const skip = (page - 1) * limit;
    const query = { status: dbStatusQuery };
    const submissions = await this.submissionModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select('title authors journal year doi status createdAt rejectionReason').lean().exec();
    const total = await this.submissionModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    return { submissions: submissions as SubmissionDocument[], total, currentPage: page, totalPages };
  }

  async findPotentialDuplicates(
    submissionIdToExclude: string, titleToCheck?: string, doiToCheck?: string,
  ): Promise<PlainSubmissionForDuplicateCheck[]> {
    const potentialDuplicatesMap = new Map<string, PlainSubmissionForDuplicateCheck>();
    const SIMILARITY_THRESHOLD = 0.80; 
    const selectFields = 'title authors journal year doi status createdAt';
    const toPlainDuplicate = (doc: any, score?: number): PlainSubmissionForDuplicateCheck => {
        const idStr = doc._id instanceof Types.ObjectId ? doc._id.toString() : String(doc._id);
        return { _id: idStr, title: doc.title, authors: doc.authors || [], journal: doc.journal, year: doc.year, doi: doc.doi, status: doc.status, createdAt: doc.createdAt, ...(score !== undefined && { similarityScore: score }), };
    };
    if (doiToCheck && doiToCheck.trim() !== '') {
      const normalizedDoi = doiToCheck.trim().toLowerCase();
      const doiMatches = await this.submissionModel.find({ _id: { $ne: new Types.ObjectId(submissionIdToExclude) }, doi: { $regex: new RegExp(`^${this.escapeRegex(normalizedDoi)}$`, 'i') }, status: 'Accepted', }).limit(5).select(selectFields).lean().exec();
      doiMatches.forEach(match => { const plain = toPlainDuplicate(match, 1.0); if (!potentialDuplicatesMap.has(plain._id)) potentialDuplicatesMap.set(plain._id, plain); });
    }
    if (titleToCheck && titleToCheck.trim() !== '') {
      const normalizedTitleToCheck = this.normalizeTitle(titleToCheck);
      if (normalizedTitleToCheck.length > 5) {
        const candidateSubmissions = await this.submissionModel.find({ _id: { $ne: new Types.ObjectId(submissionIdToExclude) }, status: 'Accepted', title: { $exists: true, $ne: null, $regex: /\S/ } }).select(selectFields).lean().exec();
        for (const existingDoc of candidateSubmissions) {
          if (existingDoc.title) {
            const normalizedExistingTitle = this.normalizeTitle(existingDoc.title);
            if (normalizedExistingTitle.length > 5) {
              const similarity = stringSimilarity.compareTwoStrings(normalizedTitleToCheck, normalizedExistingTitle);
              if (similarity >= SIMILARITY_THRESHOLD) {
                const plain = toPlainDuplicate(existingDoc, similarity);
                const existingMapEntry = potentialDuplicatesMap.get(plain._id);
                if (!existingMapEntry || (existingMapEntry.similarityScore || 0) < similarity) { potentialDuplicatesMap.set(plain._id, plain); }
              } } } } } }
    const results = Array.from(potentialDuplicatesMap.values());
    results.sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));
    return results.slice(0, 5);
  }

  async moderateSubmission(
    id: string, newStatus: string, rejectionReason?: string, moderatorId?: string, duplicateOfId?: string
  ): Promise<SubmissionDocument | null> {
    const submissionToUpdate = await this.findById(id);
    if (!submissionToUpdate) throw new NotFoundException(`Submission with ID "${id}" not found`);
    if (submissionToUpdate.status !== 'pending' && submissionToUpdate.status === newStatus) return submissionToUpdate;
    if (submissionToUpdate.status !== 'pending' && newStatus !== submissionToUpdate.status) { 
         console.warn(`Attempting to moderate submission ${id} not in 'pending' state. Current: ${submissionToUpdate.status}, New: ${newStatus}`);
    }

    const updatePayload: Partial<SubmissionDocument> & { moderatedAt?: Date; moderatedBy?: Types.ObjectId; isDuplicateOf?: Types.ObjectId | undefined; } = {
      status: newStatus, moderatedAt: new Date(),
    };
    if (moderatorId && Types.ObjectId.isValid(moderatorId)) updatePayload.moderatedBy = new Types.ObjectId(moderatorId);
    if (newStatus === 'Rejected') {
      if (!rejectionReason) throw new BadRequestException('Rejection reason is required when rejecting.');
      updatePayload.rejectionReason = rejectionReason;
      if (duplicateOfId && Types.ObjectId.isValid(duplicateOfId) && (rejectionReason.toLowerCase().includes('duplicate') || rejectionReason.toLowerCase().includes('already in speed'))) {
        updatePayload.isDuplicateOf = new Types.ObjectId(duplicateOfId);
      } else { updatePayload.isDuplicateOf = undefined; }
    } else { updatePayload.rejectionReason = undefined; updatePayload.isDuplicateOf = undefined; }
    return this.submissionModel.findByIdAndUpdate(id, { $set: updatePayload }, { new: true }).exec();
  }
}