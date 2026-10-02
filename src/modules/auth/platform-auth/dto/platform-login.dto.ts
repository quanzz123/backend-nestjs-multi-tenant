import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PlatformLoginDto {
  @IsEmail({}, { message: 'Email quản trị viên không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;
}
