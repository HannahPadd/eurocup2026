import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class AuthSignInDto {
    @ApiProperty({

    })
    @IsNotEmpty()
    @IsString()
    username: string;

    @ApiProperty({

    })
    @IsNotEmpty()
    @IsString()
    password: string;
}

export class AuthRefreshTokenDto {
    @ApiProperty({

    })
    @IsNotEmpty()
    @IsString()
    username: string;
    
    @ApiProperty({

    })
    @IsNotEmpty()
    @IsString()
    accessToken: string;
}

export class AuthChangePasswordDto {
    @ApiProperty({})
    @IsNotEmpty()
    @IsString()
    currentPassword: string;

    @ApiProperty({})
    @IsNotEmpty()
    @IsString()
    newPassword: string;
}
