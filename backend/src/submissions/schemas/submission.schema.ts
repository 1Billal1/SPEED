// backend/src/submissions/schemas/submission.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true }) // Adds createdAt and updatedAt
export class Submission {
  @Prop({ required: true })
  title: string;

  @Prop({ type: [String], required: true })
  authors: string[];

  @Prop({ required: true })
  journal: string;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  doi: string;

  @Prop({ default: 'pending' })
  status: string; // e.g., 'pending', 'Accepted', 'Rejected'

  @Prop({ type: Types.ObjectId, ref: 'User' })
  submitterId?: Types.ObjectId;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'Submission' })
  isDuplicateOf?: Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  editHistory: any[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  moderatedBy?: Types.ObjectId;

  @Prop()
  moderatedAt?: Date;
}

export type SubmissionDocument = Submission & Document;
export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// --- User Schema (ensure this matches your actual User schema if separate) ---
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // hashed

  @Prop({ 
    required: true, 
    enum: ['submitter', 'moderator', 'analyst'] 
  })
  role: 'submitter' | 'moderator' | 'analyst';
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);