import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @ApiProperty({ required: false })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, nullable: true })
  location?: string | null;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false })
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false })
  allDay?: boolean;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, nullable: true })
  folderId?: string | null;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  @ApiProperty({ required: false, type: [String] })
  participantEmails?: string[];
}
