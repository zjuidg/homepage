# Publication category coding

初始编码日期：2026-10-12；分类边界修订日期：2026-10-13。范围：`public/source/publications.json` 中现有的 203 篇论文。

每篇论文只分配一个主类别，写入标量字符串字段 `category`。类别 ID 使用稳定的 lowercase-kebab-case；中英文名称及边界在本文件定义。中文名称为 4–6 个字，英文名称为 2–3 个词。类别数为 15，不设置含糊的 `other` 类，也不要求各类数量相等。

## 编码方法与依据

本轮逐篇阅读配置中的标题和全部 198 条非空摘要，依据主要研究问题、服务对象和核心贡献完成主题编码。其余 5 篇结合标题及下表列出的作者、机构或会议来源确认研究对象。

判断顺序如下：

1. 论文针对明确领域问题时，按实际研究对象编码。例如运动战术、社交传播、工业运行和临床诊断分别保留自己的类别。
2. 面向跨领域任务的方法，按主要研究问题编码：时序查询与演化归时序分析，因果关系与干预归因果分析，网络结构与图采样归图网络分析，图像与文本等模态的联合探索归多模态分析。数据提取、转换、质量和隐私管理归数据整理；视觉编码、布局、创作与设计复用归可视化设计；人的理解、操作和无障碍访问归感知交互。
3. `model-mechanisms` 覆盖模型内部解释、知识编辑、安全攻防与语言推理。按本轮确认的口径，模型安全和语言推理也保留在模型机理中。仅提出模型架构、使用机器学习或生成训练标签，不足以归入本类；时序预测、跨模态翻译和数据标注分别按实际任务编码。
4. 人机协作是跨主题的工作方式，不单独作为互斥主类别。按主要研究问题编码：交互流程与认知支持归感知交互，分析产物核验与数据血缘归数据整理；已有明确领域、模型或可视化创作任务的论文按相应任务编码。
5. 综述、数据集和用户实验是论文形式或研究手段，不单独决定类别。综述和数据集按所服务的研究主题编码；研究评估专指研究价值、严谨性和评估工具本身。
6. 遇到交叉研究，选择摘要中直接陈述并主要验证的研究目标。一个数据类型或案例不单独决定类别。例如名义变量中介分析不会因使用体育案例就归体育，城市坐标也不会把社交传播变成交通研究。

这是依据当前材料完成的一轮单标签编码，不是通过 Decisions API 生成的评分。后续相关度评分可以单独保存为多主题权重，不覆盖已确认的主类别。

## 类别定义与边界

| Category ID | English | 中文 | 数量 |
| --- | --- | --- | ---: |
| `sports-analytics` | Sports Analytics | 体育分析 | 40 |
| `urban-geospatial` | Geospatial Analytics | 地理空间分析 | 27 |
| `social-behavior` | Social Behavior | 社会行为 | 18 |
| `data-wrangling` | Data Wrangling | 数据整理 | 24 |
| `visualization-design` | Visualization Design | 可视化设计 | 31 |
| `time-series-analysis` | Time Series Analysis | 时序分析 | 7 |
| `causal-analysis` | Causal Analysis | 因果分析 | 3 |
| `graph-analytics` | Graph Analytics | 图网络分析 | 3 |
| `perception-interaction` | Perception and Interaction | 感知交互 | 11 |
| `research-evaluation` | Research Evaluation | 研究评估 | 3 |
| `multimodal-analytics` | Multimodal Analytics | 多模态分析 | 3 |
| `model-mechanisms` | Model Mechanisms | 模型机理 | 9 |
| `cultural-heritage` | Culture and Art | 文化艺术 | 9 |
| `industrial-analytics` | Industrial Operations | 工业运营 | 10 |
| `health-analytics` | Health Analytics | 健康分析 | 5 |

### `sports-analytics`：体育分析

研究比赛表现、技术动作、战术、选材、运动训练及体育内容的解释。纳入面向运动员、教练、体育分析师与球迷的工具、数据集和方法，也纳入以竞技决策为目标的电竞研究。排除以玩家社交、购买和虚拟经济为目标的游戏研究，它们归社会行为。

`T3Set` 虽然训练虚拟教练，核心目标仍是乒乓球训练；`t-foresight` 的主要验证对象是 MOBA 玩家的移动战术。`SNIL`、`Sporthesia` 和 `VisCommentator` 的内容和设计要求来自赛事解说与体育分析，因此保留在体育类别。`ArEnhanced` 服务于健身动作学习，归体育而非临床健康。

### `urban-geospatial`：地理空间分析

研究地理空间与环境中的运动、区域、位置关系和时空过程。纳入交通、人群移动、路线规划、设施选址、城市视图，以及天气、气候和污染研究。空间布局、地理关联或环境过程是任务本身时可纳入。排除以空间数据研究社会行为的 `NeighViz`、以位置序列识别传染风险的 `eadetector` 和以轨迹查找非法化工设施的 `icfinder`。

`cllmate` 和 `visual-voting` 服务于气象预测与校准，因此归本类。`GeoChron` 和 `GeoNetverse` 的方法针对地理时序和地理网络。`trajectorycurer` 的主要任务是质量诊断与修复，归数据整理。`geoauthor`、`geoanimation` 和 `trajgram` 的主要交付物是创作工具或语法，归可视化设计。

### `social-behavior`：社会行为

研究人、群体与社会系统中的行为、关系、传播、机会和互动。纳入社交媒体、社会网络、职业流动、学习行为、在线游戏社会经济行为，以及面向个人偏好的人际匹配。排除体育竞技决策、平台运营审核、临床行为机制，以及不依赖具体社会问题的通用图比较方法。

`CausalMap` 的因果网络服务于情绪传播，`SocialWave` 的空间结构服务于信息扩散，均归本类。`CareerLens` 研究历史职业流动而不是文物保护。`PeakVizor` 解释学习行为；`cograder` 的贡献是教师与 AI 的评阅交互流程，归感知交互。`egocomp` 主要研究网络节点与结构的比较，归图网络分析。

### `data-wrangling`：数据整理

研究数据在进入或经过分析流程时的提取、查询、重构、标注、理解、验证和保护。纳入 SQL、脚本理解与调试、数据血缘、数据剖析、数据质量、通用数据标注工具、表格构建与组织，以及保持分析效用的隐私编辑。表格的布局与样式编辑随表格构建任务归入本类；图表编码与数据叙事创作仍归可视化设计。排除用于评估可视化的测试数据，以及以语言模型推理能力为主要研究目标的训练数据合成。

`TableCanoniser`、`Rigel` 和 `NL2R` 改变数据组织；`TableIllustrator` 支持表格构建和布局编辑，按本轮确认的口径归数据整理。`bird-history` 的主要任务是 SQL 查询，`exchart` 的主要任务是从图像恢复表格数据，均归本类。`veriscope` 支持分析产物核验、溯源和修改，归本类。`ProTAL` 让用户编写事件与关系规则，批量生成视频动作标签，归数据标注。`TableNarrator` 支持表格的无障碍阅读，归感知交互。`tseditor` 修改发布数据的隐私风险，归本类；`puzzleclone` 的研究目标是语言模型逻辑推理能力，按本轮口径保留在模型机理。

### `visualization-design`：可视化设计

研究视觉编码、布局、视图组合、可视化语法、创作工具和数据叙事。纳入生成或编辑视觉表达的算法与工具，以及帮助检索、理解和复用设计的模式、索引与图像资源。排除以人的感知表现为主要研究对象的实验，以及以时序、因果或网络关系分析为主要任务的系统。

`chartgpt`、`DashBot` 和 `PlotThread` 生成可视化，`ReSpark` 与 `notable` 组织报告和叙事。`VAID`、`CompositeVisualization` 和 `VisImages` 分别提供设计索引、组合模式和可视化图像资源，支持设计理解与复用。`AbstractScatterplot` 提出散点图抽象与图符编码，`ViewpointSelection` 自动选择体绘制视点，均归本类。`Data-GIF` 主要研究观众的理解效果，归感知交互；`TransVideo` 与 `shortvideo-guidelines` 主要提供叙事设计规范，归本类。

### `time-series-analysis`：时序分析

