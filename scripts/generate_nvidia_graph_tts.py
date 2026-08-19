import base64
import json
import os
from pathlib import Path

import requests

TEXT = "英伟达在全球科技产业链中处于核心地位，既是芯片设计企业，也是人工智能基础设施的重要供应商。它与台积电、三星等企业合作生产芯片，与微软、亚马逊云科技、谷歌云等云服务商共同建设人工智能计算平台，同时为游戏、数据中心、自动驾驶和机器人等领域的企业提供GPU及相关软件。英伟达还面临AMD、英特尔以及谷歌等公司的竞争，因此与其他公司的关系既包括供应链合作、技术生态共建和客户服务，也包含市场竞争。"

repo = Path(__file__).resolve().parents[1]
config = json.loads((Path.home() / ".story-claw" / "tts_config.json").read_text(encoding="utf-8"))
for key in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    os.environ.pop(key, None)

payload = {
    "user": {"uid": "story-claw-templates"},
    "req_params": {
        "text": TEXT,
        "speaker": config["narrator_voice"],
        "audio_params": {"format": "mp3", "sample_rate": 24000, "enable_timestamp": True},
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
    words.extend((item.get("sentence") or {}).get("words") or [])
if not chunks:
    raise RuntimeError("TTS API returned no audio")

public_dir = repo / "public"
public_dir.mkdir(exist_ok=True)
(public_dir / "nvidia-graph-narration.mp3").write_bytes(b"".join(chunks))
(repo / "examples" / "nvidia-directed-graph.timestamps.json").write_text(
    json.dumps({"text": TEXT, "words": words}, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(f"audio={public_dir / 'nvidia-graph-narration.mp3'}")
print(f"words={len(words)}")
