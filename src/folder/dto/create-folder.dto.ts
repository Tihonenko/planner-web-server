import { IsString, MinLength } from "class-validator";

export class CreateFolderDto {
    @IsString()
    @MinLength(3)
    title: string;
}
