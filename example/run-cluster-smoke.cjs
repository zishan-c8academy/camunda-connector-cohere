// Deploys example/cohere-connector-smoke.bpmn and runs one instance end to end.
// Proves all three template operations (chat, classify, rerank) against a real
// Camunda 8 SaaS cluster, including secret resolution ({{secrets.COHERE_API_KEY}})
// and the rerank position-join output-mapping recipe from the README.
//
// Needs: a .env with ZEEBE_* SaaS API client credentials and @camunda8/sdk on the
// module path. Run it from any directory that has both, e.g.:
//   node path/to/camunda-connector-cohere/example/run-cluster-smoke.cjs
require('dotenv').config();
const { Camunda8 } = require('@camunda8/sdk');
const path = require('path');

(async () => {
  const c8 = new Camunda8();
  const zeebe = c8.getZeebeGrpcApiClient();

  const bpmnPath = path.join(__dirname, 'cohere-connector-smoke.bpmn');
  const deployment = await zeebe.deployResources([{ processFilename: bpmnPath }]);
  const proc = deployment.deployments[0].process;
  console.log(`deployed ${proc.bpmnProcessId} version ${proc.version} (key ${proc.processDefinitionKey})`);

  console.log('starting instance (chat -> classify -> rerank, ~3 Cohere calls)...');
  const t0 = Date.now();
  const result = await zeebe.createProcessInstanceWithResult({
    bpmnProcessId: 'CohereConnectorSmoke',
    variables: {},
    requestTimeout: 120000,
  });
  const ms = Date.now() - t0;
  const v = result.variables;

  console.log(`\ninstance ${result.processInstanceKey} completed in ${(ms / 1000).toFixed(1)}s\n`);
  console.log('CHAT      cohereReply:', JSON.stringify(v.cohereReply));
  console.log('          finishReason:', v.cohereFinishReason, '| usage:', JSON.stringify(v.cohereUsage));
  console.log('CLASSIFY  cohereLabel:', JSON.stringify(v.cohereLabel));
  console.log('RERANK    cohereRanked:', JSON.stringify(v.cohereRanked));
  console.log('          rankedDocs:', JSON.stringify(v.rankedDocs, null, 1));

  const pass =
    typeof v.cohereReply === 'string' && v.cohereReply.length > 0 &&
    v.cohereLabel === 'account_opening' &&
    Array.isArray(v.cohereRanked) && v.cohereRanked.length === 2 &&
    Array.isArray(v.rankedDocs) && typeof v.rankedDocs[0] === 'string' &&
    v.rankedDocs[0].includes('MLRO');
  console.log(pass ? '\nSMOKE PASS: all three operations verified on the cluster'
                   : '\nSMOKE FAIL: inspect the variables above');
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error('smoke error:', e.message); process.exit(1); });
