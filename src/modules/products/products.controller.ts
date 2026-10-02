import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { CurrentTenant } from '../../common/decorators/tenant.decorator.js';
import type { TenantContextData } from '../../core/tenancy/tenancy.context.js';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Lấy danh sách sản phẩm của tenant hiện tại
   */
  @Get()
  async findAll(@CurrentTenant() tenant: TenantContextData) {
    const items = await this.productsService.findAll();
    return {
      tenant: {
        name: tenant.name,
        slug: tenant.slug,
        schema: tenant.schemaName,
      },
      count: items.length,
      data: items,
    };
  }

  /**
   * Tạo sản phẩm mới trong tenant hiện tại
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
