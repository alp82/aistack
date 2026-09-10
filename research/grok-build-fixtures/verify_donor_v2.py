"""Validate retained v2 timing projection, not absent raw stream joins."""
import datetime as dt
import json
from pathlib import Path

root = Path(__file__).parent / 'observed-windows-v2-1.0.13'
v = json.loads((root / 'evidence.json').read_text())
assert len(v['turnTiming']) == 11
for i, row in enumerate(v['turnTiming']):
    assert row['ordinal'] == i
    start = dt.datetime.fromisoformat(row['eventStart'])
    end = dt.datetime.fromisoformat(row['eventEnd'])
    delta = round((end - start).total_seconds() * 1000 - row['elapsedMs'], 3)
    assert delta == row['eventSpanMinusElapsedMs']
    assert -65 <= delta <= -50
    assert 0 <= end.timestamp() - row['terminalTimestampSeconds'] < 1
    assert 0 <= row['terminalAgentTimestampMs'] / 1000 - row['terminalTimestampSeconds'] < 1
    assert row['usagePresent'] == (i < 10)
assert len({r['prompt_id'] for r in v['turnTiming'][:10]}) == 1
for p in root.iterdir():
    assert '\u2014' not in p.read_text()
print('PASS: 11 timing rows, mixed timestamp units, recorded duration differences,')
print('10 usage-present terminals, 1 missing usage, explicit masked identity limitation.')
