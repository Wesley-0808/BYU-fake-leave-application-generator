## 白云学院假（jiǎ）条生成器（`BYU-FLAG`）
_`BYU-FLAG`即：BaiyunU Fake Leave Application Generator_

##### [在线地址](https://byu-flag.wwen.work) [备用](https://byu-flag.wesley.net.cn)

### ☁️ About

#### 这是一个广东白云学院假（jiǎ，发第三声）条生成器的项目，用于生成请假审批的页面。

### 🚀 Feature

- 1:1复刻学校一站式服务平台
- 自选班级、辅导员、学院书记
- 自定义请假时间范围、原因以及提交时间
- 自动、随机生成流程审批时间
- 在线网页生成
- 支持二维码快速生成

### 🙋 FAQ

#### 为什么不支持生成7天以上的？

因为真实的流程需要学生处、教务处审批，且一般来说辅导员也不会直接让你请7天以上，基本上都是叫你分几次提流程

#### 如何获得更为真实的截图？

在企业微信内生成即可。（可以填写完信息后，使用企业微信扫生成器上的二维码打开）

#### 用途是什么？

用途自行思考。

#### 开发目的？

深入探索和实践 Vue 3 生态系统，包括 TypeScript 的强类型应用以及 Vite 的构建流程。通过高度还原操作界面，验证复杂前端场景下的高精度 UI 开发能力。同时提升自动化数据采集、数据转换脚本的能力

### 📁 代码结构

```
BYU-fake-leave-application-generator/
├─ packages/
│  ├─ web/                  # 前端网页
│  ├─ script/               # Python脚本
│  │  ├─ fetch_departments.py           # 获取部门架构
│  │  ├─ fetch_users_in_department.py   # 递归部门获取人员信息
│  │  ├─ fetch_users_in_root.py         # 在根组织获取人员信息
│  │  └─ data_convert.py                # 数据转换脚本
│  │  ├─ session.json                   # 存储 Cookie 与认证信息 (需手动配置)
│  │  └─ requirements.txt               # Python 依赖列表
│  └─ export/               # 导出的数据文件
│     ├─ department.json    # 通过[fetch_departments]脚本获取的部门信息
│     ├─ source_data.json   # 通过[fetch_users_in_root]或[fetch_users_in_department]获取的全体人员数据，包含隐私数据，所以不会上传至仓库
│     └─ data.json          # 转换后的人员数据，不包含隐私数据
├─ LICENSE
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```

### 🐞 运行说明

#### 前端网页

项目使用 **pnpm** 管理工作区：

- **安装依赖**: 在根目录下执行 `pnpm install`（或进入 `packages/web` 运行 `pnpm dev`）。
- **本地开发**: `pnpm web:dev`。
- **项目构建**: `pnpm web:build`（默认检查语法，忽略检查使用`pnpm web:only-build`来构建）。

#### 数据采集脚本

- **环境准备**: 开发环境 Python 3.12.X。
- **安装依赖**:
  1. 看个人需要决定是否使用虚拟环境。
  2. `pip install -r packages/script/requirements.txt`。
- **身份认证**:
  1. 用网页登录学校一站式服务平台，获取 `Cookie` 和 `eteamsid`（不会就上百度😄）。请注意保护好认证密钥！不要上传的开放平台避免被他人盗用身份。
  2. 填入 `packages/script/session.json` 中。
- **执行流程**:
  1. 运行 `python fetch_departments.py` 获取组织架构。
  2. 运行 `python fetch_users_in_root.py` 或 `python fetch_users_in_department.py` 获取人员列表 (推荐用`fetch_users_in_root.py`，因为获取速度比按部门获取快，内置分页500条一页，可自行按需修改。)
  3. 运行 `python data_convert.py` 生成前端可用的 `data.json`。

### ⚠️ 免责声明

本项目仅用于学习、研究或技术演示目的。使用本项目代码产生的任何后果，作者不承担任何责任！
