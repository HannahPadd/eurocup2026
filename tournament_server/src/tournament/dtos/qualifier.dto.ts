import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsUrl } from 'class-validator';
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

export class UpdateQualifierSubmissionStatusDto {
  @ApiProperty({
    description: 'Submission status',
    example: 'approved',
    enum: ['pending', 'approved', 'rejected'],
  })
  @IsNotEmpty()
  @IsIn(['pending', 'approved', 'rejected'])
  status: 'pending' | 'approved' | 'rejected';
}
