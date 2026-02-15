import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Division }  from '@persistence/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePhaseDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'The name of the phase',
    example: 'Group Stage',
  })
  name: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'The ID of the division this phase belongs to',
    example: 1,
  })
  divisionId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    description: 'Reusable ruleset used to decide phase progression',
    example: 2,
    required: false,
  })
  rulesetId?: number;
}

export class UpdatePhaseDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The name of the phase',
    example: 'Group Stage',
    required: false,
  })
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'The ID of the division this phase belongs to',
    example: 1,
    required: false,
  })
  divisionId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    description: 'Reusable ruleset used to decide phase progression',
    example: 2,
    required: false,
  })
  rulesetId?: number;

  division?: Promise<Division>;
}
