import assert from "node:assert/strict";
import test from "node:test";
import {MG_STYLE_CATALOG} from "../src/catalog";
import {getMgTemplateProvider} from "../src/provider";

const removed = [
  {
    "template": "metric",
    "style": "counter-tick-sparks"
  },
  {
    "template": "metric",
    "style": "counter-confetti"
  },
  {
    "template": "metric",
    "style": "confetti-crossfire"
  },
  {
    "template": "metric",
    "style": "odometer-digit-roll"
  },
  {
    "template": "metric",
    "style": "unit-dot-swarm-regroup"
  },
  {
    "template": "showcase",
    "style": "hashtag-to-pill-materialize"
  },
  {
    "template": "showcase",
    "style": "glass-pill-dictation-typing"
  },
  {
    "template": "showcase",
    "style": "keycap-smash-cut"
  },
  {
    "template": "showcase",
    "style": "autolayout-gap-dial"
  },
  {
    "template": "showcase",
    "style": "floating-glossy-label-pills"
  },
  {
    "template": "showcase",
    "style": "radial-wave"
  },
  {
    "template": "showcase",
    "style": "icon-flip-bloom"
  },
  {
    "template": "metric",
    "style": "voice-waveform-live"
  },
  {
    "template": "metric",
    "style": "changelog-scroll-brake"
  },
  {
    "template": "metric",
    "style": "brake-reticle-lock"
  },
  {
    "template": "metric",
    "style": "timeline-travel"
  },
  {
    "template": "metric",
    "style": "avatar-grid-radial-build-colorize"
  },
  {
    "template": "showcase",
    "style": "contact-shadow-lift"
  },
  {
    "template": "showcase",
    "style": "skeleton-reveal"
  },
  {
    "template": "showcase",
    "style": "chip-lift-to-user-pill"
  },
  {
    "template": "showcase",
    "style": "svg-shape-morph"
  },
  {
    "template": "showcase",
    "style": "wireframe-draw-on"
  },
  {
    "template": "metric",
    "style": "axis-rescale-shock"
  },
  {
    "template": "metric",
    "style": "particle-sand-fill"
  }
] as const;

test("user-rejected styles cannot be selected through catalog or Provider", () => {
 const provider=getMgTemplateProvider();
 for (const {template,style} of removed) {
  assert.ok(!MG_STYLE_CATALOG.some(entry=>entry.template===template && entry.style===style), template+":"+style);
  assert.equal(provider.supportsGroup("mg-"+template,style),false);
 }
 assert.equal(provider.supportsGroup("mg-metric","editorial-ledger"),true);
 assert.equal(provider.supportsGroup("mg-showcase","list-reveal"),true);
});
