import Link from "next/link";
import { z } from "zod";
import { requireRole } from "@/server/context/server-context";
import {
  ADMIN_LIST_LIMIT,
  listAuditEntityTypes,
  listAuditLog,
  listEmailLog,
} from "@/server/queries/admin-supervision";
import { EMAIL_LOG_STATUSES } from "@/server/db/schema/email-log";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AUDIT_ACTION_LABEL,
  EMAIL_STATUS_CLASS,
  EMAIL_STATUS_LABEL,
  EMAIL_TYPE_LABEL,
  ENTITY_TYPE_LABEL,
  SELECT_CLASS,
  formatDateTime,
} from "../_components/format";

// Invalid / unknown query params are ignored (treated as "no filter") instead of erroring.
const ParamsSchema = z.object({
  tab: z.enum(["activite", "emails"]).catch("activite"),
  entity: z
    .string()
    .regex(/^[a-z_]{1,50}$/)
    .optional()
    .catch(undefined),
  status: z.enum(EMAIL_LOG_STATUSES).optional().catch(undefined),
});

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function JournalPage({ searchParams }: Props) {
  await requireRole("super_admin");
  const params = ParamsSchema.parse(await searchParams);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1300px] mx-auto">
      <h1 className="text-h-2xl font-semibold tracking-tight mb-1">Journal</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Les {ADMIN_LIST_LIMIT} derniers événements. Les dernières connexions sont dans{" "}
        <Link href="/admin/users" className="underline">
          Utilisateurs
        </Link>
        .
      </p>

      <div className="flex gap-1 border-b mb-4">
        <TabLink href="/admin/journal?tab=activite" active={params.tab === "activite"}>
          Activité
        </TabLink>
        <TabLink href="/admin/journal?tab=emails" active={params.tab === "emails"}>
          Emails envoyés
        </TabLink>
      </div>

      {params.tab === "emails" ? (
        <EmailsTab status={params.status} />
      ) : (
        <ActivityTab entity={params.entity} />
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 text-sm -mb-px border-b-2 ${
        active ? "border-primary font-semibold" : "border-transparent text-muted-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

async function ActivityTab({ entity }: { entity?: string }) {
  const [rows, entityTypes] = await Promise.all([listAuditLog(entity), listAuditEntityTypes()]);

  return (
    <>
      <form method="get" className="flex gap-2 mb-4 items-center">
        <input type="hidden" name="tab" value="activite" />
        <select name="entity" defaultValue={entity ?? ""} className={SELECT_CLASS}>
          <option value="">Tous les objets</option>
          {entityTypes.map((t) => (
            <option key={t} value={t}>
              {ENTITY_TYPE_LABEL[t] ?? t}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm">
          Filtrer
        </Button>
      </form>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Qui</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead>Détail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucune activité
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell>
                    {r.actorName ?? r.actorEmail ?? "Inconnu"}
                    {r.actorName && (
                      <div className="text-xs text-muted-foreground">{r.actorEmail}</div>
                    )}
                  </TableCell>
                  <TableCell>{AUDIT_ACTION_LABEL[r.action] ?? r.action}</TableCell>
                  <TableCell>{ENTITY_TYPE_LABEL[r.entityType] ?? r.entityType}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[480px] break-words">
                    {r.changes || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

async function EmailsTab({ status }: { status?: (typeof EMAIL_LOG_STATUSES)[number] }) {
  const rows = await listEmailLog(status);

  return (
    <>
      <form method="get" className="flex gap-2 mb-4 items-center">
        <input type="hidden" name="tab" value="emails" />
        <select name="status" defaultValue={status ?? ""} className={SELECT_CLASS}>
          <option value="">Tous les statuts</option>
          {EMAIL_LOG_STATUSES.map((s) => (
            <option key={s} value={s}>
              {EMAIL_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm">
          Filtrer
        </Button>
      </form>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun email enregistré
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell>{EMAIL_TYPE_LABEL[r.type] ?? r.type}</TableCell>
                  <TableCell>{r.recipient}</TableCell>
                  <TableCell className="max-w-[360px] break-words">{r.subject}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${EMAIL_STATUS_CLASS[r.status] ?? ""}`}
                    >
                      {EMAIL_STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    {r.error && <div className="text-xs text-red-700 mt-1">{r.error}</div>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
