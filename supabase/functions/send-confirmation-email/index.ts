declare const Deno: {
  serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
};

const responseBody = JSON.stringify({
  error: "gone",
  message: "This legacy registration endpoint has been retired.",
});

Deno.serve(() => {
  return new Response(responseBody, {
    status: 410,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
});
