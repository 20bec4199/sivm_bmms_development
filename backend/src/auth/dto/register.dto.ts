import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ example: 'john.doe@building.com', description: 'Email address (will be normalised to lowercase)' })
  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsNotEmpty()
  @MaxLength(255)
  @Transform(({ value }) => (value as string).toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'MySecureP@ss1',
    description: 'Min 12 chars, must include uppercase, lowercase, and a digit',
    minLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
  })
  password: string;

  @ApiPropertyOptional({ example: 'Acme Corp', description: 'Organization Name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  orgName?: string;

  @ApiPropertyOptional({ example: 'Real Estate', description: 'Organization Industry' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  orgIndustry?: string;

  @ApiPropertyOptional({ example: '1-10', description: 'Organization Size' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  orgSize?: string;

  @ApiPropertyOptional({ example: 'uuid', description: 'Existing Organization ID' })
  @IsString()
  @IsOptional()
  orgId?: string;
}
