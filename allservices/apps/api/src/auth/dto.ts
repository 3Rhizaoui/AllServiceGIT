import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export type AppRole = 'customer' | 'pro';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  /**
   * ✅ Champ officiel côté API : birth_date
   * Format conseillé : YYYY-MM-DD
   */
  @IsOptional()
  @IsString()
  birth_date?: string | null;

  /**
   * ✅ Compat avec ancien front : date_of_birth
   * (on ne l’utilise que si birth_date absent)
   */
  @IsOptional()
  @IsString()
  date_of_birth?: string | null;

  @IsOptional()
  @IsArray()
  @IsIn(['customer', 'pro'], { each: true })
  roles?: AppRole[];
}

export class UpgradeRolesDto {
  @IsIn(['customer', 'pro'])
  add!: AppRole;
}

export class RefreshDto {
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
