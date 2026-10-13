import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class AssignPropertiesDto {
  @ApiProperty({ description: 'Array of property node IDs' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  propertyIds: string[];
}
