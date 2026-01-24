## 白云学院假（jiǎ）条生成器

##### [生成器在线使用](byu-flag.wwen.work)

### 代码结构
```
BYU-fake-leave-application-generator/
├─ packages/
│  ├─ web/                  # 前端网页
│  ├─ script/               # Python 爬虫脚本
│  │  ├─ fetch_departments.py           # 获取完整的部门树结构
│  │  ├─ fetch_users_in_department.py   # 递归遍历所有部门获取人员信息（彻底）
│  │  ├─ fetch_users_in_root.py         # 仅从根节点递归获取人员信息（较快但可能不全）
│  │  └─ data_convert.py                # 数据转换脚本
│  └─ export/               # 导出的数据文件
│     ├─ department.json    # 通过[fetch_departments]脚本获取的部门信息
│     ├─ source_data.json   # 通过[fetch_users_in_root]或[fetch_users_in_department]获取的全体人员数据，包含隐私数据，所以不会上传至仓库
│     └─ data.json          # 转换后的全体人员数据，不包含隐私数据
├─ LICENSE
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```

### 运行说明

#### 前端网页
项目使用 **pnpm** 管理工作区：
- **安装依赖**: 在根目录下执行 `pnpm install`（或进入 `packages/web` 运行 `pnpm dev`）。
- **本地开发**: `pnpm web:dev`。
- **项目构建**: `pnpm web:build`（默认检查语法，忽略检查使用`pnpm web:only-build`来构建）。

#### 数据采集脚本
- **环境准备**: 开发环境 Python 3.12.X。
- **安装依赖**: `pip install -r packages/script/requirements.txt`。
- **身份认证**: 
  1. 网页登录一站式服务平台，获取 `Cookie` 和 `eteamsid`。
  2. 填入 `packages/script/session.json` 中。
- **执行流程**:
  1. 运行 `python fetch_departments.py` 获取组织结构。
  2. 运行 `python fetch_users_in_root.py` 通过根组织结构获取人员列表 (推荐)，获取速度比按部门获取快，内置分页500条一页，可按需修改。
  3. 运行 `python data_convert.py` 生成前端可用的 `data.json`。

### ⚠️ 免责声明
本项目仅用于学习、研究或技术演示目的。使用本代码产生的任何后果，作者不承担任何责任。