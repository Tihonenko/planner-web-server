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

export class CreateEventDto {
  @IsString()
  @MinLength(2)
  @ApiProperty()
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, nullable: true })
  description?: string | null;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, nullable: true })
  location?: string | null;

  @IsDateString()
  @ApiProperty()
  startsAt: string;

  @IsDateString()
  @ApiProperty()
  endsAt: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: false })
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
