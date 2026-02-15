# cleanOrz2

```bash
# 1. 删除 Orz2 技能目录（本地安装的那份）
rm -rf ~/.openclaw/skills/orz2

# 2. 删除独立 credentials（若你用的是 ~/.config/orz2）
rm -rf ~/.config/orz2

# 3. 删除工作区内 Orz2 心跳状态（仅 lastOrz2Check 或整文件）
# 若 heartbeat-state.json 只给 Orz2 用，可直接删文件：
rm -f ~/.openclaw/workspace/memory/heartbeat-state.json
```

```bash
编辑 ~/.openclaw/openclaw.json，在 skills.entries 里删掉 orz2 整项（或至少 orz2.apiKey）。

```

```bash
编辑 ~/.openclaw/workspace/HEARTBEAT.md，删掉 Orz2 那一段（或删掉整个文件如果不再需要）。
```

查看是否存在 ORZ2_IDENTITY_TOKEN 环境变量

```bash
echo $ORZ2_IDENTITY_TOKEN
```

要确认「当前进程能看到的」所有相关环境变量

```bash
env | grep ORZ2
# 或者
printenv ORZ2_IDENTITY_TOKEN
```

在终端里搜索是哪一行在设置它：

```
grep -n ORZ2_IDENTITY_TOKEN ~/.zshrc ~/.zprofile ~/.zshenv 2>/dev/null
```

会列出包含 ORZ2_IDENTITY_TOKEN 的文件和行号。用编辑器打开对应文件，删掉或注释掉那一行，例如：
删掉：export ORZ2_IDENTITY_TOKEN="otkn_xxx..."
或注释：# export ORZ2_IDENTITY_TOKEN="otkn_xxx..."
改完后重新打开终端，或执行：

```
# 若你改的是 .zshrc
source ~/.zshrc
```

最后检查一下

```bash
echo $ORZ2_IDENTITY_TOKEN
```
