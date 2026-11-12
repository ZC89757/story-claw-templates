export const PORTRAIT_FUNCTIONS = [
  {
    "type": "function",
    "name": "create_portrait_torn_split",
    "strict": true,
    "description": "9:16 竖屏：撕纸分屏。上窗按 upper 的时间换镜，下窗连续播放；纸边、闪切、构图和竖题动作固定。 upper 首项 at=start，其后严格递增；lower 覆盖全段，每个 upper 视频覆盖对应换镜区间。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "upper",
        "lower",
        "title"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "upper": {
          "type": "array",
          "minItems": 1,
          "maxItems": 6,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "media",
              "at"
            ],
            "properties": {
              "media": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "source",
                  "sourceStart"
                ],
                "properties": {
                  "source": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 2000,
                    "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
                  },
                  "sourceStart": {
                    "anyOf": [
                      {
                        "type": "number",
                        "minimum": 0,
                        "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  }
                }
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        },
        "lower": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "source",
            "sourceStart"
          ],
          "properties": {
            "source": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2000,
              "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
            },
            "sourceStart": {
              "anyOf": [
                {
                  "type": "number",
                  "minimum": 0,
                  "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                },
                {
                  "type": "null"
                }
              ]
            }
          }
        },
        "title": {
          "anyOf": [
            {
              "type": "string",
              "minLength": 1,
              "maxLength": 16,
              "description": "竖排标题；null 表示不显示。"
            },
            {
              "type": "null"
            }
          ]
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_picture_in_picture",
    "strict": true,
    "description": "9:16 竖屏：人物画中画。背景压暗虚化，内窗按 clips 换镜；窗口、闪白和边线固定。 clips 首项 at=start，其后严格递增；背景与各片段按各自可见区间校验长度。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "background",
        "clips"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "background": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "source",
            "sourceStart"
          ],
          "properties": {
            "source": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2000,
              "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
            },
            "sourceStart": {
              "anyOf": [
                {
                  "type": "number",
                  "minimum": 0,
                  "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                },
                {
                  "type": "null"
                }
              ]
            }
          }
        },
        "clips": {
          "type": "array",
          "minItems": 1,
          "maxItems": 8,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "media",
              "at"
            ],
            "properties": {
              "media": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "source",
                  "sourceStart"
                ],
                "properties": {
                  "source": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 2000,
                    "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
                  },
                  "sourceStart": {
                    "anyOf": [
                      {
                        "type": "number",
                        "minimum": 0,
                        "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  }
                }
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_dual_window",
    "strict": true,
    "description": "9:16 竖屏：双窗口对照。网点底景由模板生成，上下两窗入场后同时保留至结束。 两窗至少存在共同可见区间；素材从各自 at 播放到 end；所有入场应在 end 前完整结束。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "upper",
        "lower"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "upper": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "media",
            "at"
          ],
          "properties": {
            "media": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "source",
                "sourceStart"
              ],
              "properties": {
                "source": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 2000,
                  "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
                },
                "sourceStart": {
                  "anyOf": [
                    {
                      "type": "number",
                      "minimum": 0,
                      "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                    },
                    {
                      "type": "null"
                    }
                  ]
                }
              }
            },
            "at": {
              "type": "number",
              "minimum": 0,
              "maximum": 36000,
              "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
            }
          }
        },
        "lower": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "media",
            "at"
          ],
          "properties": {
            "media": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "source",
                "sourceStart"
              ],
              "properties": {
                "source": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 2000,
                  "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
                },
                "sourceStart": {
                  "anyOf": [
                    {
                      "type": "number",
                      "minimum": 0,
                      "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                    },
                    {
                      "type": "null"
                    }
                  ]
                }
              }
            },
            "at": {
              "type": "number",
              "minimum": 0,
              "maximum": 36000,
              "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_item_cards",
    "strict": true,
    "description": "9:16 竖屏：物品信息卡。透明卡片层；按数组顺序放在左上、右下，出现后保留，背景由外层内容提供。 image 必须为可解码透明主体图；cards.at 非递减；文字超出可读范围报错，不静默截断。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "cards"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "cards": {
          "type": "array",
          "minItems": 1,
          "maxItems": 2,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "image",
              "text",
              "at"
            ],
            "properties": {
              "image": {
                "type": "string",
                "minLength": 1,
                "maxLength": 2000,
                "description": "已准备好的图片素材 ID 或本地路径；素材准备阶段解析，禁止填未经准备的远程 URL。"
              },
              "text": {
                "type": "string",
                "minLength": 1,
                "maxLength": 24,
                "description": "画面内文字"
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_comment_panels",
    "strict": true,
    "description": "9:16 竖屏：评论叠加。横卡与竖卡各有固定排版和入场；下一块 panel 替换上一块，不切换宿主底片。 panels.at 严格递增；wide 最多 2 条，tall 最多 5 条；署名头像无值则省略，不虚构点赞数、日期或平台记录。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "panels"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "panels": {
          "type": "array",
          "minItems": 1,
          "maxItems": 6,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "layout",
              "comments",
              "at"
            ],
            "properties": {
              "layout": {
                "type": "string",
                "enum": [
                  "wide",
                  "tall"
                ],
                "description": "wide 横卡：1–2 条；tall 竖卡：1–5 条。"
              },
              "comments": {
                "type": "array",
                "minItems": 1,
                "maxItems": 5,
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": [
                    "text",
                    "author",
                    "avatar"
                  ],
                  "properties": {
                    "text": {
                      "type": "string",
                      "minLength": 1,
                      "maxLength": 160,
                      "description": "画面内文字"
                    },
                    "author": {
                      "anyOf": [
                        {
                          "type": "string",
                          "minLength": 1,
                          "maxLength": 24,
                          "description": "署名；无来源时填 null。"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    },
                    "avatar": {
                      "anyOf": [
                        {
                          "type": "string",
                          "minLength": 1,
                          "maxLength": 2000,
                          "description": "已准备好的图片素材 ID 或本地路径；素材准备阶段解析，禁止填未经准备的远程 URL。"
                        },
                        {
                          "type": "null"
                        }
                      ]
                    }
                  }
                }
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_vertical_relation",
    "strict": true,
    "description": "9:16 竖屏：纵向关系图。恰好两个上下节点；下节点出现后自动按固定节奏画连接箭头，背景纹理由模板提供。 数组顺序即上、下节点，at 非递减；只用于正文确实存在的上到下关系；不自动加入旗帜或行业标志。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "nodes"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "nodes": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "media",
              "label",
              "at"
            ],
            "properties": {
              "media": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "source",
                  "sourceStart"
                ],
                "properties": {
                  "source": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 2000,
                    "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
                  },
                  "sourceStart": {
                    "anyOf": [
                      {
                        "type": "number",
                        "minimum": 0,
                        "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  }
                }
              },
              "label": {
                "type": "string",
                "minLength": 1,
                "maxLength": 24,
                "description": "画面内文字"
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_cutout_collage",
    "strict": true,
    "description": "9:16 竖屏：人物抠像拼贴。左右人物对向滑入、上下错位、下缘羽化和固定火花层；外层提供视频或图片背景。 恰好两张透明人物图，顺序为左、右；at 非递减且有足够入场时间；示例比分不内置到通用样式。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "people"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "people": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "image",
              "at"
            ],
            "properties": {
              "image": {
                "type": "string",
                "minLength": 1,
                "maxLength": 2000,
                "description": "已准备好的图片素材 ID 或本地路径；素材准备阶段解析，禁止填未经准备的远程 URL。"
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_person_profile",
    "strict": true,
    "description": "9:16 竖屏：人物介绍。固定暗色舞台、人物入场、图文履历卡、烟雾及片尾标题；画像从实例开头入场。 画像为透明主体图；卡片时间非递减；headline.at 不早于最后卡片；内容应有依据，背景不暗含奖项等事实。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "portraitImage",
        "cards",
        "headline"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "portraitImage": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2000,
          "description": "已准备好的图片素材 ID 或本地路径；素材准备阶段解析，禁止填未经准备的远程 URL。"
        },
        "cards": {
          "type": "array",
          "minItems": 1,
          "maxItems": 2,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "image",
              "text",
              "at"
            ],
            "properties": {
              "image": {
                "type": "string",
                "minLength": 1,
                "maxLength": 2000,
                "description": "已准备好的图片素材 ID 或本地路径；素材准备阶段解析，禁止填未经准备的远程 URL。"
              },
              "text": {
                "type": "string",
                "minLength": 1,
                "maxLength": 24,
                "description": "画面内文字"
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        },
        "headline": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "text",
            "at"
          ],
          "properties": {
            "text": {
              "type": "string",
              "minLength": 1,
              "maxLength": 80,
              "description": "画面内文字"
            },
            "at": {
              "type": "number",
              "minimum": 0,
              "maximum": 36000,
              "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_page_perspective",
    "strict": true,
    "description": "9:16 竖屏：网页透视展示。真实网页截图按固定透视轨迹展开和移动；正文与页面标识来自截图，不重造网页。 准备阶段加载真实页面并保存截图；focusText 非空时须定位到原文，歧义/找不到均报错。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "url",
        "focusText"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "url": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2000,
          "description": "可访问的真实网页 URL。"
        },
        "focusText": {
          "anyOf": [
            {
              "type": "string",
              "minLength": 1,
              "maxLength": 300,
              "description": "定位截图区域的原文；null 使用页面默认主内容区域。"
            },
            {
              "type": "null"
            }
          ]
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_archive_window",
    "strict": true,
    "description": "9:16 竖屏：旧影像圆角窗。背景暗蓝虚化，旧影像在圆角窗入场；边框、旧化和装饰固定，连续播放至片尾。 两路媒体均覆盖各自可见区间；不循环或冻结不足的视频；archive 的入场延迟固定在模板内。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "background",
        "archive"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "background": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "source",
            "sourceStart"
          ],
          "properties": {
            "source": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2000,
              "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
            },
            "sourceStart": {
              "anyOf": [
                {
                  "type": "number",
                  "minimum": 0,
                  "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                },
                {
                  "type": "null"
                }
              ]
            }
          }
        },
        "archive": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "source",
            "sourceStart"
          ],
          "properties": {
            "source": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2000,
              "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
            },
            "sourceStart": {
              "anyOf": [
                {
                  "type": "number",
                  "minimum": 0,
                  "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                },
                {
                  "type": "null"
                }
              ]
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_filmstrip",
    "strict": true,
    "description": "9:16 竖屏：纵向胶片带。胶片开场滚动减速回弹，所有可见画格同步显示当前片段；齿孔、边字纹理固定。 clips 首项 at=start，其后严格递增；每段素材覆盖到下一 at 或 end；原复刻末尾另一种画面的尾切由宿主另行编排。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "clips"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "clips": {
          "type": "array",
          "minItems": 1,
          "maxItems": 8,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "media",
              "at"
            ],
            "properties": {
              "media": {
                "type": "object",
                "additionalProperties": false,
                "required": [
                  "source",
                  "sourceStart"
                ],
                "properties": {
                  "source": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 2000,
                    "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
                  },
                  "sourceStart": {
                    "anyOf": [
                      {
                        "type": "number",
                        "minimum": 0,
                        "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  }
                }
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_document_highlight",
    "strict": true,
    "description": "9:16 竖屏：资料截图高亮。纸页翻入、摘录抬升、回落和跨行黄色高亮；纸页外透明，保留宿主背景。 网页文字需真实匹配；同一次跨行高亮的矩形共用 at；excerpt.at 早于首个高亮并留足固定抬升回落时长，具体最短间隔在实现时按原动效校准。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "url",
        "excerpt",
        "highlights"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "url": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2000,
          "description": "真实资料网页 URL。"
        },
        "excerpt": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "text",
            "at"
          ],
          "properties": {
            "text": {
              "type": "string",
              "minLength": 1,
              "maxLength": 200,
              "description": "从资料中抽出的原文；必须能定位。"
            },
            "at": {
              "type": "number",
              "minimum": 0,
              "maximum": 36000,
              "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
            }
          }
        },
        "highlights": {
          "type": "array",
          "minItems": 1,
          "maxItems": 6,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "text",
              "at"
            ],
            "properties": {
              "text": {
                "type": "string",
                "minLength": 1,
                "maxLength": 300,
                "description": "需要黄色高亮的连续原文，可跨行。"
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_ink_title",
    "strict": true,
    "description": "9:16 竖屏：墨迹标题转场。固定近白留底、深色墨芯、灰晕和青蓝底纹；标题显露和墨迹扩散由固定曲线控制。 非空标题必须在安全区内可读；实例过短则报错，不能将闪墨和标题显露压成一帧。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "text"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "text": {
          "type": "string",
          "minLength": 1,
          "maxLength": 12,
          "description": "主标题，模板自动按可读性排版。"
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_process_correction",
    "strict": true,
    "description": "9:16 竖屏：产业流程图（否定后转向）。圆标上移、第一标签出现并画红叉、替换标签并显示向下箭头；固定蓝黑底景。 只用于明确否定第一说法并提出第二说法的内容；rejected.at < replacement.at，间隔须足以完成固定红叉笔画；不把普通流程自动解释为否定。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "subject",
        "rejected",
        "replacement"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "subject": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "image",
            "label"
          ],
          "properties": {
            "image": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2000,
              "description": "已准备好的图片素材 ID 或本地路径；素材准备阶段解析，禁止填未经准备的远程 URL。"
            },
            "label": {
              "type": "string",
              "minLength": 1,
              "maxLength": 24,
              "description": "画面内文字"
            }
          }
        },
        "rejected": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "text",
            "at"
          ],
          "properties": {
            "text": {
              "type": "string",
              "minLength": 1,
              "maxLength": 80,
              "description": "画面内文字"
            },
            "at": {
              "type": "number",
              "minimum": 0,
              "maximum": 36000,
              "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
            }
          }
        },
        "replacement": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "text",
            "at"
          ],
          "properties": {
            "text": {
              "type": "string",
              "minLength": 1,
              "maxLength": 80,
              "description": "画面内文字"
            },
            "at": {
              "type": "number",
              "minimum": 0,
              "maximum": 36000,
              "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_flash_cutout",
    "strict": true,
    "description": "9:16 竖屏：闪白人物抠像。人物白色剪影停留后显现彩色主体；背景虚化、闪白曲线、边缘与构图固定。 人物必须是带 Alpha 的主体图；背景覆盖全段；主体进场从实例 start 开始，白剪影和彩色显现时间由模板控制。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "image",
        "background"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "image": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2000,
          "description": "已准备好的图片素材 ID 或本地路径；素材准备阶段解析，禁止填未经准备的远程 URL。"
        },
        "background": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "source",
            "sourceStart"
          ],
          "properties": {
            "source": {
              "type": "string",
              "minLength": 1,
              "maxLength": 2000,
              "description": "已登记/准备的图片或视频素材 ID 或本地路径，不接受任意远程 URL。"
            },
            "sourceStart": {
              "anyOf": [
                {
                  "type": "number",
                  "minimum": 0,
                  "description": "视频源内入点秒数；静态图必须为 null，视频必须为非负数。"
                },
                {
                  "type": "null"
                }
              ]
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_gradient_dual_card",
    "strict": true,
    "description": "9:16 竖屏：渐变双卡对照。固定上下渐变卡、细点边和暗网点底；每张卡出现时文字短暂波动，位置不漂移。 数组顺序为上、下，at 非递减；两卡出现后保持至结束；用于简短对照语句，不能超出固定字区。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "cards"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "cards": {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "text",
              "at"
            ],
            "properties": {
              "text": {
                "type": "string",
                "minLength": 1,
                "maxLength": 80,
                "description": "画面内文字"
              },
              "at": {
                "type": "number",
                "minimum": 0,
                "maximum": 36000,
                "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
              }
            }
          }
        }
      }
    }
  },
  {
    "type": "function",
    "name": "create_portrait_rotating_document",
    "strict": true,
    "description": "9:16 竖屏：文件旋转展示。封面图随纸面卷曲、旋转、舒平和悬浮；body 非空时在指定时间硬切正文页。 输入为已准备好的页面图片，PDF/网页先转换为页面图；body.at 须晚于固定旋开阶段；body=null 时封面停留至结束，避免多余的时间参数。 整段时间由宿主提供；内部 at 为绝对秒数。",
    "parameters": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "group",
        "order",
        "coverImage",
        "body"
      ],
      "properties": {
        "group": {
          "type": "string",
          "enum": [
            "portrait"
          ],
          "description": "从审核 HTML 原样复制；每个独立竖屏标签只有 portrait 组。"
        },
        "order": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 1,
              "maximum": 999,
              "description": "同标签同组多个实例时的连续序号；单实例为 null。"
            },
            {
              "type": "null"
            }
          ]
        },
        "coverImage": {
          "type": "string",
          "minLength": 1,
          "maxLength": 2000,
          "description": "已准备好的图片素材 ID 或本地路径；素材准备阶段解析，禁止填未经准备的远程 URL。"
        },
        "body": {
          "anyOf": [
            {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "image",
                "at"
              ],
              "properties": {
                "image": {
                  "type": "string",
                  "minLength": 1,
                  "maxLength": 2000,
                  "description": "已准备好的图片素材 ID 或本地路径；素材准备阶段解析，禁止填未经准备的远程 URL。"
                },
                "at": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 36000,
                  "description": "真实字级旁白时间轴上的绝对秒数；必须位于宿主传入的实例 [start,end) 内。"
                }
              }
            },
            {
              "type": "null"
            }
          ]
        }
      }
    }
  }
] as const;