研究时间序列、时间演化和连续到达数据中的模式查询、层次比较、预测、趋势及不确定性。纳入没有固定应用领域的时序探索方法，以及以时间分布变化和序列预测为主要问题的方法。排除待发布数据的隐私编辑，以及围绕某个领域实际决策建立的时序系统。

`chronomantic` 与 `relaq` 查询时序模式和序列关系，`ChronoDeck` 分析层次时序，`PieceStack` 分解堆叠时间序列的趋势，`rankbrushers` 比较排名随时间的变化，`uncertainty-streaming` 处理连续数据的采样不确定性。`tmoe` 针对非平稳时间序列中的分布漂移和预测，归本类；`tseditor` 归数据整理，`Compass` 归地理空间分析。

### `causal-analysis`：因果分析

研究因果关系的发现、验证、中介效应和干预推演。纳入可跨应用复用的因果分析任务与交互方法。仅将因果模型用于解决某个明确领域问题的论文，按其领域归类。

`Questionnaire` 研究问卷变量间的因果关系，`MediVizor` 比较直接与间接效应，`CausalExplorer` 支持因果探索、验证及行动推演。`CausalMap` 解释社交媒体情绪传播，归社会行为；`Compass` 分析城市过程，归地理空间分析。

### `graph-analytics`：图网络分析

研究节点、边和网络结构的比较、采样及演化。纳入以理解图结构或图算法影响为主要分析任务的工作。排除让用户创作图形布局的工具，以及研究具体社会传播、地理流动或因果机制的系统。

`egocomp` 比较自我中心网络的节点差异，`unmat` 分析图采样及其不确定性，`dynamic-graphs-evolution` 提取动态图序列的演化模式。`nuwa` 和 `Fine-tuning Layout` 让用户创作与调整布局，归可视化设计；`GeoNetverse` 归地理空间分析；`tievis` 研究人际关系演化，归社会行为。

### `perception-interaction`：感知交互

研究人的感知、理解、判断与操作，以及支持这些活动的交互流程。纳入感知实验、交互反馈、无障碍访问和认知支持，也纳入以协作组织为主要贡献的交互框架。论文含有用户实验或 AI 功能本身不构成本类的纳入理由。已有更直接的领域分析、数据操作、模型或可视化创作目标时，按该目标编码。

`stringlineEva`、`Doughnut`、`scatterplot-comprehension` 和 `Data-GIF` 研究图形理解与任务表现；`visaudio` 和 `graphgesture` 研究视听映射及手势反馈；`TableNarrator` 支持盲人与低视力用户阅读图像表格；`immersive-visualization-survey` 梳理沉浸环境中的感知与交互。`cograder` 组织教师与 AI 的评价标准制定、判断和反馈；`toa` 帮助新手理解并组织分析过程；`OptiMuse` 提出非线性协作框架，研究设计者的探索与反思。`ViewpointSelection` 主要产出自动视点选择算法，归可视化设计。

### `research-evaluation`：研究评估

研究可视分析工作的研究价值、严谨性、证据要求和评估工具。纳入研究议程、研究质量讨论及通用评估设施。排除普通的系统用户实验、具体图形的感知实验，以及针对某项技术的综述。

`GrandChallenges` 讨论可视分析的研究议程，`ReVast` 整理研究批评与回应，`visarena` 生成带约束的测试数据以评估可视化。`VisImages` 的主要产物是用于设计分析与复用的可视化图像资源，归可视化设计；视听通道的有效性实验归感知交互。

### `multimodal-analytics`：多模态分析

研究图像、文本、音频等不同模态的数据如何结合、表达、转换和探索。纳入围绕数据模态组织的方法综述、跨模态语义融合与翻译，以及通过模态间的语义联系支持数据集合探索的系统。排除用于输出反馈的多感官通道，以及服务于体育、天气、艺术鉴定等明确领域决策的多模态系统。

`multimodal-analysis-survey` 按数据模态梳理可视分析方法；`ImgVis` 从图像生成文本描述，再将图像与语义关键词共同投影到二维空间，以支持集合探索。`fea-slt` 联合面部表情、手部动作与语言语义完成手语翻译，归本类。`visaudio` 研究视觉和声音作为呈现通道时对人的感知影响，归感知交互；`cllmate` 服务于天气与气候事件预测，归地理空间分析。

### `model-mechanisms`：模型机理

研究模型内部表征、神经元、知识编辑、安全攻防及语言推理。按本轮确认的范围，纳入安全风险、红队测试、劫持和对抗策略，也纳入语言模型逻辑推理、工具调用推理及相关训练方法。是否提出新架构或进行模型训练本身，不决定其归属。排除时序预测、跨模态翻译、数据标注，以及将模型用于具体创作或领域分析的工作。

`neurobreak` 分析神经元安全机制，`keditvis` 分析模型层级与知识编辑。`navigating-risks`、`StealthGraph`、`AdversaFlow`、`camh` 和 `subplay` 分别研究智能体安全风险、有害提示生成、视觉红队、模型劫持及对抗策略，按模型安全口径保留。`puzzleclone` 为逻辑与数学推理生成可验证训练数据，`spader` 改进多答案问答中的工具调用和探索，按语言推理口径保留。`tmoe` 移入时序分析，`fea-slt` 移入多模态分析，`ProTAL` 移入数据整理。面向体育的 `vistec` 和 `T3Set` 保留在体育类别，面向图表提取的 `exchart` 归数据整理。

### `cultural-heritage`：文化艺术

研究文物与艺术品的修复、鉴定和理解，以及以数据为材料的艺术作品。纳入古画、碎片文物、文学作品的数据艺术和装置艺术。排除使用历史材料解释一般社会规律的研究，以及可跨主题复用的视觉创作工具。

`arteyer` 使用 GPT 辅助艺术品鉴定，研究对象仍是艺术品。`loss`、`island-of-loneliness` 和 `mindfulness-book-of-songs` 是数据艺术作品，不以检验一般社交行为假设或改进模型为主。`CareerLens` 研究社会流动，归社会行为。

### `industrial-analytics`：工业运营

研究生产、能源设备、工程设计、运行维护、安全监管和业务运营决策。纳入光伏、电厂、云系统、仓库、电商风控和内容审核，以及工程 CAD。排除一般模型攻击、自然环境过程、疾病研究和社会网络行为研究。

`icfinder` 的目标是非法化工设施监管，运输轨迹是证据来源。`camouflagevis` 和 `VideoModerator` 服务于电商风控与审核，而不是社交传播机制。`intelligent-cad-2` 讨论工程设计过程中的 AI 角色，归工程领域；`OptiMuse` 的贡献是一般创意协作框架，归感知交互。

### `health-analytics`：健康分析

研究疾病机制、诊断、治疗结局和公共卫生风险。纳入脑电与癫痫研究，以及传染病高风险地点识别。排除非临床的运动技能训练、一般表格无障碍技术，以及只用医疗数据作案例的通用分析方法。

`eadetector` 服务于疾病传播控制，归本类。四篇脑电研究分别研究发作行为、辅助诊断、发作表型和手术结局。`VolleyNaut` 的对象包括残障运动者，但直接任务是排球训练，归体育。

## 模型机理类别的收紧

2026-10-13 将“智能模型”改为“模型机理”（Model Mechanisms），保留 9 篇。依据确认的范围，模型安全和语言推理也纳入本类，不另设类别。内部解释与知识编辑对应 `neurobreak`、`keditvis`；模型安全对应 `navigating-risks`、`StealthGraph`、`camh`、`AdversaFlow`、`subplay`；语言推理对应 `puzzleclone`、`spader`。

移出 3 篇：`tmoe` 以非平稳时间序列预测为主要任务，归时序分析；`fea-slt` 以跨模态手语翻译为主要任务，归多模态分析；`ProTAL` 以可编程视频标注为主要贡献，归数据整理。其他论文类别不变。

## 人机协作类别的合并

2026-10-13 取消独立的人机协作主类别。该概念同时适用于图表生成、时序查询、艺术鉴定、模型编辑等工作，与其他主类别交叉。保留每篇论文一个类别，继续按主要研究问题划分。

原有 4 篇中，`cograder`、`OptiMuse`、`toa` 归感知交互，`veriscope` 归数据整理。前者分别围绕评阅协作流程、非线性共创和分析过程认知支持；后者围绕分析产物的核验与溯源。其他论文不会仅因使用 AI 而改变类别。

