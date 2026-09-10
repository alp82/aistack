"""Validate sanitized observations only. This does not qualify an adapter."""
import json
from pathlib import Path

ROOT = Path(__file__).parent
FORBIDDEN = {
    'rawInput', 'rawOutput', 'arguments', 'encrypted_content', 'costUsdTicks',
    'request_id', 'grok_home', 'agent_result', 'generated_title',
}


def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines()]


def check_fields(value):
    if isinstance(value, dict):
        assert not FORBIDDEN.intersection(value), FORBIDDEN.intersection(value)
        for child in value.values():
            check_fields(child)
    elif isinstance(value, list):
        for child in value:
            check_fields(child)


def validate(directory, expected_turns, expected_missing, expected_tools):
    events = rows(directory / 'events.jsonl')
    updates = rows(directory / 'updates.jsonl')
    for row in updates:
        assert 1700000000 < row['timestamp'] < 2000000000
        agent_ms = row['params'].get('_meta', {}).get('agentTimestampMs')
        if agent_ms is not None:
            assert 1700000000000 < agent_ms < 2000000000000
            assert abs(row['timestamp'] * 1000 - agent_ms) < 60000
    terminal = [r['params']['update'] for r in updates
                if r['params']['update']['sessionUpdate'] == 'turn_completed']
    assert len(terminal) == expected_turns
    assert sum('usage' not in t for t in terminal) == expected_missing
    assert len({t['prompt_id'] for t in terminal}) == expected_turns
    assert sum(e['type'] == 'turn_started' for e in events) == expected_turns
    assert sum(e['type'] == 'turn_ended' for e in events) == expected_turns
    for turn in terminal:
        if 'usage' not in turn:
            # Missing usage stays omitted; no synthetic zero reading.
            continue
        usage = turn['usage']
        assert usage['inputTokens'] + usage['outputTokens'] == usage['totalTokens']
        assert usage['reasoningTokens'] <= usage['outputTokens']
        assert usage['cachedReadTokens'] <= usage['inputTokens']
        for field in ('inputTokens', 'outputTokens', 'totalTokens', 'modelCalls'):
            assert sum(m[field] for m in usage['modelUsage'].values()) == usage[field]
    calls = {r['params']['update']['toolCallId'] for r in updates
             if r['params']['update']['sessionUpdate'] == 'tool_call'}
    completions = {e['tool_call_id'] for e in events if e['type'] == 'tool_completed'}
    assert len(calls) == len(completions) == expected_tools
    assert calls == completions
    for value in events + updates + [json.loads((directory / 'summary.json').read_text())]:
        check_fields(value)
    for path in directory.iterdir():
        if path.is_file():
            assert '\u2014' not in path.read_text(), path
    return terminal


original = validate(ROOT / 'observed-1.0.13', 1, 0, 30)
a = validate(ROOT / 'observed-1.0.13-followup/session-a', 3, 2, 30)
b = validate(ROOT / 'observed-1.0.13-followup/session-b', 2, 1, 0)
assert a[0]['usage'] == original[0]['usage']
assert a[0]['elapsed_ms'] == original[0]['elapsed_ms']
assert a[0]['stop_reason'] == original[0]['stop_reason'] == 'rate_limit'
assert b[0]['stop_reason'] == 'end_turn'
assert all(t['stop_reason'] == 'rate_limit' for t in a[1:] + b[1:])
assert b[0]['usage']['inputTokens'] == 16226
assert b[0]['usage']['outputTokens'] == 35
assert b[0]['usage']['modelCalls'] == 1
print('PASS: three captures, five distinct follow-up terminals, three omitted usage blocks,')
print('token/model arithmetic, 30 tool joins, retained earlier usage, excluded fields.')
