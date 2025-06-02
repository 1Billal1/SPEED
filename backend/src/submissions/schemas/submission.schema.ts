import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Submission {
  @Prop({ required: true }) title: string;
  @Prop({ type: [String], required: true }) authors: string[];
  @Prop({ required: true }) journal: string;
  @Prop({ required: true }) year: number;
  @Prop({ required: true }) doi: string;

  @Prop({ default: 'pending' }) 
  status: string;

  @Prop() submittedAt: Date;

  @Prop({ type: [Object], default: [] }) 
  editHistory: any[];
}

export type SubmissionDocument = Submission & Document;
export const SubmissionSchema = SchemaFactory.createForClass(Submission);

@Schema()
export class User {
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop({ required: true, enum: ['submitter', 'moderator', 'analyst'] })
  role: 'submitter' | 'moderator' | 'analyst';
}