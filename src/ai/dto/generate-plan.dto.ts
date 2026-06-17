import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GeneratePlanDto {
    @ApiProperty({
        example: 'Tomorrow at 10am I have a meeting with John for 1 hour.',
        description: 'The natural language plan to parse into tasks',
    })
    @IsString()
    @IsNotEmpty()
    planText: string;
}