## 缺少配置摘要的记录

以下 5 篇结合标题及列出的作者、机构或会议材料编码，原摘要字段保留。

| Publication ID | Category | 辅助来源与依据 |
| --- | --- | --- |
| `StealthGraph` | `model-mechanisms` | [ACL Anthology 摘要](https://aclanthology.org/2026.acl-long.295/)：领域特定有害提示生成与 LLM red-teaming。 |
| `TableNarrator` | `perception-interaction` | [作者 PDF 首段](https://zhoushengisnoob.github.io/papers/CHI2025.pdf)：为盲人与低视力用户提供图像表格的无障碍阅读和替代文本。 |
| `GrandChallenges` | `research-evaluation` | [机构摘要](https://repositum.tuwien.at/handle/20.500.12708/192589)：可视分析研究的价值、严谨性与研究议程。 |
| `VolleyNaut` | `sports-analytics` | [IEEE VR 2024 官方论文列表](https://ieeevr.org/2024/program/papers/)：坐式排球的沉浸式技能训练。 |
| `immersive-urban-analytics-exploded-views` | `urban-geospatial` | [作者 PDF](https://chenzhutian.org/projects/2017_immersiveexplodedviews/paper.pdf)：以分解视图处理城市三维模型的遮挡与城市数据分析。 |

## 逐篇编码记录

顺序与 `publications.json` 一致。引文逐字取自同 ID 记录的标题或摘要，定位方式为该记录的 `title` / `abstract` 字段；解释是本轮编码判断。上面列出的 5 篇引用标题，并由辅助材料确认。类别 ID 与论文 ID 分开维护，保留原有大小写及空格。

| # | Publication ID | 论文标题 | Category | 主要依据 |
| ---: | --- | --- | --- | --- |
| 1 | `puzzleclone` | PuzzleClone: A DSL-Powered Framework for Synthesizing Verifiable Data | `model-mechanisms` | 为语言模型推理训练合成可验证逻辑数据；原文：“strengthening the reasoning capabilities”。 |
| 2 | `navigating-risks` | Navigating the Risks: A Survey of Security and Privacy Threats in LLM-Based Agents | `model-mechanisms` | 研究LLM智能体自身的安全与隐私威胁；原文：“security and privacy risks”。 |
| 3 | `sia` | Linking Heterogeneous Data with Coordinated Agent Flows for Social Media Analysis | `social-behavior` | 用智能体分析社交媒体中的舆情与传播；原文：“opinion dynamics, community formation, and information diffusion”。 |
| 4 | `neurobreak` | NeuroBreak: Unveil Internal Jailbreak Mechanisms in Large Language Models | `model-mechanisms` | 分析语言模型内部越狱机制和安全神经元；原文：“neuron-level safety mechanisms”。 |
| 5 | `cograder` | CoGrader: Transforming Instructors' Assessment of Project Reports through Collaborative LLM Integration | `perception-interaction` | 研究评价标准制定、教师判断与AI反馈的交互流程；原文：“human-LLM collaborative metrics design”。 |
| 6 | `cllmate` | CLLMate: A Multimodal Benchmark for Weather and Climate Events Forecasting | `urban-geospatial` | 为天气和气候事件预测建立多模态任务与数据集；原文：“Weather and Climate Event Forecasting”。 |
| 7 | `veriscope` | Veriscope: Provenance-Aware Verification of LLM Reasoning Artifacts in Conversational Data Analysis | `data-wrangling` | 核验分析产物、追踪数据分析来源并修改结果；原文：“fine-grained verification across interconnected artifacts”。 |
| 8 | `chronomantic` | ChronoMantic: A Natural Language Interface for Interactive Time Series Pattern Query | `time-series-analysis` | 提供跨领域时序模式的交互查询方法；原文：“time series pattern querying”。 |
| 9 | `fea-slt` | FEA-SLT: A Gloss-Free End-to-End Framework for Facial-Expression-Aware Sign Language Translation | `multimodal-analytics` | 联合手部动作、面部表情与语言语义完成跨模态手语翻译；原文：“joint modeling of manual articulations and non-manual signals”。 |
| 10 | `spader` | SPADER: Step-wise Peer Advantage with Diversity-Aware Exploration Rewards for Multi-Answer Question Answering | `model-mechanisms` | 改进多答案问答模型的强化学习与探索奖励；原文：“reinforcement learning framework”。 |
| 11 | `bird-history` | BIRD-History: A Benchmark for History-Driven Text-to-SQL with Fine-Grained Knowledge Annotations | `data-wrangling` | 利用历史查询知识改进文本到SQL的数据查询任务；原文：“history-driven approaches”。 |
| 12 | `net-efficiency` | Key indicator for winning soccer matches: net efficiency | `sports-analytics` | 研究足球比赛获胜与比赛效率指标；原文：“match efficiency”。 |
| 13 | `stroke-performance-fluctuation` | Stroke-level performance fluctuation analysis in elite table tennis | `sports-analytics` | 分析乒乓球逐板技术表现波动；原文：“Stroke Performance Fluctuation”。 |
| 14 | `geoauthor` | GeoAuthor: Linking Text and Visualization for Geographic Article Authoring | `visualization-design` | 同步创作地理文章中的文字与可视化；原文：“interactive creation of geographic articles”。 |
| 15 | `rulescope` | RuleScope: Semantic-aware Authoring of Data Validation Rules | `data-wrangling` | 生成、核验和修改数据验证规则；原文：“data validation rules”。 |
| 16 | `tmoe` | Dynamic TMoE: A Drift-Aware Dynamic Mixture of Experts Framework for Non-Stationary Time Series Forecasting | `time-series-analysis` | 针对非平稳时序中的分布漂移和预测；原文：“Non-stationary time series forecasting”。 |
| 17 | `StealthGraph` | StealthGraph: Exposing Domain-Specific Risks in LLMs through Knowledge-Graph-Guided Harmful Prompt Generation | `model-mechanisms` | 研究知识图谱引导的有害提示与LLM风险；原文：“Harmful Prompt Generation”。 |
| 18 | `collaborative-crowd-simulation` | Collaborative Small and Large Models for Crowd Simulation With Incomplete Trajectory Data | `urban-geospatial` | 基于不完整运动轨迹模拟人群行为；原文：“simulating natural and diverse crowd behaviors”。 |
| 19 | `custmatcher` | CustMatcher: Enhancing preference-driven people-to-people recommendation | `social-behavior` | 根据人的偏好和关系约束支持人员匹配；原文：“People-to-people recommendation”。 |
| 20 | `camouflagevis` | CamouflageVis: a visual analytics approach for discovering camouflaged malicious entities in e-commerce | `industrial-analytics` | 发现电商平台中的伪装恶意实体；原文：“camouflaged malicious entities”。 |
| 21 | `visualtsc` | A Visual Analytics Approach to Traffic Signal Control Optimization for Multiple Road Intersections | `urban-geospatial` | 优化城市多路口交通信号控制；原文：“multi-intersection traffic signal control”。 |
| 22 | `camh` | CAMH: Advancing Model Hijacking Attack in Machine Learning | `model-mechanisms` | 研究机器学习模型劫持攻击；原文：“model hijacking attacks”。 |
| 23 | `puzzlesorter` | PuzzleSorter: Certainty-Aware Visual Restoration of Multiple Cultural Artifacts | `cultural-heritage` | 分析并修复文化遗物碎片的错误拼接；原文：“cultural relic fragment restoration”。 |
| 24 | `t-foresight` | T-Foresight: Interpret moving strategies based on context-aware trajectory prediction | `sports-analytics` | 解释MOBA电竞玩家的移动策略及战术；原文：“player moving strategies”。 |
| 25 | `pvesight` | PVeSight: Dimensionality reduction-based anomaly detection and visual analysis of photovoltaic strings | `industrial-analytics` | 诊断光伏组串运行异常；原文：“PV string anomaly detection”。 |
| 26 | `multimodal-analysis-survey` | Empowering multimodal analysis with visualization: A survey | `multimodal-analytics` | 按数据模态梳理图像、文本、音频等数据的联合分析；原文：“from the perspective of data”。 |
| 27 | `painting-authentication` | Multi-Modal Visual Analytic Approach for Attributing and Authenticating Ancient Chinese Paintings | `cultural-heritage` | 支持古代中国绘画的归属判断与真伪鉴定；原文：“authenticating ancient Chinese paintings”。 |
| 28 | `eadetector` | Epidemic Amplifier Detection: Finding High-Risk Locations in COVID-19 Cases' Location Sequences via Multi-task Learning | `health-analytics` | 识别传染病传播的高风险地点；原文：“outbreak locations”。 |
| 29 | `TableNarrator` | TableNarrator: Making Image Tables Accessible to Blind and Low Vision People | `perception-interaction` | 改善盲人与低视力用户对图像表格的访问和阅读；原文：“Accessible to Blind and Low Vision People”。 |
| 30 | `geoanimation` | GeoAnimation: A Grammar for Animated Geographic Visualization | `visualization-design` | 提出地理动画的声明式创作语法；原文：“authoring common point, line, and region animations”。 |
| 31 | `codelin` | CodeLin: An in situ visualization method for understanding data transformation scripts | `data-wrangling` | 帮助理解数据转换代码的语义与数据血缘；原文：“understand data transformation scripts”。 |
| 32 | `dkpvva` | A Domain Knowledge-Driven Visual Analytics System for Photovoltaic Power Time Series Forecasting | `industrial-analytics` | 结合专家知识改进光伏发电预测；原文：“forecasting PV string power generation trends”。 |
| 33 | `icfinder` | Towards Better Illegal Chemical Facility Detection with Hazardous Chemicals Transportation Trajectories | `industrial-analytics` | 通过危险化学品运输行为查找非法生产设施；原文：“unregistered illegal chemical facilities”。 |
| 34 | `dstc` | A Deep Spatiotemporal Trajectory Representation Learning Framework for Clustering | `urban-geospatial` | 学习适用于地理轨迹聚类的时空表征；原文：“Spatiotemporal Trajectory Representation Learning”。 |
| 35 | `neighviz` | NeighViz: Towards Better Understanding of Neighborhood Effects on Social Groups with Spatial Data | `social-behavior` | 研究邻里环境对社会群体行为的影响；原文：“influence of neighborhood effects on human behaviors”。 |
| 36 | `GrandChallenges` | Grand Challenges in Visual Analytics Applications | `research-evaluation` | 讨论可视分析研究的价值、严谨性与研究议程；原文：“Grand Challenges in Visual Analytics Applications”。 |
| 37 | `ct3` | You are experienced: interactive tour planning with crowdsourcing tour data from web | `urban-geospatial` | 利用历史游览轨迹支持旅游路线规划；原文：“interactive approach for tour planning”。 |
| 38 | `industrial-survey` | A Review on Industrial Data Visual Analytics | `industrial-analytics` | 综述工业生产数据的可视分析；原文：“industrial data visual analytics”。 |
| 39 | `trajgram` | A Declarative Grammar for Interactive Trajectory Visualization: Interaction as First-Class Component | `visualization-design` | 提供轨迹可视化的声明式创作与交互语法；原文：“declarative grammar”。 |
| 40 | `rcinvestigator` | RCInvestigator: Towards Better Investigation of Anomaly Root Causes in Cloud Computing Systems | `industrial-analytics` | 支持云计算系统的运行异常根因调查；原文：“root cause investigation”。 |
| 41 | `keditvis` | KEditVis: A Visual Analytics System for Knowledge Editing of Large Language Models | `model-mechanisms` | 分析和改进语言模型参数层面的知识编辑；原文：“select appropriate layers as the editing target”。 |
| 42 | `trajectorycurer` | TrajectoryCurer: Visual Analysis of Trajectory Data Quality | `data-wrangling` | 识别并修复轨迹数据质量问题；原文：“trajectory data quality management”。 |
| 43 | `toa` | Visualizing Tree-of-Analysis: Facilitating Conversational Visual Analytics for Novices | `perception-interaction` | 通过交互分析树帮助新手理解线索、组织多轮分析过程；原文：“structures the CVA process as an interactive analysis tree”。 |
| 44 | `exchart` | Making Multimodal LLMs Reliable Chart Data Extractors: A Benchmark and Training Framework | `data-wrangling` | 从图表图像恢复表结构和数值数据；原文：“reverse-engineers data tables from chart images”。 |
| 45 | `cerebra` | Cerebra: Aligning Implicit Knowledge in Interactive SQL Authoring | `data-wrangling` | 通过隐含知识对齐支持SQL查询编写；原文：“interactive NL-to-SQL tool”。 |
| 46 | `tseditor` | TSEditor: Interactive Time Series Editing for Privacy Preservation | `data-wrangling` | 编辑待发布时序数据以保护隐私并保留效用；原文：“interactive editing system”。 |
| 47 | `noteflow` | NoteFlow: Leveraging Charts as Sight Glasses for Consistent and Continuous Data Flow Tracing | `data-wrangling` | 跟踪计算笔记本内的数据状态与变化过程；原文：“consistent and continuous tracing of data flow”。 |
| 48 | `CausalMap` | Causality-based Visual Analytics of Sentiment Contagion in Social Media Topics | `social-behavior` | 研究社交媒体主题间的情绪传播；原文：“Sentiment contagion”。 |
| 49 | `TableCanoniser` | TableCanoniser: Interactive Grammar-Powered Transformation of Messy, Non-Relational Tables to Canonical Tables | `data-wrangling` | 将杂乱非关系表转换成规范关系表；原文：“constructing relational tables from messy tabular inputs”。 |
| 50 | `InsightChaser` | InsightChaser: Enhancing Visual Reasoning of Sports Tactical Visualization with Visual-Text Linking | `sports-analytics` | 帮助理解足球战术洞见与图形之间的推理关系；原文：“tactical insights and soccer visualizations”。 |
| 51 | `ReSpark` | ReSpark: Leveraging Previous Data Reports as References to Generate New Reports with LLMs | `visualization-design` | 借助历史报告组织新数据报告的分析叙事；原文：“generating data reports”。 |
| 52 | `ViseGPT` | ViseGPT: Towards Better Alignment of LLM-generated Data Wrangling Scripts and User Prompts | `data-wrangling` | 核验数据整理脚本是否满足用户语义要求；原文：“data-wrangling scripts”。 |
| 53 | `SportsVideos` | From Sports Videos to Immersive Training: Augmenting Human Motion to Enrich Basketball Training Experience | `sports-analytics` | 将篮球动作视频转成沉浸训练体验；原文：“Basketball shooting”。 |
| 54 | `CAnnotator` | CAnnotator: Photo-Guided Color Annotation for Degraded Ancient Paintings | `cultural-heritage` | 为褪色古画标注有依据的修复颜色；原文：“color annotation of degraded ancient paintings”。 |
| 55 | `VisMimic` | VisMimic: Integrating Motion Chain in Feedback Video Generation for Motor Coaching | `sports-analytics` | 为运动教练制作结合动作链的反馈视频；原文：“feedback comprehension in motor learning”。 |
| 56 | `Reviving` | Reviving Static Charts Into Live Charts | `visualization-design` | 将静态图表生成带动画和讲解的动态演示；原文：“produce Live Charts from static ones”。 |
| 57 | `ChronoDeck` | ChronoDeck: A Visual Analytics Approach for Hierarchical Time Series Analysis | `time-series-analysis` | 提出跨领域层次时序数据的探索方法；原文：“hierarchical time series analysis”。 |
| 58 | `HYPNOS` | HYPNOS: Interactive Data Lineage Tracing for Data Transformation Scripts | `data-wrangling` | 交互回溯数据转换脚本的实例与模式血缘；原文：“interactive data lineage tracing”。 |
| 59 | `StructVizor` | StructVizor: Interactive profiling of semi-structured textual data | `data-wrangling` | 剖析并整理半结构化文本的数据结构；原文：“sensemaking and transformation of semi-structured textual data”。 |
| 60 | `ProTAL` | ProTAL: A Drag-and-Link Video Programming Framework for Temporal Action Localization | `data-wrangling` | 通过可编程事件与关系规则批量生成视频动作标签；原文：“generate action labels for large-scale unlabelled videos”。 |
| 61 | `Xavier` | Xavier: Toward Better Coding Assistance in Authoring Tabular Data Wrangling Scripts | `data-wrangling` | 利用数据上下文辅助编写表格整理脚本；原文：“data wrangling script authoring”。 |
| 62 | `RidgeBuilder` | RidgeBuilder: Interactive Authoring of Expressive Ridgeline Plots | `visualization-design` | 支持山脊图布局与样式的交互创作；原文：“creating expressive ridgeline plots”。 |
| 63 | `T3Set` | T3Set: A Multimodal Dataset with Targeted Suggestions for LLM-based Virtual Coach in Table Tennis Training | `sports-analytics` | 为乒乓球虚拟教练构建动作数据与指导建议；原文：“virtual coaches”。 |
| 64 | `AdversaFlow` | AdversaFlow: Visual Red Teaming for Large Language Models with Multi-Level Adversarial Flow | `model-mechanisms` | 用视觉红队分析LLM对抗攻击与鲁棒性；原文：“LLM security against adversarial attacks”。 |
| 65 | `Ferry` | Ferry: Toward Better Understanding of Input/Output Space for Data Wrangling Scripts | `data-wrangling` | 解释数据整理脚本允许的输入和输出范围；原文：“input and output space of wrangling scripts”。 |
| 66 | `TeamScouter` | Team-Scouter: Simulative Visual Analytics of Soccer Player Scouting | `sports-analytics` | 通过比赛模拟支持足球球员考察和引援；原文：“soccer player scouting”。 |
| 67 | `BloomWind` | Blowing Seeds Across Gardens: Visualizing Implicit Propagation of Cross-Platform Social Media Posts | `social-behavior` | 分析社交帖子在不同平台之间的传播；原文：“cross-platform information spread”。 |
| 68 | `SmartBoard` | Smartboard: Visual Exploration of Team Tactics with LLM Agent | `sports-analytics` | 支持篮球战术模拟、解释与设计；原文：“fine-grained tactical analysis”。 |
| 69 | `VisCourt` | VisCourt: In-Situ Guidance for Interactive Tactic Training in Mixed Reality | `sports-analytics` | 在混合现实中指导篮球战术训练；原文：“basketball training”。 |
| 70 | `loss` | Loss of Sonnet 18 | `cultural-heritage` | 通过数字艺术表现诗歌文字与意义的传播损耗；原文：“digital art installation”。 |
| 71 | `vistec` | ViSTec: Video Modeling for Sports Technique Recognition and Tactical Analysis | `sports-analytics` | 识别球拍运动技术动作并开展战术分析；原文：“Sports Technique recognition”。 |
| 72 | `SNIL` | SNIL: Generating Sports News From Insights With Large Language Models | `sports-analytics` | 围绕体育洞见生成面向记者和球迷的赛事报道；原文：“automatic creation of sports news”。 |
| 73 | `textlin` | Linking Text and Visualizations via Contextual Knowledge Graph | `visualization-design` | 建立可编辑的文本与图形链接以创作交互文档；原文：“builds links between text and visualization”。 |
| 74 | `chartgpt` | ChartGPT: Leveraging LLMs to Generate Charts From Abstract Natural Language | `visualization-design` | 将自然语言意图转换成可编辑图表；原文：“generating charts from abstract natural language inputs”。 |
| 75 | `relaq` | Relation-Driven Query of Multiple Time Series | `time-series-analysis` | 支持多时序间异质关系的交互查询；原文：“time series query via relation specifications”。 |
| 76 | `stringlineEva` | A Comparative Study on Fixed-order Event Sequence Visualizations: Gantt, Extended Gantt, and Stringline Charts | `perception-interaction` | 比较固定顺序事件序列图的感知与任务表现；原文：“evaluate the effectiveness of Gantt charts”。 |
| 77 | `TableIllustrator` | Table Illustrator: Puzzle-based interactive authoring of plain tables | `data-wrangling` | 支持表格构建、布局与样式编辑，按表格组织任务归类；原文：“rapid table construction”。 |
| 78 | `OptiMuse` | Understanding Nonlinear Collaboration between Human and AI Agents: A Co-design Framework for Creative Design | `perception-interaction` | 研究非线性共创中的交互组织及设计者的探索和反思；原文：“exploration and reflection processes of individual designers”。 |
| 79 | `VAID` | VAID: Indexing View Designs in Visual Analytics System | `visualization-design` | 建立设计索引，帮助设计者检索、理解与复用可视分析视图；原文：“understanding and retrieving professional designs”。 |
| 80 | `VolleyNaut` | VolleyNaut: Pioneering Immersive Training for Inclusive Sitting Volleyball Skill Development | `sports-analytics` | 通过沉浸式训练支持坐式排球技能学习；原文：“Sitting Volleyball Skill Development”。 |
| 81 | `JsonCurer` | JsonCurer: Data Quality Management for JSON Based on an Aggregated Schema | `data-wrangling` | 检测并修复JSON数据的质量问题；原文：“data quality management in the context of JSON data”。 |
| 82 | `TacPrint` | TacPrint: Visualizing the Biomechanical Fingerprint in Table Tennis | `sports-analytics` | 根据动作传感数据分析乒乓球生物力学特征；原文：“biomechanical fingerprint for each player”。 |
| 83 | `NL2R` | Interactive Table Synthesis with Natural Language | `data-wrangling` | 以自然语言将半结构化文本转换成表格；原文：“synthesizing and improving tables from semi-structured text”。 |
| 84 | `ArEnhanced` | AR-Enhanced Workouts: Exploring Visual Cues for At-Home Workout Videos in AR Environment | `sports-analytics` | 用AR视觉提示改善居家健身动作理解与反馈；原文：“At-Home Workout Videos”。 |
| 85 | `PColorizor` | PColorizor: Re-coloring Ancient Chinese Paintings with Ideorealm-congruent Poems | `cultural-heritage` | 结合诗画意境恢复古画颜色；原文：“Color restoration of ancient Chinese paintings”。 |
| 86 | `island-of-loneliness` | Posts with No Response: The Island of Loneliness | `cultural-heritage` | 用数据艺术装置表现无人回应的孤独帖子；原文：“superimposing digital charts on physical models”。 |
| 87 | `GeoChron` | Visualizing Large-Scale Spatial Time Series with GeoChron | `urban-geospatial` | 表达地理时序的空间演变模式；原文：“geo-referred time series”。 |
| 88 | `Questionnaire` | Causality-Based Visual Analysis of Questionnaire Responses | `causal-analysis` | 提供问卷数据因果探索的通用分析方法；原文：“explore questionnaire data and derive causality”。 |
| 89 | `ActionEvaluator` | Action-Evaluator: A Visualization Approach for Player Action Evaluation in Soccer | `sports-analytics` | 结合比赛情境评价足球球员动作；原文：“soccer player actions”。 |
| 90 | `MediVizor` | MediVizor: Visual Mediation Analysis of Nominal Variables | `causal-analysis` | 支持名义变量的通用中介因果分析；原文：“mediation analysis of nominal variables”。 |
| 91 | `OBTracker` | OBTracker: Visual Analytics of Off-ball Movements in Basketball | `sports-analytics` | 分析篮球无球跑动对进攻的贡献；原文：“off-ball movement patterns”。 |
| 92 | `GeoNetverse` | Multilevel Visual Analysis of Aggregate Geo-Networks | `urban-geospatial` | 支持地理网络的多层汇总与比较；原文：“directed geospatial networks”。 |
| 93 | `CompositeVisualization` | Revisiting the Design Patterns of Composite Visualizations | `visualization-design` | 归纳视图组合的设计空间与模式，支持可视化设计复用；原文：“design patterns of composite visualization”。 |
| 94 | `ECoalVis` | ECoalVis: Visual Analysis of Control Strategies in Coal-fired Power Plants | `industrial-analytics` | 分析燃煤电厂控制策略及发电效率；原文：“control strategies of coal-fired power plants”。 |
| 95 | `TacTrainer` | Tac-Trainer: A Visual Analytics System for IoT-based Racket Sports Training | `sports-analytics` | 整合物联网动作数据和教练知识支持球拍运动训练；原文：“racket sports training”。 |
| 96 | `MetaGlyph` | MetaGlyph: Automatic Generation of Metaphoric Glyph-based Visualization | `visualization-design` | 从表格自动生成可定制的隐喻图符；原文：“generating MGVs from a spreadsheet”。 |
| 97 | `DashBot` | DashBot: Insight-Driven Dashboard Generation Based on Deep Reinforcement Learning | `visualization-design` | 以强化学习辅助生成多图分析仪表板；原文：“generate analytical dashboards”。 |
| 98 | `Rasipam` | RASIPAM: Interactive Pattern Mining of Multivariate Event Sequences in Racket Sports | `sports-analytics` | 把专家知识纳入球拍运动战术模式挖掘；原文：“discover meaningful tactics interactively”。 |
| 99 | `COMANTICS` | Revealing the Semantics of Data Wrangling Scripts With COMANTICS | `data-wrangling` | 自动识别数据整理脚本的转换类型和参数；原文：“semantics of data transformation scripts”。 |
| 100 | `PuzzleFixer` | PuzzleFixer: A Visual Reassembly System for Immersive Fragments Restoration | `cultural-heritage` | 在沉浸环境中修复文物等破损物体的拼接结果；原文：“real-world artifacts”。 |
| 101 | `Rigel` | Rigel: Transforming Tabular Data by Declarative Mapping | `data-wrangling` | 用声明式映射完成表格数据转换；原文：“rapid transformation of tabular data”。 |
| 102 | `Sporthesia` | Sporthesia: Augmenting Sports Videos Using Natural Language | `sports-analytics` | 依据赛事解说制作带可视化的体育视频；原文：“augmented sports videos”。 |
| 103 | `TeamBuilder` | Team-Builder: Toward More Effective Lineup Selection in Soccer | `sports-analytics` | 支持足球阵容生成、解释与比较；原文：“soccer lineup selection”。 |
| 104 | `ReVast` | In Defence of Visual Analytics Systems: Replies to Critics | `research-evaluation` | 分析可视分析系统研究的批评、贡献与严谨性；原文：“scientific values and rigor of VA systems”。 |
| 105 | `urbanva` | A survey of urban visual analytics: advances and future directions | `urban-geospatial` | 综述城市问题中的可视分析方法与应用；原文：“urban visual analytics studies”。 |
| 106 | `VisImages` | VisImages: A Fine-Grained Expert-Annotated Visualization Dataset | `visualization-design` | 整理可视化图像与标注，支持设计模式分析和自动化设计任务；原文：“literature analysis and automated tasks for visualization”。 |
| 107 | `Somnus` | Visualizing the Scripts of Data Wrangling with SOMNUS | `data-wrangling` | 用图符和来源图解释数据整理脚本；原文：“semantics of code pieces in the context of data transformation”。 |
| 108 | `SimuExplorer` | SimuExplorer: Visual Exploration of Game Simulation in Table Tennis | `sports-analytics` | 模拟并分析乒乓球行为对得分率的影响；原文：“player behaviors impact scoring rates”。 |
| 109 | `Compass` | Compass: Towards Better Causal Analysis of Urban Time Series | `urban-geospatial` | 分析城市环境与交通时序的动态因果关系；原文：“dynamic causality in urban time series”。 |
| 110 | `OrderMonitor` | A Visualization Approach for Monitoring Order Processing in E-Commerce Warehouse | `industrial-analytics` | 监测和改进电商仓库订单处理效率；原文：“order processing efficiency”。 |
| 111 | `TIVEE` | TIVEE: Visual Exploration and Explanation of Badminton Tactics in Immersive Visualizations | `sports-analytics` | 利用沉浸视角探索和解释羽毛球战术；原文：“tactic analysis of badminton”。 |
| 112 | `HVSM` | Real-Time Visual Analysis of High-Volume Social Media Posts | `social-behavior` | 实时聚类并监测大量社交媒体帖子；原文：“streaming social media data”。 |
| 113 | `GlyphCreator` | GlyphCreator: Towards Example-based Automatic Generation of Circular Glyphs | `visualization-design` | 基于样例生成和编辑圆形图符；原文：“example-based generation of circular glyphs”。 |
| 114 | `VideoModerator` | VideoModerator: A Risk-aware Framework for Multimodal Video Moderation in E-Commerce | `industrial-analytics` | 支持电商直播平台审核违规多模态内容；原文：“video moderation”。 |
| 115 | `AcademicCareerSuccess` | Seek for Success: A Visualization Approach for Understanding the Dynamics of Academic Careers | `social-behavior` | 分析个体与社会因素对学术生涯成功的影响；原文：“individual and social factors”。 |
| 116 | `VisCommentator` | Augmenting Sports Videos with VisCommentator | `sports-analytics` | 帮助体育分析师快速制作带图形注释的赛事视频；原文：“augmented sports videos”。 |
| 117 | `TacticFlow` | TacticFlow: Visual Analytics of Ever-Changing Tactics in Racket Sports | `sports-analytics` | 分析球拍运动战术随比赛过程的变化；原文：“ever-changing tactic progression”。 |
| 118 | `Nebula` | Nebula: A Coordinating Grammar of Graphics | `visualization-design` | 用自然语言语法配置多视图之间的交互协调；原文：“a grammar based on natural language”。 |
| 119 | `Tac-Valuer` | Tac-Valuer: Knowledge-based Stroke Evaluation in Table Tennis | `sports-analytics` | 结合乒乓球专家知识评价逐板表现；原文：“automatic stroke evaluation”。 |
| 120 | `CareerLens` | Interactive Visual Exploration of Longitudinal Historical Career Mobility Data | `social-behavior` | 从历史官员职业轨迹研究社会流动与不平等；原文：“social mobility and inequality”。 |
| 121 | `VisCas` | Visual Cascade Analytics of Large-scale Spatiotemporal Data | `urban-geospatial` | 推断交通和污染等城市事件的时空级联传播；原文：“cascading patterns in the spatiotemporal context”。 |
| 122 | `Tac-Miner` | Tac-Miner: Visual Tactic Mining for Multiple Table Tennis Matches | `sports-analytics` | 挖掘并比较多场乒乓球比赛的战术；原文：“tactics of multiple matches”。 |
| 123 | `EventAnchor` | EventAnchor: Reducing Human Interactions in Event Annotation of Racket Sports Videos | `sports-analytics` | 通过人机交互获取球拍运动视频的比赛事件标注；原文：“annotation of racket sports video”。 |
| 124 | `PlotThread` | PlotThread: Creating Expressive Storyline Visualizations using Reinforcement Learning | `visualization-design` | 以交互和强化学习生成可定制故事线布局；原文：“customization of storylinevisualizations”。 |
| 125 | `BusNet` | Towards Better Bus Networks: A Visual Analytics Approach | `urban-geospatial` | 诊断既有公交网络并规划改进路线；原文：“incremental planning ofbus routes”。 |
| 126 | `PassVizor` | PassVizor: Toward Better Understanding of the Dynamics of Soccer Passes | `sports-analytics` | 解释足球传球战术随比赛过程的动态变化；原文：“passing dynamics”。 |
| 127 | `ShuttleSpace` | ShuttleSpace: Exploring and Analyzing Movement Trajectory in Immersive Visualization | `sports-analytics` | 以第一人称沉浸视角分析羽毛球轨迹；原文：“trajectory data in badminton”。 |
| 128 | `Fine-tuning Layout` | Exemplar-based Layout Fine-tuning for Node-link Diagrams | `visualization-design` | 以局部示例交互调整整张节点链接图的布局；原文：“exemplar-based adjustment”。 |
| 129 | `CausalExplorer` | A Visual Analytics Approach for Exploratory Causal Analysis: Exploration, Validation, and Applications | `causal-analysis` | 提供跨领域因果探索、验证及行动推演方法；原文：“explore, validate, and apply causal relations”。 |
| 130 | `Data-GIF` | What Makes a Data-GIF Understandable? | `perception-interaction` | 实证研究数据GIF的设计因素如何影响理解；原文：“What makes a data-GIF understandable?”。 |
| 131 | `ESRac` | Visual Analytics of Multivariate Event Sequence Data in Racquet Sports | `sports-analytics` | 分析球拍运动多变量击球序列中的战术；原文：“tactic analysis”。 |
| 132 | `TransVideo` | Narrative Transitions in Data Videos | `visualization-design` | 归纳数据视频叙事衔接的设计方式；原文：“transition designs in data videos”。 |
| 133 | `CorVizor` | Towards Better Detection and Analysis of Massive Spatiotemporal Co-Occurrence Patterns | `urban-geospatial` | 挖掘并解释城市异质数据中的时空共现模式；原文：“spatiotemporal co-occurrence patterns”。 |
| 134 | `Route Planning` | Pareto-Optimal Transit Route Planning with Multi-Objective Monte-Carlo Tree Search | `urban-geospatial` | 搜索满足多目标的公交出行路线；原文：“pareto-optimal transit routes”。 |
| 135 | `Resource Allocation` | Dynamic Public Resource Allocation based on Human Mobility Prediction | `urban-geospatial` | 依据人群移动预测调度公共设施与资源；原文：“dynamic public resource allocation”。 |
| 136 | `Efficient Path Query` | Efficient Path Query Processing over Massive Trajectories on the Cloud | `urban-geospatial` | 面向大规模交通轨迹实现云端路径查询；原文：“path query processing”。 |
| 137 | `Three Geo-based Features` | A User Study on the Capability of Three Geo-based Features in Analyzing and Locating Trajectories | `urban-geospatial` | 评价轨迹地理背景的信息效用与位置隐私暴露；原文：“location privacy and analysis effectiveness”。 |
| 138 | `AirVis` | AirVis: Visual Analytics of Air Pollution Propagation | `urban-geospatial` | 分析跨区域空气污染传播路径与不确定性；原文：“propagation patterns of air pollution”。 |
| 139 | `Tac-Simur` | Tac-Simur: Tactic-based Simulative Visual Analytics of Table Tennis | `sports-analytics` | 以战术级模拟支持乒乓球前瞻分析；原文：“simulative visual analytics”。 |
| 140 | `VA in MMORPGs` | BeXplorer: Visual analytics of dynamic interplay between communication and purchase behaviors in MMORPGs | `social-behavior` | 研究在线游戏中交流与购买行为的社会影响；原文：“purchase and communication behaviors”。 |
| 141 | `MARVisT` | MARVisT: Authoring Glyph-based Visualization in Mobile Augmented Reality | `visualization-design` | 支持在移动AR环境中绑定数据和创作图符；原文：“AR glyph-based visualization authoring”。 |
| 142 | `ForVizor` | ForVizor: Visualizing Spatio-Temporal Team Formations in Soccer | `sports-analytics` | 分析足球阵型及队员位置的时空变化；原文：“formation analysis in soccer”。 |
| 143 | `SRVis` | SRVis: Towards Better Spatial Integration in Ranking Visualization | `urban-geospatial` | 结合地理背景支持空间候选位置的排序与选址；原文：“spatial multi-criteria decision-making”。 |
| 144 | `iStoryline` | iStoryline: Effective Convergence to Hand-drawn Storylines | `visualization-design` | 通过交互调整生成接近手绘意图的故事线；原文：“an authoring tool”。 |
| 145 | `ImgVis` | A Semantic-based Method for Visualizing Large Image Collections | `multimodal-analytics` | 将图像与文本语义联合投影，支持图像集合的交互探索；原文：“project images and the associated semantic keywords to the same 2D space”。 |
| 146 | `StreamExplorer` | StreamExplorer: A Multi-Stage System for Visually Exploring Events in Social Streams | `social-behavior` | 支持社交信息流事件的多层探索与跟踪；原文：“Analyzing social streams”。 |
| 147 | `AbstractScatterplot` | Cluster-based Visual Abstraction for Multivariate Scatterplots | `visualization-design` | 通过视觉抽象与图符编码改善多变量散点图的表达；原文：“a suite of glyphs is designed to visualize the data at different levels of detail”。 |
| 148 | `iTTVis` | iTTVis: Interactive Visualization of Table Tennis Data | `sports-analytics` | 从时间、统计与战术角度分析乒乓球比赛；原文：“analysis of table tennis data”。 |
| 149 | `ViewpointSelection` | Similarity Voting based Viewpoint Selection for Volumes | `visualization-design` | 依据专家视点偏好自动生成具有代表性的体绘制视图；原文：“choose representative viewpoints for volumes with similar features”。 |
| 150 | `SocialMediaSurvey` | A Survey on Visual Analytics of Social Media Data | `social-behavior` | 综述社交媒体信息及用户行为的可视分析；原文：“understanding user behaviors”。 |
| 151 | `K-Location` | Mining the Most Influential k-Location Set from Massive Trajectories | `urban-geospatial` | 从大规模轨迹中挖掘覆盖最多人的位置集合；原文：“influential location set”。 |
| 152 | `Doughnut` | A Study of the Effect of Doughnut Chart Parameters on Proportion Estimation Accuracy | `perception-interaction` | 实证评价环形图参数对比例估计精度的影响；原文：“accuracy of such charts for proportion estimates”。 |
| 153 | `HomeFinder` | HomeFinder Revisited: Finding Ideal Homes with Reachability-Centric Multi-Criteria Decision Making | `urban-geospatial` | 结合可达性与多准则偏好支持住房位置选择；原文：“reachability”。 |
| 154 | `SocialWave` | SocialWave: Visual Analysis of Spatio-temporal Diffusion of Information on Social Media | `social-behavior` | 研究社交媒体信息传播中的空间群体互动；原文：“information diffusion”。 |
| 155 | `ArVis` | Exploring the design space of immersive urban analytics | `urban-geospatial` | 研究适用于城市分析的沉浸式二维与三维视图组合；原文：“immersive urban analytics”。 |
| 156 | `pathquery` | Querying Massive Trajectories by Path on the Cloud | `urban-geospatial` | 在云端索引和查询大规模道路轨迹；原文：“cloud-based path query processing framework”。 |
| 157 | `IntR` | Examining the effects of network externalities, density, and closure on in-game currency price in online games | `social-behavior` | 研究游戏社会网络结构与虚拟货币价格的关系；原文：“players’ behavioral interaction”。 |
| 158 | `SmartAdP` | SmartAdP: Visual Analytics of Large-scale Taxi Trajectories for Selecting Billboard Locations | `urban-geospatial` | 利用城市出行轨迹支持广告牌等设施选址；原文：“billboard placements”。 |
| 159 | `RouteMaps` | Embedding Spatio-temporal Information into Maps by Route-Zooming | `urban-geospatial` | 通过道路变形在地图内嵌入时空信息；原文：“route-zooming”。 |
| 160 | `PieceStack` | PieceStack: Toward Better Understanding of Stacked Graphs | `time-series-analysis` | 通过拆分和重组理解堆叠图的总体与局部趋势；原文：“splitting and re-constructing the stacked graphs”。 |
| 161 | `PeakVizor` | PeakVizor: Visual Analytics of Peaks in Video Clickstreams from Massive Open Online Courses | `social-behavior` | 从慕课点击流研究学习者行为与群体差异；原文：“online learning behaviors”。 |
| 162 | `Follower-followee` | Follower-Followee Network, Communication Networks, and Vote Agreement of the U.S. Members of Congress | `social-behavior` | 研究议员社交网络、交流与投票一致性；原文：“vote agreement”。 |
| 163 | `visarena` | VisArena: A testbed for visualization with synthetic data tables | `research-evaluation` | 生成受约束合成数据以评估可视化技术；原文：“visualization evaluation”。 |
| 164 | `hoopscouter` | HoopScouter: Visual Analytics of Ball Handlers’ Decisions in Basketball Games | `sports-analytics` | 分析篮球持球者在比赛情境中的决策；原文：“ball handlers’ decisions”。 |
| 165 | `arteyer` | ArtEyer: Enriching GPT-based agents with contextual data visualizations for fine art authentication | `cultural-heritage` | 通过上下文可视化帮助艺术品鉴定与归属判断；原文：“Fine art authentication”。 |
| 166 | `graphgesture` | Audio-visual training and feedback to learn touch-based gestures | `perception-interaction` | 评价视觉和声音反馈如何帮助学习可视化交互手势；原文：“interactive visualization tools”。 |
| 167 | `nuwa` | Nuwa: An Authoring Tool for Graph Visualizations | `visualization-design` | 通过声明式工具创作与调整图可视化；原文：“authoring tool”。 |
| 168 | `subplay` | SUB-PLAY: Adversarial Policies against Partially Observed Multi-Agent Reinforcement Learning Systems | `model-mechanisms` | 研究部分观测条件下针对多智能体强化学习的攻击；原文：“adversarial policies”。 |
| 169 | `visualinsights` | An intelligent approach to automatically discovering visual insights | `visualization-design` | 自动生成图表重点标注与文字说明来传达洞见；原文：“generate corresponding text descriptions”。 |
| 170 | `visaudio` | Exploring Effective Relationships Between Visual-Audio Channels in Data Visualization | `perception-interaction` | 实证评价视觉与听觉通道的映射效果；原文：“effectiveness of audio channels”。 |
| 171 | `notable` | Notable: On-the-fly Assistant for Data Storytelling in Computational Notebooks | `visualization-design` | 帮助在计算笔记本中整理和讲述数据发现；原文：“data storytelling in computational notebooks”。 |
| 172 | `tac-anticipator` | Tac-Anticipator: Visual Analytics of Anticipation Behaviors in Table Tennis Matches | `sports-analytics` | 分析真实乒乓球比赛中的预判行为；原文：“anticipation behaviors in real matches”。 |
| 173 | `sportsxr` | The Ball is in Our Court: Conducting Visualization Research With Sports Experts | `sports-analytics` | 总结与体育专家共同开展沉浸可视化研究的方法；原文：“visualization research in SportsXR”。 |
| 174 | `rallycomparator` | RallyComparator: visual comparison of the multivariate and spatial stroke sequence in table tennis rally | `sports-analytics` | 比较乒乓球回合中的技术动作与空间序列；原文：“comparative analysis of stroke sequence patterns”。 |
| 175 | `smartshots` | SmartShots: An Optimization Approach for Generating Videos with Data Visualizations Embedded | `visualization-design` | 通过布局和剪辑优化生成嵌入可视化的视频；原文：“automatic integration of in-video visualizations”。 |
| 176 | `scatterplot-comprehension` | What makes a scatterplot hard to comprehend: data size and pattern salience matter | `perception-interaction` | 实证分析数据量和模式显著性对散点图理解的影响；原文：“comprehension of scatterplot”。 |
| 177 | `scrollytelling` | Automatic Generation of Unit Visualization-based Scrollytelling for Impromptu Data Facts Delivery | `visualization-design` | 自动组织数据事实并生成滚动叙事；原文：“generate expressive scrollytelling visualization”。 |
| 178 | `dancingwords` | DancingWords: exploring animated word clouds to tell stories | `visualization-design` | 通过动画词云的交互与布局表达故事；原文：“generate animated word clouds”。 |
| 179 | `ecolens` | EcoLens: visual analysis of ecological regions in urban contexts using traffic data | `urban-geospatial` | 利用交通活动分析城市潜在功能区域的时空变化；原文：“dynamic segmentation patterns of a city”。 |
| 180 | `interaction-survey` | Examining interaction techniques in data visualization authoring tools from the perspective of goals and human cognition: a survey | `visualization-design` | 按任务目标与认知过程综述可视化创作工具的交互；原文：“interaction techniques of visualization authoring tools”。 |
| 181 | `mig-viewer` | MIG-Viewer: Visual analytics of soccer player migration | `sports-analytics` | 分析足球球员跨国迁移与国家队表现的关系；原文：“soccer player migration”。 |
| 182 | `shortvideo-guidelines` | Design guidelines for augmenting short-form videos using animated data visualizations | `visualization-design` | 制定并验证在短视频中添加数据可视化的设计指南；原文：“augmenting short-form videos with data visualizations”。 |
| 183 | `smartshots-demo` | SmartShots: Enabling Automatic Generation of Videos with Data Visualizations Embedded | `visualization-design` | 展示自动视频创作与嵌入式图表后编辑流程；原文：“video with data visualizations embedded”。 |
| 184 | `uncertainty-streaming` | Toward the better modeling and visualization of uncertainty for streaming data | `time-series-analysis` | 刻画、减少并呈现流数据采样的不确定性；原文：“uncertainty that arises from sampling streaming data”。 |
| 185 | `rankbrushers` | RankBrushers: interactive analysis of temporal ranking ensembles | `time-series-analysis` | 支持时变多变量排名集合的比较与不确定性分析；原文：“temporal ranking ensembles”。 |
| 186 | `steering-data-quality` | Steering data quality with visual analytics: The complexity challenge | `data-wrangling` | 归纳不同数据类型的清洗方法与交互质量管理框架；原文：“interactively cleansing data”。 |
| 187 | `egocomp` | egoComp: A node-link-based technique for visual comparison of ego-networks | `graph-analytics` | 提出用于比较两个自我中心网络节点差异的图布局；原文：“node difference between two ego-networks”。 |
| 188 | `gamelifevis` | GameLifeVis: visual analysis of behavior evolutions in multiplayer online games | `social-behavior` | 分析多人在线游戏中的玩家生命周期与行为演变；原文：“evolving behavior of massive game players”。 |
| 189 | `tievis` | TieVis: visual analytics of evolution of interpersonal ties | `social-behavior` | 分析社会网络中人际关系强弱的动态演化；原文：“evolution of interpersonal ties”。 |
| 190 | `unmat` | UNMAT: Visual comparison and exploration of uncertainty in large graph sampling | `graph-analytics` | 比较图采样方法带来的不确定性及后续分析影响；原文：“uncertainty in graph sampling”。 |
| 191 | `visual-voting` | A visual voting framework for weather forecast calibration | `urban-geospatial` | 帮助气象专家校准集合天气预报的系统偏差；原文：“weather forecast calibration”。 |
| 192 | `tt-performance-optimization` | The performance optimization model of adjusting technical and tactical decisions with ideal usages for elite female table tennis players | `sports-analytics` | 优化乒乓球技术和战术行为的使用策略；原文：“technical and tactical behaviors”。 |
| 193 | `eeg-ictal-mtle` | EEG signature orchestrating expression of ictal behavior in mesial temporal lobe epilepsy | `health-analytics` | 利用脑电分析癫痫临床发作行为的机制；原文：“ictal behavior”。 |
| 194 | `intelligent-cad-2` | Intelligent CAD 2.0 | `industrial-analytics` | 讨论人工智能在工程CAD设计流程中的角色与框架；原文：“engineering design process”。 |
| 195 | `eeg-va-epilepsy` | An Electroencephalogram Visual Analytics Approach for Epilepsy | `health-analytics` | 以脑电分类和可视分析支持癫痫诊断；原文：“epilepsy diagnosis”。 |
| 196 | `changevis` | Visualizing the Semantics of Data Wrangling Scripts | `data-wrangling` | 解释数据整理脚本中的表结构、列和单元格变化；原文：“semantics of data wrangling scripts”。 |
| 197 | `pre-ictal-fc-mtle` | Pre-ictal fluctuation of EEG functional connectivity discriminates seizure phenotypes in mesial temporal lobe epilepsy | `health-analytics` | 通过发作前脑电连接波动区分癫痫发作表型；原文：“seizure phenotypes”。 |
| 198 | `ictal-eeg-lvfa` | Ictal EEG desynchronization during low-voltage fast activity for prediction of surgical outcomes in focal epilepsy | `health-analytics` | 研究脑电连接变化与癫痫手术结局的关系；原文：“epilepsy surgical outcomes”。 |
| 199 | `mindfulness-book-of-songs` | Explore Mindfulness Without Deflection: A Data Art Based On The Book Of Songs | `cultural-heritage` | 以诗经意象、情感和文化联系构建数据艺术；原文：“Book of Songs”。 |
| 200 | `immersive-visualization-survey` | A Survey on Immersive Visualization | `perception-interaction` | 综述沉浸式可视化的感知、交互及评估方法；原文：“Immersive visualization”。 |
| 201 | `dynamic-graphs-evolution` | Understanding Evolution Patterns in Multiple Sequences of Dynamic Graphs | `graph-analytics` | 提出跨应用动态图序列演化模式的分析方法；原文：“evolution patterns in multiple sequences of dynamic graphs”。 |
| 202 | `public-attention-emotion-twitter` | Interplay between Public Attention and Public Emotion toward Multiple Social Issues on Twitter | `social-behavior` | 研究公众对多类社会议题的关注与情绪互动；原文：“public attention and public emotion”。 |
| 203 | `immersive-urban-analytics-exploded-views` | Immersive urban analytics through exploded views | `urban-geospatial` | 通过分解视图处理城市三维环境中的分析与遮挡；原文：“Immersive urban analytics”。 |
