import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Division }  from '@persistence/entities';
import { ApiProperty } from '@nestjs/swagger';

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

  division?: Promise<Division>;
}
