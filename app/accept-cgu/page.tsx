import { requireAuth } from "@/server/context/server-context";
import { AcceptCguClient } from "./accept-cgu-client";

export default async function AcceptCguPage() {
  await requireAuth();
  return <AcceptCguClient />;
}
