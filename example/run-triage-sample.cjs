// Deploys example/customer-feedback-triage.bpmn and runs it twice: once down the
// question branch (classify -> rerank -> grounded answer) and once down the
// complaint branch (classify -> structured JSON severity extract).
//
// Needs: a .env with ZEEBE_* SaaS API client credentials and @camunda8/sdk on the
// module path:
//   node path/to/camunda-connector-cohere/example/run-triage-sample.cjs
require('dotenv').config();
const { Camunda8 } = require('@camunda8/sdk');
const path = require('path');

const CASES = [
  {
    label: 'question path',
    customerMessage:
      'How do I reset my password? I have already tried turning the computer off and on again 47 times, out of respect.',
    expectLabel: 'question',
  },
  {
    label: 'complaint path',
    customerMessage:
      'The export button has said "loading" since Tuesday. My coffee has gone cold twice waiting for it, and cold coffee is a severity of its own.',
    expectLabel: 'complaint',
  },
];

(async () => {
  const c8 = new Camunda8();
  const zeebe = c8.getZeebeGrpcApiClient();

  const bpmnPath = path.join(__dirname, 'customer-feedback-triage.bpmn');
  const deployment = await zeebe.deployResources([{ processFilename: bpmnPath }]);
  const proc = deployment.deployments[0].process;
  console.log(`deployed ${proc.bpmnProcessId} version ${proc.version}\n`);

  let pass = true;
  for (const c of CASES) {
    const t0 = Date.now();
    const result = await zeebe.createProcessInstanceWithResult({
      bpmnProcessId: 'CohereFeedbackTriage',
      variables: { customerMessage: c.customerMessage },
      requestTimeout: 120000,
    });
    const v = result.variables;
    console.log(`=== ${c.label} (${((Date.now() - t0) / 1000).toFixed(1)}s) ===`);
    console.log('  message:     ', JSON.stringify(c.customerMessage.slice(0, 70) + '...'));
    console.log('  cohereLabel: ', JSON.stringify(v.cohereLabel));
    if (v.rankedDocs) console.log('  top article: ', JSON.stringify(v.rankedDocs[0]));
    if (v.draftAnswer) console.log('  draft answer:', JSON.stringify(v.draftAnswer));
    if (v.complaintJson) console.log('  complaint:   ', v.complaintJson);
    console.log('');
    const branchOk =
      c.expectLabel === 'question'
        ? v.cohereLabel === 'question' && typeof v.draftAnswer === 'string' && Array.isArray(v.rankedDocs)
        : v.cohereLabel === 'complaint' && typeof v.complaintJson === 'string' && JSON.parse(v.complaintJson).severity !== undefined;
    if (!branchOk) pass = false;
  }
  console.log(pass ? 'TRIAGE SAMPLE PASS: both branches verified on the cluster'
                   : 'TRIAGE SAMPLE FAIL: inspect the variables above');
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error('sample error:', e.message); process.exit(1); });
