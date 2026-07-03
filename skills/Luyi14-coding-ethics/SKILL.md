---
name: "Luyi14-coding-ethics"
description: "编程八荣八耻行为准则。强制要求：不瞎猜接口、不模糊执行、不臆想业务、不创造接口、不跳过验证、不破坏架构、不假装理解、不盲目修改。在所有编码任务中均应遵守。Invoke when writing, reviewing, or modifying any code."
---

# 编程八荣八耻

本规范源自大量软件工程实践中的血泪教训。**每一条"耻"背后都有一个真实的 Bug 或线上事故隐患。**

---

## 第一荣：模块导出清晰完整
## 第一耻：写完类不导出，留着过年

**后果**：外部 `from services import SomeClass` → `ImportError`，调用方只能绕开 `__init__.py` 直接导入，架构退化。

**典型场景**：
- 新增的公开类/函数未在 `__init__.py` 注册
- 多个模块各自独立定义 ORM Base

**正确做法**：
```python
# services/__init__.py — 每一个公开类/函数都必须在此注册
from .engine import Engine, Parser, Calculator
__all__ = ["Engine", "Parser", "Calculator"]
```

> **规则**：每新增一个模块公开类/函数，**同步**在 `__init__.py` 中添加导出。

---

## 第二荣：异常处理全覆盖
## 第二耻：异常直抛不降级，commit 失败不回滚

**后果**：`db.commit()` 抛异常 → 事务不回滚 → 数据库不一致 → 后续操作雪崩。

**典型场景**：数据操作只有 `finally: db.close()`，无 `rollback`。

**正确做法**（铁律模板）：
```python
def db_operation():
    db = SessionLocal()
    try:
        db.commit()
    except Exception:
        db.rollback()       # ← 必须！
        raise               # ← 向上传播
    finally:
        db.close()          # ← 必须！
```

**降级模板**（对外服务接口）：
```python
def service_method():
    try:
        return store.get_data(key)
    except OperationalError:
        return default_value  # ← 降级继续服务
```

> **规则**：所有数据库操作必须有 `rollback`。所有对外接口必须有降级路径。

---

## 第三荣：配置管理用最佳实践
## 第三耻：轮子不用原生，手动重复造

**后果**：手写 `load_dotenv()` + `os.getenv()` 与框架的 `BaseSettings` 功能重叠，配置读取时机不可控。

**错误 vs 正确**：
```python
# ❌ 冗余
load_dotenv()
class Settings(BaseSettings):
    api_key: str = os.getenv("API_KEY", "")

# ✅ 版本
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env")
    api_key: str = ""
```

---

## 第四荣：数据库操作可移植
## 第四耻：数据库专有参数硬编码

```python
# ❌ 硬编码 SQLite 参数
engine = create_engine(url, connect_args={"check_same_thread": False})

# ✅ 根据 db_url 动态决定
extra = {}
if "sqlite" in config.db_url:
    extra["connect_args"] = {"check_same_thread": False}
engine = create_engine(config.db_url, **extra)
```

---

## 第五荣：类型声明完整清晰
## 第五耻：字典满天飞，TypedDict 不用

**规则**：返回值是 dict 且结构固定 → 必须定义 TypedDict。Pydantic Field 必须加 `description`。

---

## 第六荣：应用生命周期规范
## 第六耻：模块导入时执行副作用

**规则**：`init_db()` 等副作用必须放在 `lifespan` 中，禁止模块级执行。

---

## 第七荣：测试即文档
## 第七耻：写完代码不补测试，旧测试不同步

---

## 第八荣：API 调用走封装层
## 第八耻：绕过封装层直接调 SDK

---

## 第九荣：日志全面覆盖
## 第九耻：except 静默吞异常，线上问题查不到

**后果**：`except Exception: pass` → 异常全部静默 → 用户看到错误提示但无日志可查。

**正确做法**：
```python
# ❌ 静默吞异常
except Exception:
    pass

# ✅ 每条 except 都必须写日志
except Exception as e:
    logging.warning(f"[降级] 操作失败: {e}")
```

> **规则**：零容忍 `except Exception: pass`。每处 except 必须有日志。

---

## 第十荣：API 调用多级降级
## 第十耻：死绑一种 API 模式，兼容性为零

**后果**：死绑单一 API 模式 → 不同协议/中转站/代理全部失败。

**正确做法**（三级 fallback 架构）：
```python
# Level 1: 标准模式
try:
    resp = await client.call(mode="standard", ...)
    return resp
except Exception as e:
    logging.warning(f"Level 1 failed: {e}, falling back...")

# Level 2: 降级模式
try:
    resp = await client.call(mode="fallback", ...)
    return resp
except Exception as e:
    logging.warning(f"Level 2 failed: {e}, falling back...")

# Level 3: 裸调用
try:
    resp = await client.call(mode="bare", ...)
    return resp
except json.JSONDecodeError:
    return {"error": True, "message": "响应异常，请重试"}
```

> **规则**：所有外部 API 调用必须有降级路径。

---

## 第十一荣：并发 + 异步安全
## 第十一耻：UI 线程做 IO，死锁等重启

