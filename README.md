# Cohere Connector for Camunda 8

Bring [Cohere](https://cohere.com) models into your BPMN processes: chat, structured JSON output,
text classification, embeddings, and reranking, straight from a service task.

The connector is an [element template](https://docs.camunda.io/docs/components/modeler/desktop-modeler/element-templates/about-templates/)
built on Camunda's native REST connector (`io.camunda:http-json:1`). That means:

- **No custom runtime, no Java.** The built-in connector runtime executes it.
- **Works on Camunda SaaS and Self-Managed**, version 8.5 and later.
- Verified end to end against a live Camunda 8.9 SaaS cluster (see [example](#try-the-example)).

## Operations

| Operation | Endpoint | Result variables |
| --- | --- | --- |
| Chat: ask Cohere | `POST /v2/chat` | `cohereReply` (string), `cohereFinishReason`, `cohereUsage` (billed tokens) |
| Chat: structured JSON output | `POST /v2/chat` + `response_format` | `cohereJson` (string, guaranteed valid JSON, schema-conformant if you provide a schema), `cohereUsage` |
| Classify: label a text | `POST /v2/chat` (temperature 0) | `cohereLabel` (exactly one of your allowed labels) |
| Embeddings: embed texts | `POST /v2/embed` | `cohereEmbeddings` (one float vector per text), `cohereEmbedBilledTokens` |
| Rerank: rank documents by relevance | `POST /v2/rerank` | `cohereRanked` (list of `{position, score}`, 1-based positions) |
| Utility: list available models | `GET /v1/models` | `cohereModels` (list of `{name, endpoints}`) |

Every operation has a model dropdown with the current Cohere lineup (Command A+, Command A,
Command R family, Aya, Embed v4, Rerank v4) plus a **Custom model** option for fine-tuned or
newly released models.

> Why is Classify chat-based? Cohere retired the dedicated `/v1/classify` endpoint in
> September 2025. This connector classifies through chat at temperature 0 with a strict
> label-only instruction, so you get one clean label to route on.

## Install

1. Download [`src/cohere-connector.json`](src/cohere-connector.json).
2. **Web Modeler:** in your project, choose the folder or process application, then
   *Upload files* / *Publish* the template as described in
   [managing element templates](https://docs.camunda.io/docs/components/modeler/web-modeler/element-templates/manage-element-templates/).
   **Desktop Modeler:** copy the file into `resources/element-templates` next to your
   diagrams (or the global folder), see
   [configuring templates](https://docs.camunda.io/docs/components/modeler/desktop-modeler/element-templates/configuring-templates/).
3. Create a service task and apply the **Cohere** template from the catalog.

## Authenticate

Create a [Camunda secret](https://docs.camunda.io/docs/components/console/manage-clusters/manage-secrets/)
named `COHERE_API_KEY` with a key from
[dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys). The template
references `{{secrets.COHERE_API_KEY}}` by default; never paste a raw key into a model.

Note: new SaaS secrets can take a few minutes to become visible to the connector runtime.

## Recipes

### Route on a classification

Classify with labels `=["approve", "review", "reject"]`, then use the label directly in
gateway conditions: `=cohereLabel = "approve"`.

### Rerank retrieval hits before an AI agent sees them

Rerank is Cohere's standout capability and a natural fit after a vector-store retrieve:
pass the hit texts as `Documents` (e.g. `=searchHits`), your question as `Query`, and join
the ranked positions back to the documents in an output mapping:

```
=for r in cohereRanked return rerankDocuments[r.position]
```

`position` is 1-based, so it indexes FEEL lists directly.

### Guaranteed-JSON answers

Use *Chat: structured JSON output* with a JSON Schema, e.g.

```
={"type": "object", "properties": {"riskLevel": {"type": "string"}}, "required": ["riskLevel"]}
```

`cohereJson` is then a string guaranteed to parse as JSON conforming to your schema. Parse
it downstream in a job worker, script task, or AI agent step. If you skip the schema,
mention the word JSON in your prompt (Cohere requires it for free-form JSON mode).

### Handle rate limits as BPMN errors

Error expressions run after every invocation, including successful ones, so keep them
conditional:

```
=if error != null and error.code = "429" then bpmnError("COHERE_RATE_LIMIT", "Cohere rate limit hit") else null
```

Trial keys are limited to about 20 requests/minute and 1,000 calls/month; the template's
default retry backoff of `PT10S` respects that.

## Try the example

[`example/cohere-connector-smoke.bpmn`](example/cohere-connector-smoke.bpmn) chains chat,
classify, and rerank in one process. Deploy it, create a `COHERE_API_KEY` secret, and run an
instance; it completes in a few seconds. `example/run-cluster-smoke.cjs` automates
deploy-run-verify against a SaaS cluster (needs `@camunda8/sdk` and Zeebe API client
credentials in a `.env`).

## Good to know

- The `body` each operation sends is visible and editable under *Endpoint (technical)* in
  the properties panel; the result mapping is under *Output mapping*. Adjust freely, they
  are plain FEEL.
- Numeric fields (temperature, max tokens, top N) are plain text converted with
  `number(...)` in the body expression; keep them as plain text values.
- Model dropdowns reflect the Cohere lineup as of July 2026. New model out? Pick
  **Custom model** and paste its id, or run the *list available models* operation.

## License

[MIT](LICENSE). Cohere is a trademark of Cohere Inc.; this is a community connector, not an
official Cohere product.
