import { db } from "@/lib/crud";
import { sales, products, productMaterials, materials, stockMovements } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface SaleItem {
  productId?: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }
  try {
    const seq = Date.now().toString().slice(-6);
    const number = `PDV-${new Date().getFullYear()}-${seq}`;
    const items: SaleItem[] = Array.isArray(body.items) ? body.items : [];

    const [row] = await db
      .insert(sales)
      .values({
        number,
        customerId: body.customerId ?? null,
        type: body.type ?? "mixto",
        items,
        subtotal: String(body.subtotal ?? 0),
        discount: String(body.discount ?? 0),
        taxes: String(body.taxes ?? 0),
        cardFee: String(body.cardFee ?? 0),
        total: String(body.total ?? 0),
        paymentMethod: body.paymentMethod ?? null,
        status: "concluida",
      })
      .returning();

    // ---- Baixa automática de estoque -------------------------------
    for (const item of items) {
      if (!item.productId) continue;
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));
      if (!product) continue;
      const soldQty = Number(item.quantity || 0);
      if (soldQty <= 0) continue;

      // 1) baixa o estoque do próprio produto acabado (se rastreado)
      if (product.trackStock) {
        await db
          .update(products)
          .set({ stock: sql`${products.stock} - ${soldQty}` })
          .where(eq(products.id, product.id));
        await db.insert(stockMovements).values({
          kind: "saida",
          targetType: "product",
          productId: product.id,
          quantity: String(soldQty),
          reason: "venda",
          reference: number,
          automatic: true,
        });
      }

      // 2) baixa o material base do produto (proporcional à quantidade vendida)
      if (product.baseMaterialId) {
        const usedQty = Number(product.baseMaterialQty || 0) * soldQty;
        if (usedQty > 0) {
          await db
            .update(materials)
            .set({ stock: sql`${materials.stock} - ${usedQty}` })
            .where(eq(materials.id, product.baseMaterialId));
          await db.insert(stockMovements).values({
            kind: "saida",
            targetType: "material",
            materialId: product.baseMaterialId,
            quantity: String(usedQty),
            reason: "venda",
            reference: number,
            automatic: true,
          });
        }
      }

      // 3) baixa materiais extras vinculados ao produto
      const extras = await db
        .select()
        .from(productMaterials)
        .where(eq(productMaterials.productId, product.id));
      for (const ex of extras) {
        const usedQty = Number(ex.quantity || 0) * soldQty;
        if (usedQty <= 0) continue;
        await db
          .update(materials)
          .set({ stock: sql`${materials.stock} - ${usedQty}` })
          .where(eq(materials.id, ex.materialId));
        await db.insert(stockMovements).values({
          kind: "saida",
          targetType: "material",
          materialId: ex.materialId,
          quantity: String(usedQty),
          reason: "venda",
          reference: number,
          automatic: true,
        });
      }
    }

    return Response.json({ ok: true, row });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "erro" },
      { status: 500 }
    );
  }
}