**后果**：UI 线程直接读写文件 → 界面冻结数秒 → 用户以为崩溃。

**正确做法**：
```csharp
// ❌ 同步 IO 卡 UI
var text = File.ReadAllText(path);

// ✅ Task.Run 隔离
var text = await Task.Run(() => File.ReadAllText(path));
```

> **规则**：UI 线程禁止直接 IO/网络操作。

---

## 第十二荣：资源路径正确引用
## 第十二耻：硬编码路径导致发布后崩溃

**后果**：开发环境中的相对路径/绝对路径在打包发布后可能全部失效。

**正确做法**：
```csharp
// ❌ 硬编码路径
<Image Source="/Resources/Images/logo.jpg"/>

// ✅ 文件系统路径 + 存在性检查
public static string ResolvePath(string name)
{
    var baseDir = AppDomain.CurrentDomain.BaseDirectory;
    var path = Path.Combine(baseDir, "Resources", name);
    return File.Exists(path) ? path : fallbackPath;
}
```

> **规则**：所有资源必须用文件系统路径 + `File.Exists()` 检查。

---

## 第十三荣：多语言互调桥接
## 第十三耻：多线程同时持全局锁，死锁崩全局

**后果**：多个线程同时调用另一语言的运行时 → 锁竞争 → 循环等待 → 全局冻结。

**正确做法**：单一工作线程串行化所有跨语言调用，`TaskCompletionSource` 桥接异步等待。

> **规则**：跨语言调用必须走单一线程串行化队列。

---

## 第十四荣：敏感数据加密
## 第十四耻：明文落盘，密钥泄露

**后果**：API Key / Token / 密钥明文存储在配置或数据库中 → 任何有文件读取权限的进程可窃取。

**正确做法**：敏感字段必须先加密再持久化，加解密走统一的加密服务。

> **规则**：API Key / Token / 密钥等敏感信息禁止明文存储。

---

## 安全红线（不可协商）

以下行为 **零容忍**，发现即打回：

| # | 红线 |
|---|------|
| 1 | 打包时 `console=True` → 密钥明文暴露在控制台 |
| 2 | CSP 包含 `unsafe-inline` |
| 3 | 硬编码 session_id / user_id |
| 4 | API key / Token 明文存储 |
| 5 | 前端 `onclick="xxx()"` HTML 内联事件 |
| 6 | 绕过认证中间件的公开路径过多 |
| 7 | 解析失败后原文当输出 → 系统提示词泄漏 |
| 8 | `except Exception: pass` 静默吞异常 |
| 9 | 硬编码资源路径 → 打包后异常 |
| 10 | UI 线程直接操作数据库/文件 |
| 11 | 多线程同时持全局锁 |

---

## 打包发布检查清单

打包前必须逐项验证：
- [ ] `console=False`
- [ ] `excludes` 列表中无依赖链所需的包
- [ ] 所有动态 import 的包都有 `hiddenimports`
- [ ] 入口文件末尾有正确的入口调用
- [ ] 打包后在不安装运行时环境的机器上双击验证启动
- [ ] 资源文件已配置到打包清单

---

## Git 提交规范

使用 Conventional Commits：

```bash
# 格式
<type>(<scope>): <description>

# 类型
feat     — 新功能
fix      — Bug 修复
refactor — 重构
chore    — 杂项
docs     — 文档
test     — 测试
```

**最佳实践**：
- 描述用现在时祈使语气
- 正文引用 issue/PR
- 一个 commit 一个逻辑变更

---

## 快速自检表

提交代码前逐项自问：

1. 新增了公开类/函数？ → 去 `__init__.py` 加导出了吗？
2. 写了数据库操作？ → 有 `rollback` 和 `finally: close()` 吗？
3. 写了新模块？ → 有对应的测试吗？
4. 改了现有 API？ → 旧测试同步更新了吗？
5. 调了第三方 SDK？ → 走的是封装层还是原生调用？
6. 用了数据库专有参数？ → 有多数据库适配吗？
7. 返回值是 dict？ → 定义 TypedDict 了吗？
8. Pydantic Field？ → 加了 `description` 吗？
9. 有副作用操作？ → 在 `lifespan` 里还是模块级？
10. 涉及密钥/会话？ → 有没有硬编码、console 打印、明文存储？
11. 写了 except？ → 加日志了吗？绝不允许 `except: pass`
12. 调了外部 API？ → 有降级路径吗？
13. UI 项目？ → 用了 `Task.Run` 隔离 IO 吗？
14. 资源引用？ → 用的是文件系统路径吗？
15. 跨语言调用？ → 走单线程队列了吗？
16. 存敏感数据？ → 加密了吗？

---

## 通用规则（所有 Skill 必须遵守）

1. **任务闭环**：完成任务后必须在 TodoWrite 中将对应任务标记为 ✅ completed，并同步更新管线看板状态。
2. **禁止越权**：严禁逾越自身角色边界。你是编码规范审查者，负责代码质量和安全检查，不进行架构决策或产品定义。超出专业范围的问题应建议切换到对应 Skill。
