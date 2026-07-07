# Camunda Marketplace listing content

Prepared field by field against the Marketplace listing guidelines (submission form:
marketplace.camunda.com, "Become a Contributor", Submit Connector).

## Listing info

| Field | Value |
| --- | --- |
| Company name | Camunda / Zishan Ali Khan |
| Product name | Cohere Connector |
| 5-word description | Bring Cohere models into processes |
| Brief overview / SEO description | Integrate Cohere into Camunda business processes: chat with Command models, get schema-conformant JSON answers, classify text for routing decisions, embed documents for semantic search, and rerank retrieval hits by relevance, all from a service task. |
| App listing logo | `assets/cohere-logo-512.png` (512x512) |
| App profile logo | `assets/cohere-logo-512.png` (meets 230x230 minimum) |

## Profile

| Field | Value |
| --- | --- |
| Splash title | Put Cohere chat, embeddings, and reranking to work in your processes |
| Splash description | Cohere builds enterprise-grade language models with industry-leading retrieval capabilities. This connector brings them into Camunda as an element template on the native REST connector: ask a model for an answer, force a schema-conformant JSON response, classify a text into your own labels for routing decisions, embed texts for semantic search, and rerank retrieved documents by relevance before an AI agent or a human sees them. It runs on both SaaS and Self-Managed from 8.5 with no custom runtime to host, and it ships with a verified example process. |
| Overview image | `screenshots/cohere-operations.png` (properties panel with the Operation dropdown open); alternate: `screenshots/cohere-models.png` (model lineup) |
| Documentation link | https://github.com/zishan-c8academy/camunda-connector-cohere (README) |

## Features

| Feature title | Feature description |
| --- | --- |
| Rerank retrieval hits by relevance | Pass vector-store hits and a query to Cohere Rerank and get back relevance-ordered documents, ready to feed an AI agent or a human review step. Positions are 1-based so they index FEEL lists directly. |
| Get guaranteed JSON answers | Provide a JSON Schema and the structured output operation returns a string that is guaranteed to parse as JSON conforming to it, ideal for driving gateways and downstream automation. |
| Classify text for routing | Give a list of allowed labels and get back exactly one, generated at temperature 0, so a gateway condition like cohereLabel = "approve" just works. |
| Run anywhere with zero hosting | The connector is an element template on Camunda's built-in REST connector, so it works on SaaS and Self-Managed 8.5+ with no Java, no custom runtime, and secrets kept in the cluster. |

## Community-track requirements checklist

- Distributable for SaaS and Self-Managed: yes, element template on `io.camunda:http-json:1`
- Open-source dependencies only: yes, no dependencies at all (single JSON file)
- Adequate documentation: README with install, auth, recipes, verified example
- Free to users: yes (MIT)
