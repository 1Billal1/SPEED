// backend/src/evidence-entries/schemas/evidence-entry.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum EvidenceResult {
  SUPPORTS = 'Supports Claim',
  REFUTES = 'Refutes Claim',
  INCONCLUSIVE = 'Inconclusive/Mixed',
}

export enum ResearchType {
  CASE_STUDY = 'Case Study',
  EXPERIMENT = 'Experiment',
  SURVEY = 'Survey',
  LITERATURE_REVIEW = 'Literature Review',
  OTHER = 'Other',
}

export enum ParticipantType {
  STUDENTS = 'Students',
  PROFESSIONALS = 'Professionals',
  MIXED = 'Mixed',
  NA = 'Not Applicable',
}

@Schema({ timestamps: true })
export class EvidenceEntry extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: 'Submission',
    required: true,
    index: true,
  })
  submissionId: Types.ObjectId;

  @Prop({ required: true })
  sePractice: string;

  @Prop({ required: true })
  claim: string;

  @Prop({ type: String, enum: EvidenceResult, required: true })
  resultOfEvidence: EvidenceResult;

  @Prop({ type: String, enum: ResearchType })
  typeOfResearch?: ResearchType;

  @Prop({ type: String, enum: ParticipantType })
  typeOfParticipants?: ParticipantType;

  @Prop()
  strengthOfEvidence?: string;

  @Prop({ type: String, maxlength: 2000 })
  analystNotes?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  analyzedBy: Types.ObjectId;
}

export type EvidenceEntryDocument = EvidenceEntry & Document;
export const EvidenceEntrySchema = SchemaFactory.createForClass(EvidenceEntry);

EvidenceEntrySchema.index({
  sePractice: 'text',
  claim: 'text',
  analystNotes: 'text',
});
