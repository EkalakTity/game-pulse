import { type Category } from "@gamepulse/database";
import { AppError, NotFoundError, ConflictError, ok, err, type Result } from "@gamepulse/types";
import { type CategoryRepository } from "../repositories/CategoryRepository";

type CreateCategoryInput = {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  keywords?: string[];
};

type UpdateCategoryInput = Partial<CreateCategoryInput>;

export class CategoryService {
  constructor(private readonly categoryRepo: CategoryRepository) {}

  async listCategories(): Promise<Category[]> {
    return this.categoryRepo.findAll();
  }

  async getCategory(id: string): Promise<Result<Category, AppError>> {
    const cat = await this.categoryRepo.findById(id);
    if (!cat) return err(new NotFoundError("Category"));
    return ok(cat);
  }

  async createCategory(input: CreateCategoryInput): Promise<Result<Category, AppError>> {
    const slugConflict = await this.categoryRepo.findBySlug(input.slug);
    if (slugConflict) {
      return err(new ConflictError(`Category with slug "${input.slug}" already exists`));
    }

    const cat = await this.categoryRepo.create({
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim(),
      color: input.color ?? "#6d28d9",
      keywords: input.keywords ?? [],
    });

    return ok(cat);
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Result<Category, AppError>> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) return err(new NotFoundError("Category"));

    if (input.slug && input.slug !== existing.slug) {
      const conflict = await this.categoryRepo.findBySlug(input.slug);
      if (conflict) return err(new ConflictError(`Slug "${input.slug}" is already in use`));
    }

    const updated = await this.categoryRepo.update(id, {
      ...(input.name && { name: input.name.trim() }),
      ...(input.slug && { slug: input.slug.trim() }),
      ...(input.description !== undefined && { description: input.description?.trim() }),
      ...(input.color && { color: input.color }),
      ...(input.keywords !== undefined && { keywords: input.keywords }),
    });

    return ok(updated);
  }

  async deleteCategory(id: string): Promise<Result<void, AppError>> {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) return err(new NotFoundError("Category"));

    await this.categoryRepo.delete(id);
    return ok(undefined);
  }
}
