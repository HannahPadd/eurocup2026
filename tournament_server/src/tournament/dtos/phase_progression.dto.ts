import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CommitPhaseProgressionDto {
  @ApiProperty({
    required: false,
    default: true,
    description:
      'If true, players are auto-added to all matches in each target phase returned by rules',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  autoAssignPlayersToTargetMatches?: boolean;

  @ApiProperty({
    required: false,
    default: 0,
    description: 'Ruleset step index to execute when ruleset config uses steps[]',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stepIndex?: number;
}
