import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(() => {
  const body = {
    status: 'ok',
    service: '@jobetes/api-edge',
    timestamp: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
