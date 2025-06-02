import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Submission {
  @Prop({ required: true }) title: string;
  @Prop({ type: [String], required: true }) authors: string[];
  @Prop({ required: true }) journal: string;
  @Prop({ required: true }) year: number;
  @Prop({ required: true }) doi: string;
  @Prop({ default: 'pending' }) status: string;
  @Prop() submittedAt: Date;
}

export type SubmissionDocument = Submission & Document;
export const SubmissionSchema = SchemaFactory.createForClass(Submission);
