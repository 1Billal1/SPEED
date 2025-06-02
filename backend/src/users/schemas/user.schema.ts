// backend/src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User {
  @Prop({ required: true, unique: true }) email: string;
  @Prop({ required: true }) password: string;
  @Prop({ default: 'submitter' }) role: 'submitter' | 'moderator' | 'analyst';
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
