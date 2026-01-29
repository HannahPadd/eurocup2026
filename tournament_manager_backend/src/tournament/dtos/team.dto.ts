import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({
    example: 'Leonardo',
    description: 'Name of the team',
  })
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  name: string;
}

export class UpdateTeamDto {
  @ApiProperty({
    example: 'New Team Name',
    description: 'New Name of the team',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  name: string;
}

