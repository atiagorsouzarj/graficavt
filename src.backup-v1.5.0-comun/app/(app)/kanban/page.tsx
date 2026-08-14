import { KanbanBoard } from "@/components/modules/KanbanBoard";
import { db } from "@/db";
import { kanbanCards, products, customers } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { id: "backlog", title: "Backlog", color: "bg-slate-400" },
  { id: "producao", title: "Produção", color: "bg-blue-500" },
  { id: "revisao", title: "Revisão", color: "bg-amber-500" },
  { id: "pronto", title: "Pronto", color: "bg-cyan-500" },
  { id: "entregue", title: "Entregue", color: "bg-emerald-500" },
];

export default async function KanbanPage() {
  const [cards, productsList, customersList] = await Promise.all([
    db.select().from(kanbanCards).orderBy(asc(kanbanCards.order)),
    db.select().from(products),
    db.select().from(customers),
  ]);

  return (
    <KanbanBoard
      cards={cards}
      products={productsList}
      customers={customersList}
      columns={COLUMNS}
    />
  );
}
