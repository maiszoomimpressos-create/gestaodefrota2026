// Edge Function: lookup-plate
//
// Proxy servidor-a-servidor entre o FleetControl (frontend estático, sem
// backend próprio) e a API de parceiros do AUTOSAVE. Existe só por causa de
// segurança: o FleetControl não tem servidor, então se o frontend chamasse
// o AUTOSAVE direto, a x-api-key ficaria visível pra qualquer um no DevTools
// do navegador. A key fica guardada em `public.integration_settings`
// (linha "AUTOSAVE"), gerenciada pela tela Admin → APIs — nunca chega ao
// cliente, só esta function lê e usa pra falar com o AUTOSAVE.
//
// Contrato:
//   POST { plate: string } com header Authorization: Bearer <supabase access token>
//   → { found: boolean, vehicle: { plate, brand, model, year, color, type, fuel_type, chassis } | null }
//
// `verify_jwt` fica no padrão (true) — só usuário autenticado no FleetControl
// pode chamar esta function. Sem isso, seria um proxy aberto: qualquer um na
// internet poderia bater aqui sem limite e estourar a cota diária paga da
// APIBrasil, que é compartilhada entre todos os parceiros do AUTOSAVE.
//
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetadas automaticamente
// pelo runtime das Edge Functions (não precisam ser configuradas como
// secret) — o service role é necessário aqui pra ler `integration_settings`
// ignorando a RLS (que só libera leitura pra MASTER_ADMIN via sessão de
// usuário, e essa function não tem uma). Fetch direto na PostgREST do
// próprio projeto em vez de importar supabase-js — um import externo
// (jsr:/esm.sh) deixou o boot da function instável, então zero dependência
// resolve o mesmo problema sem precisar disso.
const AUTOSAVE_BASE_URL = "https://autosave-nine.vercel.app";

async function getAutosaveApiKey(): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/integration_settings?name=eq.AUTOSAVE&select=api_key`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  if (!res.ok) {
    console.error(`[lookup-plate] falha ao ler integration_settings (HTTP ${res.status}):`, await res.text().catch(() => ""));
    return null;
  }

  const rows = (await res.json()) as Array<{ api_key: string | null }>;
  return rows[0]?.api_key ?? null;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizePlate(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  const apiKey = await getAutosaveApiKey();
  if (!apiKey) {
    console.error("[lookup-plate] chave AUTOSAVE não configurada em integration_settings.");
    return json({ error: "Integração não configurada." }, 500);
  }

  const body = await req.json().catch(() => null);
  const plateRaw = typeof body?.plate === "string" ? body.plate : "";
  const plate = normalizePlate(plateRaw);

  if (plate.length !== 7) {
    return json({ error: "Placa inválida — precisa ter 7 caracteres." }, 400);
  }

  let res: Response;
  try {
    res = await fetch(`${AUTOSAVE_BASE_URL}/api/v1/vehicles?plate=${encodeURIComponent(plate)}`, {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    console.error("[lookup-plate] falha ao chamar o AUTOSAVE:", err);
    return json({ error: "Falha ao consultar o AUTOSAVE." }, 502);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[lookup-plate] AUTOSAVE respondeu HTTP ${res.status}:`, detail);
    return json({ error: "Falha ao consultar o AUTOSAVE." }, 502);
  }

  const payload = await res.json();
  const first = Array.isArray(payload?.vehicles) ? payload.vehicles[0] : null;

  if (!payload?.found || !first) {
    return json({ found: false, vehicle: null });
  }

  return json({
    found: true,
    vehicle: {
      plate: first.plate ?? plate,
      brand: first.brand ?? null,
      model: first.model ?? null,
      year: first.year ?? null,
      color: first.color ?? null,
      type: first.type ?? null,
      fuel_type: first.fuel_type ?? null,
      // FleetControl chama a coluna de "chassis" (sem sufixo _number).
      chassis: first.chassis_number ?? null,
    },
  });
});
