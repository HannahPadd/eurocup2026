import { IsNotEmpty, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Tournament } from '@persistence/entities';

export class CreateDivisionDto {
  @ApiProperty({ description: 'The name of the division', example: 'Division A' })
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  name: string;

  @ApiProperty({ description: 'The ID of the tournament', example: 1, required: true })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  tournamentId: number;
}

export class UpdateDivisionDto {
  @ApiProperty({ description: 'The name of the division', example: 'Division B', required: false })
  @IsOptional()
  @IsString()
  @Type(() => String)
  name: string;

  @ApiProperty({ description: 'The ID of the tournament', example: 1, required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  tournamentId: number;

  tournament?: Tournament;
}
