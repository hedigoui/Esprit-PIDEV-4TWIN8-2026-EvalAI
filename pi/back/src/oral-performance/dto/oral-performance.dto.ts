// src/oral-performance/dto/create-oral-performance.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateOralPerformanceDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsOptional()
  instructorId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  scheduledDate?: Date;
}

// src/oral-performance/dto/update-scores.dto.ts
export class UpdateScoresDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  overallScore?: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  pronunciation: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  fluency: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  vocabulary: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  grammar: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  comprehension: number;

  @IsNumber()
  @Min(1)
  @Max(10)
  contentOrganization: number;
}

// src/oral-performance/dto/update-feedback.dto.ts
export class UpdateFeedbackDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengths?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  weaknesses?: string[];

  @IsString()
  generalComments: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];

  @IsOptional()
  @IsString()
  cefrLevel?: string;
}
