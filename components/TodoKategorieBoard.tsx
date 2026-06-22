import TodoCard from "@/components/TodoCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  TODO_KATEGORIEN,
  kategorieLabel,
  type Todo,
  type TodoWithNachricht,
} from "@/lib/types";

type TodoKategorieBoardProps = {
  todos: (Todo | TodoWithNachricht)[];
  showDescription: boolean;
  showStatusToggle: boolean;
  showPartnerNachricht: boolean;
  showEmailLink?: boolean;
};

export default function TodoKategorieBoard({
  todos,
  showDescription,
  showStatusToggle,
  showPartnerNachricht,
  showEmailLink = false,
}: TodoKategorieBoardProps) {
  const byKategorie = TODO_KATEGORIEN.map((kategorie) => ({
    kategorie,
    items: todos.filter((t) => t.kategorie === kategorie),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {byKategorie.map(({ kategorie, items }) => (
        <Card key={kategorie}>
          <CardHeader>
            <h3 className="font-medium text-text-primary">
              {kategorieLabel(kategorie)}
            </h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {items.length === 0 ? (
              <p className="text-xs text-text-hint">Keine Todos</p>
            ) : (
              items.map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  showDescription={showDescription}
                  showStatusToggle={showStatusToggle}
                  showPartnerNachricht={showPartnerNachricht}
                  showEmailLink={showEmailLink}
                />
              ))
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
