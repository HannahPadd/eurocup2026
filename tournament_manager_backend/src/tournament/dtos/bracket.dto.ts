import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Match, Player, Round } from '@persistence/entities';
import { UsingJoinTableIsNotAllowedError } from 'typeorm';

export class CreateBracketDto {
    @ApiProperty({ description: 'Name of the bracket', example: 'Lower bracker'})
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    name: string;

    @ApiProperty({ description: 'used for rulesets', example: '1 (would be double elimination'})
    @IsNotEmpty()
    @IsString()
    @Type(() => Number)
    bracketTypeID: number;

    @ApiProperty({ description: 'Array of rounds in the bracket' })
    @IsNotEmpty()
    @IsArray()
    @Type(() => Round)
    round: Round[]

    @ApiProperty({ description: 'Array of players in the bracket' })
    @IsNotEmpty()
    @IsArray()
    @Type(() => Player)
    player: Player[]

    @ApiProperty({ description: 'Array of matches in the bracker'} )
    @IsNotEmpty()
    @IsArray()
    @Type(() => Match)
    match: Match[]
  }

export class UpdateBracketDto {
    @ApiProperty({ description: 'Name of the bracket', example: 'Lower bracker'})
    @IsNotEmpty()
    @IsString()
    @Type(() => String)
    name: string;

    @ApiProperty({ description: 'used for rulesets', example: '1 (would be double elimination'})
    @IsNotEmpty()
    @IsString()
    @Type(() => Number)
    bracketTypeID: number;

    @ApiProperty({ description: 'Array of rounds in the bracket' })
    @IsNotEmpty()
    @IsArray()
    @Type(() => Round)
    round: Round[]

    @ApiProperty({ description: 'Array of players in the bracket' })
    @IsNotEmpty()
    @IsArray()
    @Type(() => Player)
    player: Player[]

    @ApiProperty({ description: 'Array of matches in the bracker'} )
    @IsNotEmpty()
    @IsArray()
    @Type(() => Match)
    match: Match[]
}