export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/ask" && request.method === "POST") {
      const { question } = await request.json();
      if (!question) {
        return new Response(JSON.stringify({ error: "Missing question" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const messages = [
        {
          role: "system",
          content:
            "You are a helpful terminal command expert. Answer briefly and clearly. If the user asks about a specific terminal command, explain what it does and show an example. Keep answers under 100 words.",
        },
        { role: "user", content: question },
      ];

      const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages,
      });

      console.log(JSON.stringify({
        event: "ai_ask",
        question,
        timestamp: new Date().toISOString(),
      }));

      return new Response(JSON.stringify({ answer: response.response }), {
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
