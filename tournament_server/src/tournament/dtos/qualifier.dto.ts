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
  IsUrl,
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
  @ValidateIf((_, value) => value !== undefined && value !== null && value !== '')
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
  @ApiProperty({ description: 'Target match id to route players into', example: 101 })
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
  @ApiProperty({ description: 'Division id that owns qualifier ranking', example: 3 })
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
