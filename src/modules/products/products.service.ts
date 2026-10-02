import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from './products.repository.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import type { Product } from '../../database/schema/tenant/products.schema.js';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  /**
   * Lấy danh sách toàn bộ sản phẩm của tenant
   */
  async findAll(): Promise<Product[]> {
    return this.productsRepository.findAll();
  }

  /**
   * Lấy chi tiết một sản phẩm theo ID
   */
  async findById(id: string): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm với ID: '${id}'`);
    }
    return product;
  }

  /**
   * Tạo sản phẩm mới:
   * - Kiểm tra tính duy nhất của mã SKU trong tenant hiện tại
   * - Lưu sản phẩm thông qua Repository
   */
  async create(dto: CreateProductDto): Promise<Product> {
    // 1. Kiểm tra SKU nếu có truyền lên
    if (dto.sku) {
      const existing = await this.productsRepository.findBySku(dto.sku);
      if (existing) {
        throw new ConflictException(`Mã SKU '${dto.sku}' đã tồn tại trong danh mục sản phẩm của công ty bạn`);
      }
    }

    // 2. Lưu vào database thông qua Repository
    return this.productsRepository.create({
      name: dto.name,
      sku: dto.sku,
      description: dto.description,
      price: dto.price || '0',
      costPrice: dto.costPrice || '0',
    });
  }
}
