// backend/src/submissions/schemas/submission.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Submission {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [String], required: true })
  authors: string[];

  // MODIFIED: Added a default value.
  // `required: true` will still be effectively enforced by CreateSubmissionDto for NEW submissions.
  // This default helps when re-saving older documents that might be missing this field.
  @Prop({ required: true, default: 'ARTICLE' }) // Or 'UNKNOWN' if 'ARTICLE' isn't a safe general default
  bibtexEntryType: string;

  @Prop()
  year?: number;

  @Prop()
  journal?: string;

  @Prop()
  booktitle?: string;

  @Prop()
  publisher?: string;

  @Prop()
  doi?: string;

  @Prop()
  url?: string;

  @Prop()
  volume?: string;

  @Prop()
  number?: string; // Issue number

  @Prop()
  pages?: string;

  @Prop({ type: String, maxlength: 5000 })
  abstract?: string;

  @Prop({ type: String })
  rawBibtex?: string;

  @Prop()
  authorRaw?: string; // Original author string from BibTeX

  @Prop({ type: String, maxlength: 10000 })
  extractedText?: string;

  @Prop({ default: 'pending' })
  status: string; // e.g., 'pending', 'Accepted', 'Rejected', 'Analyzed'

  @Prop({ type: Types.ObjectId, ref: 'User' })
  submitterId?: Types.ObjectId;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'Submission' })
  isDuplicateOf?: Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  editHistory: any[]; // Consider defining a specific type for edit history items

  @Prop({ type: Types.ObjectId, ref: 'User' })
  moderatedBy?: Types.ObjectId; // Could be moderator or analyst

  @Prop()
  moderatedAt?: Date; // Timestamp for last moderation/analysis action
}
export type SubmissionDocument = Submission & Document;
export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// Ensure text indexes are created in MongoDB for efficient $text searching
// Note: 'sePractice' and 'claim' are on EvidenceEntry, not Submission.
// If you want to search authors as text, Mongoose handles array of strings for text index.
SubmissionSchema.index({
  title: 'text',
  authorRaw: 'text',
  authors: 'text', // Indexing the array of authors
  journal: 'text',
  booktitle: 'text',
  abstract: 'text', // Good to index for keyword search
  extractedText: 'text', // Good to index for keyword search
});

// --- User Schema --- (Included for completeness of the file you provided)
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // hashed

  @Prop({
    required: true,
    enum: ['submitter', 'moderator', 'analyst'],
  })
  role: 'submitter' | 'moderator' | 'analyst';
}
export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
