// backend/src/submissions/schemas/submission.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose'; // Import Types

// Optional: Define an enum for status if you want to enforce specific values
// export enum SubmissionStatusEnum {
//   PENDING = 'pending',
//   ACCEPTED = 'Accepted', // Note: Case difference from 'pending' if you mix
//   REJECTED = 'Rejected'
// }

@Schema({ timestamps: true }) // Adds createdAt and updatedAt
export class Submission {
  @Prop({ required: true })
  title: string;

<<<<<<< Updated upstream
  @Prop({ default: 'pending' }) 
  status: string;
=======
  @Prop({ type: [String], required: true })
  authors: string[];
>>>>>>> Stashed changes

  @Prop({ required: true })
  journal: string;

<<<<<<< Updated upstream
  @Prop({ type: [Object], default: [] }) 
=======
  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  doi: string;

  @Prop({ default: 'pending' }) // Stays as 'pending' to match your current logic
  status: string; // Could be SubmissionStatusEnum if you define and use it

  @Prop({ type: Types.ObjectId, ref: 'User' }) // Optional: Link to the user who submitted
  submitterId?: Types.ObjectId; 

  @Prop()
  rejectionReason?: string; // For storing why a submission was rejected

  @Prop({ type: [Object], default: [] })
>>>>>>> Stashed changes
  editHistory: any[];

  // Optional fields for tracking moderation
  @Prop({ type: Types.ObjectId, ref: 'User' })
  moderatedBy?: Types.ObjectId;

  @Prop()
  moderatedAt?: Date;

  // submittedAt is effectively createdAt from timestamps: true
}

export type SubmissionDocument = Submission & Document;
export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// --- User Schema (assuming it's in the same file for brevity, usually separate) ---
@Schema({ timestamps: true })
export class User {
<<<<<<< Updated upstream
  @Prop({ required: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop({ required: true, enum: ['submitter', 'moderator', 'analyst'] })
=======
  @Prop({ required: true, unique: true }) // email should be unique
  email: string;

  @Prop({ required: true })
  password: string; // hashed

  @Prop({ 
    required: true, 
    enum: ['submitter', 'moderator', 'analyst'] 
  })
>>>>>>> Stashed changes
  role: 'submitter' | 'moderator' | 'analyst';
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);