import json
from pathlib import Path
root = Path(__file__).parent / 'observed-macos-1.0.5'
s = json.loads((root / 'evidence.json').read_text())['sessions']
for session in s.values():
    terms = session['terminals']
    assert len({t['prompt_id'] for t in terms}) == len(terms)
    assert all('elapsed_ms' not in t for t in terms)
    for t in terms:
        if 'usage' not in t:
            continue
        u = t['usage']
        assert u['inputTokens'] + u['outputTokens'] == u['totalTokens']
        for k in ('inputTokens', 'outputTokens', 'modelCalls'):
            assert sum(m[k] for m in u['modelUsage'].values()) == u[k]
assert s['forked_verbatim']['summary']['parent_session_id'] == s['original']['summary']['sessionId']
assert s['forked_verbatim']['summary']['fork_context_source'] == 'forked_verbatim'
child_id = s['model_subagent_child']['summary']['sessionId']
parent_id = s['subagent_parent']['summary']['sessionId']
assert any(e.get('parent_session_id') == parent_id and e.get('child_session_id') == child_id for e in s['subagent_parent']['subagentLifecycle'])
child = s['model_subagent_child']['terminals'][0]['usage']
wake = next(t['usage'] for t in s['subagent_parent']['terminals'] if t['prompt_id'] == 'subagent-completed-' + child_id)
assert child['modelCalls'] == 18 and wake['modelCalls'] == 2
assert wake['usageIsIncomplete'] is True
assert child['reasoningTokens'] > child['outputTokens']
for p in root.iterdir():
    assert '\u2014' not in p.read_text()
print('PASS: terminal identities, both lineage pairs, usage arithmetic,')
print('distinct child/wake usage and explicit older-format limitations.')
