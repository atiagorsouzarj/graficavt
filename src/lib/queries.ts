import "server-only";
import { db } from "@/db";
import {
  customers,
  printerCategories,
  printerConsumables,
  printers,
  materials,
  finishingItems,
  services,
  products,
  quotes,
  sales,
  transactions,
  kanbanCards,
  productFinishings,
  productMaterials,
  quoteItems,
  pricingTables,
  printFormats,
  itemCategories,
  stockMovements,
} from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export async function getCategoriesByModule(
  module: "product" | "material" | "service" | "finishing" | "pricing_table"
) {
  return db
    .select()
    .from(itemCategories)
    .where(eq(itemCategories.module, module))
    .orderBy(asc(itemCategories.order), asc(itemCategories.id));
}

export async function getAllCategories() {
  return db.select().from(itemCategories).orderBy(asc(itemCategories.id));
}

export async function getStockMovements(limit = 200) {
  return db
    .select()
    .from(stockMovements)
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
}

export async function getDashboardStats() {
  const [c, p, pr, m, f, s, q] = await Promise.all([
    db.select().from(customers),
    db.select().from(products),
    db.select().from(printers),
    db.select().from(materials),
    db.select().from(finishingItems),
    db.select().from(services),
    db.select().from(quotes),
  ]);
  const salesRows = await db.select().from(sales);
  const tx = await db.select().from(transactions);

  const revenue = salesRows.reduce(
    (sum, r) => sum + (Number(r.total) || 0),
    0
  );
  const pending = tx
    .filter((t) => t.status === "pendente" || t.status === "atrasado")
    .reduce((sum, t) => sum + (t.type === "receita" ? Number(t.amount) : 0), 0);
  const expenses = tx
    .filter((t) => t.type === "despesa")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    customers: c.length,
    products: p.length,
    printers: pr.length,
    materials: m.length,
    finishings: f.length,
    services: s.length,
    quotes: q.length,
    revenue,
    pending,
    expenses,
    recentQuotes: q.slice(-5).reverse(),
    lowStock: m.filter((x) => Number(x.stock) <= Number(x.minStock || 0)),
  };
}

export async function getCatalog() {
  const [
    categories,
    consumables,
    printersList,
    materialsList,
    finishingsList,
    servicesList,
    pricingTableRows,
    formatRows,
  ] = await Promise.all([
    db.select().from(printerCategories).orderBy(asc(printerCategories.id)),
    db.select().from(printerConsumables),
    db.select().from(printers).orderBy(asc(printers.id)),
    db.select().from(materials).orderBy(asc(materials.id)),
    db.select().from(finishingItems).orderBy(asc(finishingItems.id)),
    db.select().from(services).orderBy(asc(services.id)),
    db.select().from(pricingTables),
    db.select().from(printFormats).orderBy(asc(printFormats.id)),
  ]);
  return {
    categories,
    consumables,
    printers: printersList,
    materials: materialsList,
    finishings: finishingsList,
    services: servicesList,
    pricingTables: pricingTableRows,
    formats: formatRows,
  };
}

export async function getProductWithComponents(id: number) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));
  if (!product) return null;
  const [fins, mats] = await Promise.all([
    db
      .select()
      .from(productFinishings)
      .where(eq(productFinishings.productId, id)),
    db
      .select()
      .from(productMaterials)
      .where(eq(productMaterials.productId, id)),
  ]);
  return { product, finishings: fins, materials: mats };
}

export async function listProducts() {
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getQuoteWithItems(id: number) {
  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
  if (!quote) return null;
  const items = await db
    .select()
    .from(quoteItems)
    .where(eq(quoteItems.quoteId, id));
  return { quote, items };
}
