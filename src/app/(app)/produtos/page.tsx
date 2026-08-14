import Link from "next/link";
import { listProducts, getCategoriesByModule } from "@/lib/queries";
import { Card, PageHeader, Button, Badge, EmptyState } from "@/components/ui";
import { CategoryManager, CategoryBadge } from "@/components/CategoryManager";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const [products, categories] = await Promise.all([
    listProducts(),
    getCategoriesByModule("product"),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo & Produção"
        icon="🏷️"
        title="Produtos"
        description="Cada produto é montado pelo motor: impressão + material + acabamento + serviço."
        action={
          <div className="flex gap-2">
            <CategoryManager module="product" moduleLabel="Produtos" categories={categories} />
            <Link href="/produtos/new">
              <Button>＋ Novo Produto</Button>
            </Link>
          </div>
        }
      />

      {products.length === 0 ? (
        <Card>
          <EmptyState
            icon="🏷️"
            title="Nenhum produto"
            description="Crie seu primeiro produto usando a calculadora de custos."
            action={
              <Link href="/produtos/new">
                <Button>＋ Novo Produto</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const cost = Number(p.costSnapshot);
            const final = Number(p.finalPrice);
            const margin = final - cost;
            const lowStock =
              p.trackStock && Number(p.stock) <= Number(p.minStock || 0);
            return (
              <Link
                key={p.id}
                href={`/produtos/${p.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold text-slate-800 group-hover:text-cyan-600">
                      {p.name}
                    </h3>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {p.sku}
                    </p>
                  </div>
                  {!p.active && <Badge color="slate">Inativo</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <CategoryBadge
                    categories={categories}
                    categoryId={p.productCategoryId}
                  />
                  {p.trackStock && (
                    <Badge color={lowStock ? "red" : "green"}>
                      📦 {Number(p.stock)} em estoque
                    </Badge>
                  )}
                </div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Custo</span>
                    <span className="font-medium text-slate-700">
                      {formatMoney(cost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Margem</span>
                    <span className="font-medium text-emerald-600">
                      {formatMoney(margin)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-1.5">
                    <span className="font-semibold text-slate-700">Preço final</span>
                    <span className="text-lg font-black text-cyan-600">
                      {formatMoney(final)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
