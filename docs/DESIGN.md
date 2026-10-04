# 个人创作桌

色彩：纸张白 #f9faf8、墨黑 #26323b、钴蓝 #2d55e7、橘色 #ef7348、便签黄 #f2d562、淡紫 #dcd7ef。字体：中文正文使用可读的本地无衬线，作品标题配 Georgia 的少量衬线英文字。内容靠左，首页是错落排布的创作桌，作品页采用展览式留白，阅读页控制行宽。

主视觉记忆点是带有作品预览和手写批注的私人创作板。导航保持清晰，不把所有区块都做成同样的卡片。示例项目显式标注，不虚构本人的履历或访问数据。

指导来源：https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md （读取基线 a5333457c414d20d625f307df945842c0952ecc3）。动画指导：https://github.com/emilkowalski/skills/blob/main/skills/animate/SKILL.md （7c3b20c6ed681b2d47c9ca9e3ee0e659ed47d032）及 RECIPES.md。

动画服务于反馈和状态变化：按钮 160ms，筛选/展开 200ms，主要使用 transform/opacity；ease-out 使用 cubic-bezier(.23,1,.32,1)。尊重 reduced-motion 与触摸设备，保持原生滚动。
