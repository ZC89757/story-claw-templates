// Prepared from the Tesla A original narration; every preview uses the production component.
import type {ProgressTimelineSpec} from "./progress-timeline/types";
import type {SideBySideComparisonSpec} from "./weighted-comparison/types";
import type {DirectedGraphSpec} from "./directed-graph/types";
import type {RouteMapSpec} from "./route-map/schema";
export const documentaryTimelineSpec: ProgressTimelineSpec = {
  "title": "特斯拉成立",
  "subtitle": "",
  "followViewport": true,
  "nodes": [
    {
      "id": "archive-rail-1",
      "at": 0,
      "progress": 0,
      "kind": "major",
      "title": "特斯拉正式成立",
      "eyebrow": "2003",
      "detail": {
        "type": "text",
        "value": "特斯拉正式成立"
      },
      "motion": "instant"
    }
  ]
};
export const documentaryPriceSpec: SideBySideComparisonSpec = {
  "title": "同期家用车价格对比",
  "leftLabel": "2012 款丰田凯美瑞",
  "rightLabel": "Model S",
  "events": [
    {
      "at": 1.691,
      "side": "left",
      "text": "美国起售价：21,955 美元",
      "action": "add"
    },
    {
      "at": 5.736,
      "action": "highlight",
      "side": "left"
    },
    {
      "at": 8.304,
      "side": "right",
      "text": "最便宜的规划版本，抵免前价格约为凯美瑞的 2.6 倍",
      "action": "add"
    },
    {
      "at": 12.384,
      "action": "highlight",
      "side": "right"
    }
  ]
};
export const documentaryConfigSpec: SideBySideComparisonSpec = {
  "title": "配置组合对比",
  "leftLabel": "Model S",
  "rightLabel": "Model 3",
  "events": [
    {
      "at": 0,
      "side": "left",
      "text": "超过1,500种配置组合",
      "action": "add"
    },
    {
      "at": 0,
      "action": "highlight",
      "side": "left"
    },
    {
      "at": 2.924,
      "side": "right",
      "text": "配置组合控制在100种以内",
      "action": "add"
    },
    {
      "at": 2.924,
      "action": "highlight",
      "side": "right"
    },
    {
      "at": 5.564,
      "side": "right",
      "text": "便于供应商集中生产",
      "action": "add"
    }
  ]
};
export const documentaryFactorySpec: DirectedGraphSpec = {
  "title": "超级工厂 · 特斯拉 × 松下",
  "nodes": [
    {
      "id": "n0",
      "label": "特斯拉提供并管理厂房、土地和基础设施",
      "at": 0.35
    },
    {
      "id": "n1",
      "label": "松下投资设备、制造电芯",
      "at": 1.6
    },
    {
      "id": "n2",
      "label": "特斯拉最后做组装",
      "at": 4.15
    }
  ],
  "edges": [
    {
      "from": "n0",
      "to": "n1",
      "at": 1.6,
      "relation": "合作分工中，特斯拉提供并管理厂房、土地和基础设施，随后松下投资设备并制造电芯。"
    },
    {
      "from": "n1",
      "to": "n2",
      "at": 4.15,
      "relation": "松下投资设备并制造电芯后，特斯拉最后完成组装。"
    }
  ]
};
export const documentaryMapSpec: RouteMapSpec = {
  "title": "一辆 Roadster，跨越多个国家",
  "stops": [
    {
      "id": "jp",
      "label": "日本",
      "detail": "电芯",
      "longitude": 139.7,
      "latitude": 35.6,
      "at": 5.198
    },
    {
      "id": "th",
      "label": "泰国",
      "detail": "电池组装",
      "longitude": 100.5,
      "latitude": 13.75,
      "at": 6.968
    },
    {
      "id": "uk",
      "label": "英国",
      "detail": "车体配合",
      "longitude": -1.1,
      "latitude": 52,
      "at": 9.307
    },
    {
      "id": "fr",
      "label": "法国",
      "detail": "车身面板",
      "longitude": 2.35,
      "latitude": 48.8,
      "at": 10.897
    },
    {
      "id": "atlantic",
      "label": "大西洋",
      "detail": "",
      "longitude": -35,
      "latitude": 31,
      "at": 14.547
    },
    {
      "id": "panama",
      "label": "巴拿马运河",
      "detail": "",
      "longitude": -79.9,
      "latitude": 9,
      "at": 15.647
    },
    {
      "id": "us",
      "label": "美国",
      "detail": "最终装配",
      "longitude": -122.1,
      "latitude": 37.4,
      "at": 16.837
    }
  ],
  "routes": [
    {
      "from": "jp",
      "to": "th",
      "at": 6.968,
      "waypoints": []
    },
    {
      "from": "th",
      "to": "uk",
      "at": 9.307,
      "waypoints": []
    },
    {
      "from": "fr",
      "to": "uk",
      "at": 10.897,
      "waypoints": []
    },
    {
      "from": "uk",
      "to": "atlantic",
      "at": 14.547,
      "waypoints": []
    },
    {
      "from": "atlantic",
      "to": "panama",
      "at": 15.647,
      "waypoints": [
        {
          "longitude": -60,
          "latitude": 23
        },
        {
          "longitude": -74,
          "latitude": 15
        }
      ]
    },
    {
      "from": "panama",
      "to": "us",
      "at": 16.837,
      "waypoints": [
        {
          "longitude": -84,
          "latitude": 5
        },
        {
          "longitude": -107,
          "latitude": 20
        }
      ]
    }
  ]
};
export const documentaryDemoMeta = {
  "carFromFrame": 119,
  "carDurationFrames": 88,
  "carWindow": {
    "start": 3.966666666666667,
    "end": 6.9
  },
  "durations": {
    "documentary-timeline": 244,
    "documentary-price": 402,
    "documentary-config": 227,
    "documentary-factory": 194,
    "documentary-map": 675
  }
} as const;
