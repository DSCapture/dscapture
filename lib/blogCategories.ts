export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
};

export function normalizeBlogCategory(categoryData: unknown): BlogCategory | null {
  if (Array.isArray(categoryData)) {
    return normalizeBlogCategory(categoryData[0]);
  }

  if (
    categoryData &&
    typeof categoryData === "object" &&
    "id" in categoryData &&
    "name" in categoryData &&
    "slug" in categoryData
  ) {
    return categoryData as BlogCategory;
  }

  return null;
}
