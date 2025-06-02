import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Submission {
  @Prop({ required: true }) title: string;
  @Prop({ type: [String], required: true }) authors: string[];
  @Prop({ required: true }) journal: string;
  @Prop({ required: true }) year: number;
  @Prop({ required: true }) doi: string;

  // Keep only this line for status
  @Prop({ default: 'pending' }) // 'pending' | 'in_moderation' | 'approved' | 'rejected'
  status: string;

  @Prop() submittedAt: Date;

  @Prop({ type: [Object], default: [] }) // Optional: store full previous versions
  editHistory: any[];
}

export type SubmissionDocument = Submission & Document;
export const SubmissionSchema = SchemaFactory.createForClass(Submission);

@Schema()
export class User {
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) password: string; // hashed
  @Prop({ required: true, enum: ['submitter', 'moderator', 'analyst'] })
  role: 'submitter' | 'moderator' | 'analyst';
}