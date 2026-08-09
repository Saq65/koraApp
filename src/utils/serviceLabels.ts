// Cart items store `serviceName` as a stable English key ("Wash" | "Iron" |
// "Wash+Iron") — it also doubles as a lookup key against SERVICES in
// subcategory.tsx. This maps that key to its translation key so every
// screen that displays it renders in the current language instead of
// always showing English.
export const SERVICE_LABEL_KEY: Record<string, string> = {
  Wash: "subcategory.wash",
  Iron: "subcategory.iron",
  "Wash+Iron": "subcategory.wash_iron",
};

export function translateServiceName(t: (key: string) => string, serviceName: string): string {
  const key = SERVICE_LABEL_KEY[serviceName];
  return key ? t(key) : serviceName;
}

// Order API responses (orderService.ts) use a different, lowercase key set
// for the same three services — map that one too.
const API_SERVICE_LABEL_KEY: Record<string, string> = {
  wash: "subcategory.wash",
  iron: "subcategory.iron",
  both: "subcategory.wash_iron",
};

export function translateApiServiceType(t: (key: string) => string, serviceType: string | undefined): string | undefined {
  if (!serviceType) return undefined;
  const key = API_SERVICE_LABEL_KEY[serviceType];
  return key ? t(key) : serviceType;
}

// Cart items also store `categoryName` as a stable English key ("Men" |
// "Women" | "Children" | "Linen") — same reasoning as SERVICE_LABEL_KEY
// above: keep the stored value stable, translate only at display time.
const CATEGORY_LABEL_KEY: Record<string, string> = {
  Men: "category.men",
  Women: "category.women",
  Children: "category.children",
  Linen: "category.linen",
};

export function translateCategoryName(t: (key: string) => string, categoryName: string): string {
  const key = CATEGORY_LABEL_KEY[categoryName];
  return key ? t(key) : categoryName;
}
