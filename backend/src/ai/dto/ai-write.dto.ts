import { IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';

export class AiWriteDto {
  @IsString()
  bookId: string;

  @IsString()
  @IsOptional()
  chapterId?: string;

  @IsString()
  content: string;

  @IsEnum([
    'generate',
    'continue',
    'improve',
    'expand',
    'summarize',
    'edit',
    'outline',
    'character',
    'plot',
  ])
  command: string;

  @IsOptional()
  options?: {
    title?: string;
    outline?: string;
    characterName?: string;
    targetWordCount?: number;
  };
}

export class AiEditTextDto {
  @IsString()
  bookId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  text: string;

  @IsEnum(['improve', 'polish', 'shorten', 'expand', 'fix', 'change_style'])
  action: string;

  @IsOptional()
  style?: string;
}

export class AiGenerateOutlineDto {
  @IsString()
  bookId: string;

  @IsString()
  title: string;

  @IsOptional()
  genre?: string;

  @IsOptional()
  chapterCount?: number;

  @IsOptional()
  existingOutline?: string;
}

export class AiCharacterDto {
  @IsString()
  bookId: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  role?: string;

  @IsOptional()
  description?: string;
}
