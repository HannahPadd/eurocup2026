import {
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTournamentDto {
    /**
     * The name of the tournament.
     * @example "UEFA Euro 2024"
     */
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ example: 'UEFA Euro 2024', description: 'The name of the tournament.' })
    name: string;
}

export class UpdateTournamentDto {
    /**
     * The name of the tournament.
     * @example "UEFA Euro 2024"
     */
    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'UEFA Euro 2024', description: 'The name of the tournament.', required: false })
    name: string;
}
