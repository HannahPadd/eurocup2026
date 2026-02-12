import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQualifierSubmissionDto {
  @ApiProperty({ description: 'The percentage score', example: 77.77 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  percentage: number;

  @ApiProperty({ description: 'Screenshot URL for proof', example: 'https://example.com/score.png' })
  @IsNotEmpty()
  @IsUrl()
  screenshotUrl: string;
}
