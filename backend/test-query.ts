import { plainToInstance } from 'class-transformer';
import { IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class NotificationQueryDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;
}

const obj = plainToInstance(NotificationQueryDto, { take: 50 });
console.log(obj);
