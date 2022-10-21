# Node Mirai Arknights

## 基于 [mirai](https://github.com/mamoe/mirai) 的明日方舟机器人

## 指令

### 初次使用时, 必须先通过 `更新` 指令或者在程序中调用 `arknights.syncData()` 初始化数据库, 否则查询和模拟抽卡可能会报错.

#### 普通指令

|指令|效果|
|--|--|
|查询XX|查询某干员资料|
|[[XX]]|在 [prts](https://prts.wiki) 查找页面XX |
|十连寻访|进行一次模拟十连|
|帮助/说明/操作/指南|查看指令列表|

#### 超级管理员指令

|指令|效果|
|--|--|
|更新|更新数据库|
|设置前缀#|将命令前缀设置为#|
|添加1234|将群号1234添加到白名单|
|删除1234|将群号1234从白名单删除|
|重启|尝试重启机器人|

* 如果你使用 `forever` 或者 `pm2` 守护进程, 插件会优先检测并执行对应的命令, 否则会尝试调用子进程的方法重启, 此时 `Ctrl+C` 退出会失效(因为启动进程已经退出了), 你需要手动 `kill pid` 杀死新的进程, 或者发送 `关机` 指令让机器人退出.

## 部署

`NodeMiraiSDK` 的配置请参考 [node-mirai-sdk](https://github.com/RedBeanN/node-mirai)

```js
const Mirai = require('node-mirai-sdk')

const { default: NodeMiraiArknights } = require('node-mirai-arknights')

const bot = new Mirai({/* ... */});

/**
 * 可以传入配置对象或保存了配置对象的 `json` 文件.
 * 使用 `presist: true` 会在内部保存和更新配置, 使用后必须用 `arknights.setConfig`
 * 修改配置, 否则配置文件可能被覆盖, 使用 `json` 文件时会自动写入配置, 也能在检测到
 * 手动修改后自动更新.
 * 使用对象配置 `presist` 模式只推荐用于调试, 在调试好后应该改用 `json` 文件.
 */
// const arknight = NodeMiraiArknights('/path/to/your/config.json')
const arknights = NodeMiraiArknights({
  presist: true, // 由 NodeMiraiArknights 保存配置
  sync: {
    enable: true, // 允许自动更新数据库
  },
  group: {
    whiteList: [ // 为 `false` 禁用白名单模式
      1234, // 白名单群号
    ],
    blackList: false, // 禁用黑名单, 为数组时启用黑名单模式
  },
  atBot: false, // 是否仅响应 at 机器人的指令
  prefix: '#', // 指令前缀
  logMessage: true, // 是否在控制台打印聊天记录
  masters: [ // 超级管理员列表
    1234,
  ],
  manage: {
    updater: { // 通过在聊天中发送指令更新
      enable: true,
      group: true, // 允许在群聊发送更新
      owner: true, // 允许由群主（即使不是超级管理员）发送更新指令
    },
  },
  gacha: { // 模拟十连配置
    enable: true,
    cooldown: 60_000, // 每个人的抽卡间隔, 单位毫秒
    recall: true, // 是否撤回结果以防刷屏
    recallTime: 30_000, // 撤回延迟
  }，
});

// 应用插件
bot.use(arknights.plugin);

// 在运行时修改配置
arknights.setConfig({/* ... */});

// 自定义组件
const { Component, addCustomComponent, removeCustomComponent } = require('node-mirai-arknights');
const myComponent = new Component(
  'myComponent', // 组件名
  [{ // 功能
    rules: [ // 匹配规则, 任一匹配即生效
      /测试/, // 可以是正则
      ({ msg }) => msg.includes('试测'), // 或返回 boolean 的函数
    ],
    command: true, // 可选, 匹配正则前移除指令前缀
    handler ({ msg, reply }) { // 成功匹配时调用
      reply('你发送了：', msg);
    },
  }, {
    // ... 其他功能
  }],
  true, // 可选, 成功匹配时是否跳过其他组件, 为 true 时跳过
);
// 添加组件
addCustomComponent(myComponent);
// 移除组件
removeCustomComponent(myComponent);

bot.listen('all')

```

## 数据来源

[yuanyan3060/Arknights-Bot-Resource](https://github.com/yuanyan3060/Arknights-Bot-Resource)

[PRTS](https://prts.wiki)
