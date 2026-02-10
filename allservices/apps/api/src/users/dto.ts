import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsOptional,
  IsString
} from 'class-validator';

type LegacyRole = 'client' | 'artisan';
type NewRole = 'customer' | 'pro';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  // ✅ Nouveau format
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsIn(['customer', 'pro', 'client', 'artisan'], { each: true })
  roles?: Array<NewRole | LegacyRole>;

  // ✅ Ancien format (compat)
  @IsOptional()
  @IsIn(['client', 'artisan', 'customer', 'pro'])
  role?: LegacyRole | NewRole;
}
