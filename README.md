# 摘星星

## 流程讲解

1. 框架在场景启动后调用当前 Bundle 的管理器生命周期函数，也就是 `assets\Main\Bundle\MainBundle.ts` 脚本中的 `open`

1. `MainBundle.open` 添加 `MainMain` 视图脚本并驱动它的生命周期运行

1. `MainMain` 内切换到 `Game` Bundle 下的 `Game` 场景

1. 由于切换到不同 Bundle 内的场景，`GameBundle` 生命周期执行，`GameBundle.open` 被调用

1. `GameBundle.open` 添加 `GameGame` 视图脚本并驱动它的生命周期运行

1. `GameGame.open` 加载玩家、星星开始游戏
