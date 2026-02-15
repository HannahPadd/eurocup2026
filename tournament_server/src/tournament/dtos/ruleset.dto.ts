import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRulesetDto {
  @ApiProperty({ example: 'Double elimination phase flow' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Rules for promotion and elimination', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: {
      tiePolicy: 'MANUAL_EXTRA_SONG',
      rules: [
        { type: 'SEND_RANK_RANGE_TO_PHASE', fromRank: 5, toRank: 10, targetPhaseId: 22, lane: 'LOSERS' },
        { type: 'ELIMINATE_BOTTOM_N', count: 4 },
      ],
    },
  })
  @IsNotEmpty()
  @IsObject()
  config: Record<string, unknown>;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class UpdateRulesetDto {
  @ApiProperty({ example: 'Updated ruleset name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Ruleset description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    example: {
      tiePolicy: 'MANUAL_EXTRA_SONG',
      rules: [{ type: 'ADVANCE_TOP_N', count: 8, targetPhaseId: 17 }],
    },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
