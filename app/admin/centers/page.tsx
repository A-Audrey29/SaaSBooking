import { getCentres } from "./centres.actions";
import { CentersClient } from "./centers-client";

export default async function CentersPage() {
  const centres = await getCentres();

  return <CentersClient centres={centres} />;
}
