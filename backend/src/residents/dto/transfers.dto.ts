import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOwnerDto } from './owners.dto';

export class CreateTransferDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  propertyNodeId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  previousOwnerId?: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CreateOwnerDto)
  newOwner: CreateOwnerDto;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class TransferQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  propertyNodeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 10;
}
