// api/agent.mjs  (ESM, Node 18+)
import { Agent, Runner, withTrace } from "@openai/agents";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    const { message } = req.body || {};
    if (!message) {
      res.status(400).json({ error: "Missing 'message' in body" });
      return;
    }
    if (!process.env.OPENAI_API_KEY) {
      res.status(500).json({ error: "OPENAI_API_KEY is not set" });
      return;
    }

    // Базовый оркестратор — можно дополнять (по твоему примеру)
    const mainOrchestrator = new Agent({
      name: "Main Orchestrator Agent",
      instructions: "Ты — помощник по затоплениям. Отвечай чётко, по шагам.",
      model: "gpt-5",
      modelSettings: {
        reasoning: { effort: "medium", summary: "auto" },
        store: true
      }
    });

    const runner = new Runner({
      apiKey: process.env.OPENAI_API_KEY,
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_68fc024308608190a73c4a3010d0ae9c0473908472fa1005"
      }
    });

    const result = await withTrace("Poseydon", async () => {
      const r = await runner.run(mainOrchestrator, [
        {
          role: "user",
          content: [{ type: "input_text", text: message }]
        }
      ]);
      return r;
    });

    const reply =
      result?.finalOutput ??
      result?.newItems?.map((i) => i?.rawItem?.content?.[0]?.text).join("\n") ??
      "";

    res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "Agent error" });
  }
}
