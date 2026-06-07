import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class CreateQualifierSubmissionDto {
  @ApiProperty({ description: 'The percentage score', example: 77.77 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  percentage: number;

  @ApiProperty({
    description: 'Optional screenshot URL for proof',
    example: 'https://example.com/score.png',
    required: false,
  })
  @ValidateIf(
    (_, value) => value !== undefined && value !== null && value !== '',
  )
  @IsUrl()
  screenshotUrl?: string;
}

export class UpdateQualifierSubmissionStatusDto {
  @ApiProperty({
    description: 'Submission status',
    example: 'approved',
    enum: ['pending', 'approved', 'rejected'],
  })
  @IsNotEmpty()
  @IsIn(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';
}

export class QualifierProgressionPlacementDto {
  @ApiProperty({
    description: 'Target match id to route players into',
    example: 101,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  targetMatchId: number;

  @ApiProperty({ description: 'Inclusive rank start (1-based)', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  fromRank: number;

  @ApiProperty({ description: 'Inclusive rank end (1-based)', example: 10 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  toRank: number;
}

export class PreviewQualifierProgressionDto {
  @ApiProperty({
    description: 'Division id that owns qualifier ranking',
    example: 3,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  divisionId: number;

  @ApiProperty({
    description: 'Rank ranges mapped to target matches',
    type: [QualifierProgressionPlacementDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QualifierProgressionPlacementDto)
  placements: QualifierProgressionPlacementDto[];

  @ApiProperty({
    description:
      'If true, use only ruleset-recommended qualifiers (advanceTopN/advanceMinPercentage) as seed source.',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  useRecommendedAdvances?: boolean;
}

export class CommitQualifierProgressionDto extends PreviewQualifierProgressionDto {
  @ApiProperty({
    description:
      'If true, clears current player list from target matches before applying seed assignments.',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  clearTargetMatches?: boolean;
}

export class PreviewQualifierWaterfallDto {
  @ApiProperty({
    description: 'Division id that owns qualifier ranking',
    example: 8,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  divisionId: number;

  @ApiProperty({
    description:
      'If true, use only ruleset-recommended qualifiers (advanceTopN/advanceMinPercentage) as seed source.',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  useRecommendedAdvances?: boolean;

  @ApiProperty({
    description: 'Name for the generated tournament phase',
    required: false,
    default: 'Tournament',
  })
  @IsOptional()
  @IsString()
  phaseName?: string;

  @ApiProperty({
    description: 'Estimated max players per generated match',
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(64)
  @Type(() => Number)
  matchSize?: number;

  @ApiProperty({
    description:
      'Number of players who advance directly from each winner/loser match',
    required: false,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(64)
  @Type(() => Number)
  advanceCount?: number;

  @ApiProperty({
    description:
      'Stop generating waterfall rounds once this many players remain',
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(128)
  @Type(() => Number)
  finalistsCount?: number;

  @ApiProperty({
    description: 'Scoring system assigned to generated matches',
    required: false,
    default: 'EurocupScoreCalculator',
  })
  @IsOptional()
  @IsString()
  scoringSystem?: string;
}

export class CommitQualifierWaterfallDto extends PreviewQualifierWaterfallDto {
  @ApiProperty({
    description:
      'If true, remove a previously generated phase with the same name before creating a new one.',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  replaceExistingGeneratedPhase?: boolean;
}
