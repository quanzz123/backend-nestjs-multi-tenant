import { IsNotEmpty, IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumberString({}, { message: 'Giá sản phẩm phải là chuỗi số hợp lệ' })
  @IsOptional()
  price?: string;

  @IsNumberString({}, { message: 'Giá vốn phải là chuỗi số hợp lệ' })
  @IsOptional()
  costPrice?: string;
}
