import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên công ty không được để trống' })
  @MinLength(2, { message: 'Tên công ty tối thiểu 2 ký tự' })
  companyName: string;

  @IsString()
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug chỉ được chứa chữ thường (a-z), số (0-9) và dấu gạch ngang (-)',
  })
  slug: string;

  @IsEmail({}, { message: 'Email người quản trị không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  ownerEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  ownerPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên người quản trị không được để trống' })
  ownerFullName: string;

  @IsString()
  @IsOptional()
  ownerPhone?: string;

  @IsString()
  @IsOptional()
  plan?: string;
}
