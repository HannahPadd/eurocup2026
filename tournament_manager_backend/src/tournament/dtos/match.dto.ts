import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { Player, Phase } from '@persistence/entities';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMatchDto {
  @ApiProperty({ description: 'The name of the match', example: 'Match 1' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'A subtitle for the match', example: 'Group A' })
  @IsOptional()
  @IsString()
  subtitle: string;

  @ApiProperty({ description: 'Additional notes about the match', example: 'This match will be played on Friday' })
  @IsOptional()
  @IsString()
  notes: string;

  @ApiProperty({ description: 'The list of player ids participating to the match', example: [1, 2, 3] })
  @IsNotEmpty()
  @IsArray()
  playerIds: number[];

  @ApiProperty({ description: 'The id of the phase the match belong to', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  phaseId: number;
  
  @ApiProperty({ description: 'Which scoring system shall be used', example: 'Eurocup2025' })
  @IsNotEmpty()
  @IsString()
  scoringSystem: string;

  players?: Player[];
}

export class UpdateMatchDto {
  @ApiProperty({ description: 'The name of the match', example: 'Match 1' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: 'A subtitle for the match', example: 'Group A' })
  @IsOptional()
  @IsString()
  subtitle: string;

  @ApiProperty({ description: 'Additional notes about the match', example: 'This match will be played on Friday' })
  @IsOptional()
  @IsString()
  notes: string;

  @ApiProperty({ description: 'The list of player ids participating to the match', example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  playerIds: number[];

  @ApiProperty({ description: 'The id of the phase the match belong to', example: 1 })
  @IsOptional()
  @IsNumber()
  phaseId: number;

  @ApiProperty({ description: 'Which scoring system shall be used', example: 'Eurocup2025' })
  @IsOptional()
  @IsString()
  scoringSystem: string;

  players?: Player[];
  phase?: Promise<Phase>;
}
