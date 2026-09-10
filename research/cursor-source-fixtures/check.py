"""Validate synthetic source relationships, without reading native Cursor data."""
import json
import sqlite3
from pathlib import Path

root = Path(__file__).parent
page = json.loads((root / "usage-page.json").read_text())
events = page["usageEventsDisplay"]
assert len(events) == page["totalUsageEventsCount"] == 4
first, concurrent, unmatched, missing = events
cid = first["conversationId"]
assert all(first[k] == concurrent[k] for k in ("timestamp", "model", "conversationId"))
assert first != concurrent and "id" not in first and "id" not in concurrent
buckets = ("inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens")
assert sum(first["tokenUsage"][k] for k in buckets) == 460
assert first["chargedCents"] == 0 < first["tokenUsage"]["totalCents"]
assert "cacheWriteTokens" not in concurrent["tokenUsage"]
assert concurrent["tokenUsage"]["cacheReadTokens"] == 0
assert unmatched["conversationId"] != cid and "cloudAgentId" in unmatched
assert "conversationId" not in missing and "tokenUsage" not in missing

# Separate databases preserve the actual workspace/global storage split.
workspace = sqlite3.connect(":memory:")
global_db = sqlite3.connect(":memory:")
workspace.execute("CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value TEXT)")
global_db.execute("CREATE TABLE cursorDiskKV (key TEXT PRIMARY KEY, value TEXT)")
for row in json.loads((root / "composer-rows.json").read_text()):
    if row["table"] == "ItemTable":
        workspace.execute("INSERT INTO ItemTable VALUES (?, ?)", (row["key"], json.dumps(row["value"])))
    else:
        assert row["table"] == "cursorDiskKV"
        global_db.execute("INSERT INTO cursorDiskKV VALUES (?, ?)", (row["key"], json.dumps(row["value"])))
index = json.loads(workspace.execute("SELECT value FROM ItemTable WHERE key = ?", ("composer.composerData",)).fetchone()[0])
assert index["allComposers"][0]["composerId"] == cid
header = json.loads(global_db.execute("SELECT value FROM cursorDiskKV WHERE key = ?", (f"composerData:{cid}",)).fetchone()[0])
bubbles = [json.loads(global_db.execute("SELECT value FROM cursorDiskKV WHERE key = ?", (f"bubbleId:{cid}:{h['bubbleId']}",)).fetchone()[0]) for h in header["fullConversationHeadersOnly"]]
assert len(bubbles) == 2 and bubbles[1]["text"] == ""
timing = bubbles[1]["timingInfo"]
assert timing["clientEndTime"] - timing["clientStartTime"] == 1000
transcript = [json.loads(line) for line in (root / f"{cid}.jsonl").read_text().splitlines()]
assert len(transcript) == len(bubbles)
assert transcript[1]["message"]["content"][0]["name"] == bubbles[1]["toolFormerData"]["name"]
assert all("timestamp" not in message for message in transcript)
assert json.loads((root / "workspace.json").read_text())["folder"] == "file:///synthetic/project"
workspace.close()
global_db.close()
print("Validated 4 usage events, 2 keyed Composer bubbles, workspace join and overlapping transcript.")
