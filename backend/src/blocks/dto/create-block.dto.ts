import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, Min, IsUUID } from 'class-validator';

export class CreateBlockDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  buildingId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}
