"""Check retained donor evidence. Full-export observations stay provenance claims."""
import json
from pathlib import Path

root = Path(__file__).parent / 'observed-windows-1.0.13'
data = json.loads((root / 'evidence.json').read_text())
records = data['records']
assert len(records) == 11
expected_calls = [31, 31, 6, 5, 8, 5, 7, 5, 4, 6]
for ordinal, record in enumerate(records):
    assert record['ordinal'] == ordinal
    assert 1700000000 < record['terminalUpdate']['timestamp'] < 2000000000
    counts = record['eventWindowCounts']
    terminal = record['terminalUpdate']['params']['update']
    if ordinal == 10:
        assert terminal['stop_reason'] == 'error' and 'usage' not in terminal
        assert counts['loopStarted'] == 1 and counts['firstToken'] == 0
        continue
    assert terminal['stop_reason'] == 'end_turn'
    usage = terminal['usage']
    assert usage['modelCalls'] == usage['numTurns'] == expected_calls[ordinal]
    assert usage['modelCalls'] == counts['loopStarted'] == counts['firstToken']
    assert usage['inputTokens'] + usage['outputTokens'] == usage['totalTokens']
    assert usage['cachedReadTokens'] <= usage['inputTokens']
    assert usage['reasoningTokens'] <= usage['outputTokens']
    for key in ('inputTokens', 'outputTokens', 'totalTokens', 'modelCalls'):
        assert sum(v[key] for v in usage['modelUsage'].values()) == usage[key]
assert len({r['terminalUpdate']['params']['update']['prompt_id'] for r in records}) == 1
assert records[2]['terminalUpdate']['params']['update']['usage']['inputTokens'] < records[1]['terminalUpdate']['params']['update']['usage']['inputTokens']
for path in root.iterdir():
    assert '\u2014' not in path.read_text()
text = (root / 'evidence.json').read_text()
for forbidden in ('rawInput', 'rawOutput', 'costUsdTicks', 'agent_result', 'encrypted_content'):
    assert forbidden not in text
print('PASS: 10 per-prompt usage projections, 1 omitted usage block,')
print('ordinal loop counts, token/model arithmetic, export defect retained, excluded fields.')
