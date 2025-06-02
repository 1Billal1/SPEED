// create-submission.dto.ts
import { IsArray, IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateSubmissionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  authors: string[]; 

  @IsNotEmpty()
  @IsString()
  journal: string;

  @IsNotEmpty()
  @IsNumber()
  year: number;

  @IsNotEmpty()
  @IsString()
  doi: string;
}