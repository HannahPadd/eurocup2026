import { IsNotEmpty, IsNumber, IsString, IsOptional, } from 'class-validator';
import { Type } from 'class-transformer';
import { Bracket, Division, Score, Team }  from '@persistence/entities';
import { ApiProperty } from '@nestjs/swagger';
import { PrimaryGeneratedColumn } from 'typeorm';

export class CreatePlayerDto {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'localstorage/picture.png',
    description: 'url of the player profile picture',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  playerPictureUrl: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  playerName: string;

  @ApiProperty({
  example: '5 years',
  description: 'Time the player has been actively playing',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  playedFor: string;

  @ApiProperty({
  example: 'Netherlands',
  description: 'Country the player represents',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  country: string;

  @ApiProperty({
  example: '15',
  description: 'Highest stamina pass the player has achieved',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  highestStaminaPass: number;

  @ApiProperty({
  example: '??',
  description: 'I don\'t know',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  staminaLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The footspeed level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  footSpeedLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The crossover tech level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  crossOverTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The footswitch tech level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  footSwitchTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The sideswitch tech level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  sideSwitchTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The bracket tech level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  bracketTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The doublestep tech level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  doubleStepTechLevel: number;
  
  @ApiProperty({
  example: '12',
  description: 'The jack tech level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  jackTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The xmod tech level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  xmodTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The burst tech level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  burstTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The rhythms tech level of the player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  rhythmsTechLevel: number;

  @ApiProperty({
  example: 1,
  description: 'ID of the scores table for this player',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  scoresId: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the team the player belongs to',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  teamId: number;

  @IsOptional()
  divisions: Division[];

  @ApiProperty({
  example: 1,
  description: 'ID of the bracket table this player belongs to',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => Number)
  BracketId: number;

}

export class UpdatePlayerDto {
  @ApiProperty({
    example: 'localstorage/picture.png',
    description: 'url of the player profile picture',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  playerPictureUrl: string;

   @ApiProperty({
    example: 'example@example.com',
    description: 'New email of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  email: string;
  
  @ApiProperty({
    example: 'Password!',
    description: 'New player password',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  password: string;

  @ApiProperty({
    example: '',
    description: 'New api key for groovestats'
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  groovestatsApi: string;

  @ApiProperty({
    example: '1',
    description: 'ID for the results table',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  resultsID: string

  @ApiProperty({
    example: 'John Doe',
    description: 'Name of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  playerName: string;

  @ApiProperty({
  example: '5 years',
  description: 'Time the player has been actively playing',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  playedFor: string;

  @ApiProperty({
  example: 'Netherlands',
  description: 'Country the player represents',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  country: string;

  @ApiProperty({
  example: '15',
  description: 'Highest stamina pass the player has achieved',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  highestStaminaPass: number;

  @ApiProperty({
  example: '??',
  description: 'I don\'t know',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  staminaLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The footspeed level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  footSpeedLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The crossover tech level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  crossOverTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The footswitch tech level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  footSwitchTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The sideswitch tech level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  sideSwitchTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The bracket tech level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  bracketTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The doublestep tech level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  doubleStepTechLevel: number;
  
  @ApiProperty({
  example: '12',
  description: 'The jack tech level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  jackTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The xmod tech level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  xmodTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The burst tech level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  burstTechLevel: number;

  @ApiProperty({
  example: '12',
  description: 'The rhythms tech level of the player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  rhythmsTechLevel: number;

  @ApiProperty({
  example: 1,
  description: 'ID of the scores table for this player',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  scoresId: number;

  score?: Promise<Score>

  @ApiProperty({
    example: 1,
    description: 'ID of the team the player belongs to',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  teamId: number;

  team?: Team

  @IsOptional()
  divisionId: number[];
  
  divisions: Division[];

  @ApiProperty({
  example: 1,
  description: 'ID of the bracket table this player belongs to',
  })
  @IsOptional()
  @IsString()
  @Type(() => Number)
  BracketId: number;

  bracket?: Bracket

  @ApiProperty({
  example: true,
  description: 'Whether the player has completed registration',
  required: false,
  })
  @IsOptional()
  hasRegistered: boolean;

  @ApiProperty({
  example: false,
  description: 'Whether the player account is an admin',
  required: false,
  })
  @IsOptional()
  isAdmin: boolean;
  
}
