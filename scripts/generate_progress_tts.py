import base64
import json
import os
from pathlib import Path

import requests

TEXT = "整场事件起源于1987年，当年是著名的黑天鹅事件。其一是一个小孩子走在马路边上捡到了1块钱，然后到了1988年这个小孩子成为了世界首富，主宰整个世界。然后到了2000年这个小孩子又疯狂地干以下三件事情：第一卖锅，第二卖铲子，第三卖桌子，结果又干成了世界首富。到了2002年，他破产了。"

repo = Path(__file__).resolve().parents[1]
config_path = Path.home() / ".story-claw" / "tts_config.json"
config = json.loads(config_path.read_text(encoding="utf-8"))

for key in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    os.environ.pop(key, None)

payload = {
    "user": {"uid": "story-claw-templates"},
    "req_params": {
        "text": TEXT,
        "speaker": config["narrator_voice"],
        "audio_params": {
            "format": "mp3",
            "sample_rate": 24000,
            "enable_timestamp": True,
        },
        "additions": json.dumps({"disable_markdown_filter": True}),
    },
}
headers = {
    "X-Api-Key": config["api_key"],
    "X-Api-Resource-Id": config["resource_id"],
    "Content-Type": "application/json",
}

response = requests.post(config["base_url"], headers=headers, json=payload, timeout=90, proxies={"http": None, "https": None})
response.raise_for_status()

chunks = []
words = []
for raw_line in response.text.splitlines():
    try:
        item = json.loads(raw_line.strip())
    except (ValueError, TypeError):
        continue
    if item.get("data") and isinstance(item["data"], str):
        chunks.append(base64.b64decode(item["data"]))
    sentence = item.get("sentence") or {}
    words.extend(sentence.get("words") or [])

if not chunks:
    raise RuntimeError("TTS API returned no audio")

public_dir = repo / "public"
public_dir.mkdir(exist_ok=True)
(public_dir / "progress-narration.mp3").write_bytes(b"".join(chunks))
(repo / "examples" / "black-swan-progress.timestamps.json").write_text(
    json.dumps({"text": TEXT, "words": words}, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
print(f"audio={public_dir / 'progress-narration.mp3'}")
print(f"words={len(words)}")
