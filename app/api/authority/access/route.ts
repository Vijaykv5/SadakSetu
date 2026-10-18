import { isAddress } from "viem";
import { isConfiguredAuthority } from "@/lib/arkiv/authority-access";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address") ?? "";
  if (!isAddress(address)) {
    return Response.json({ authorized: false }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  return Response.json(
    { authorized: isConfiguredAuthority(address, process.env.SADAKSETU_AUTHORITY_OWNERS) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
