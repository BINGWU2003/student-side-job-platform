// ─── 书籍实体（API 响应中的 Book 形状）────────────────────────────────────────
// price 由 Prisma Decimal 序列化为 string

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string | null;
  description: string | null;
  price: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── 请求体 ────────────────────────────────────────────────────────────────────

export interface CreateBookRequest {
  title: string;
  author: string;
  isbn?: string;
  description?: string;
  price?: number | null;
  publishedAt?: string | null;
}

export type UpdateBookRequest = Partial<CreateBookRequest>;

// ─── 查询参数 ──────────────────────────────────────────────────────────────────

export interface BookListQuery {
  page?: number;
  pageSize?: number;
  title?: string;
  author?: string;
}
