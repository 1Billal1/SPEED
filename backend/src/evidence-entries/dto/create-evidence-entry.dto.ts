// backend/src/evidence-entries/dto/create-evidence-entry.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import {
  EvidenceResult,
  ResearchType,
  ParticipantType,
} from '../schemas/evidence-entry.schema';

export class CreateEvidenceEntryDto {
  @IsMongoId()
  @IsNotEmpty()
  submissionId: string;

  @IsString()
  @IsNotEmpty()
  sePractice: string;

  @IsString()
  @IsNotEmpty()
  claim: string;

  @IsEnum(EvidenceResult)
  @IsNotEmpty()
  resultOfEvidence: EvidenceResult;

  @IsOptional()
  @IsEnum(ResearchType)
  typeOfResearch?: ResearchType;

  @IsOptional()
  @IsEnum(ParticipantType)
  typeOfParticipants?: ParticipantType;

  @IsOptional()
  @IsString()
  strengthOfEvidence?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  analystNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  extractedText?: string;
}
