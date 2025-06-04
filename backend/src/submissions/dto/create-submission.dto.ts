// backend/src/submissions/dto/create-submission.dto.ts
import { 
  IsString, 
  IsArray, 
  IsOptional, 
  IsNumber, 
  ArrayMinSize, 
  IsNotEmpty, 
  IsUrl 
} from 'class-validator';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  authors: string[];

  @IsString()
  @IsNotEmpty()
  bibtexEntryType: string;

  @IsNumber()
  @IsOptional() 
  year?: number;

  @IsString()
  @IsNotEmpty() 
  journal: string;

  @IsString()
  @IsNotEmpty()
  doi: string;

  @IsOptional()
  @IsString()
  booktitle?: string;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  volume?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  pages?: string;

  @IsOptional()
  @IsString()
  abstract?: string;

  @IsOptional()
  @IsString()
  rawBibtex?: string;

  @IsOptional()
  @IsString()
  authorRaw?: string;
}