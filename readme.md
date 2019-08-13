# 快到碗里来-画板
---

预览：[点击](https://curtaintan.github.io/drawing-board/)

## 前言：
---
之前学完canvas，一直想自己写一点东西，这两天终于完成了，开心！！


## 完成功能：
---
1. 绘画
2. 画直线
3. 截图
4. 旋转
5. 弹幕
6. 鼠标触碰弹幕，弹幕悬停
7. 撤销/前进
8. 设置画笔信息

### 功能截图：
----
<img src="./image/home.png" height="400px" align="center" />
<span><img src="./image/2.png" height="400px"  align="center" /></span>
<span><img src="./image/cut.png" height="400px" align="center" /></span>
<span><img src="./image/rotate.png" height="400px" align="center" /></span>
<img src="./image/dan.png" height="400px"  align="center" />


## 前置说明
---
    如果你需要参考代码，你需要看下这里。
    因为功能复杂，标志的变量有接近10个之多，一下子可能很难看懂，所以我这里说明下我的开发流程，以及定义变量的顺序。

1. **功能顺序：**

画笔 → 定义画笔信息 → 橡皮檫 → 删除 → 撤销/前进 → 直线 → 截图 → 弹幕

2. **定义变量的顺序，以及作用：**

所有功能变量：

```js
var isDown = false                  // 标志鼠标是否按下      绘图三步和剪切三步走时，后面两个事件触发的标志
var points = []                     // 滑动时收集的点       绘画三步走时，为了时画的线光滑，记录点，减短画线的距离
var beginPoint = null               // 开始的点            绘画三步走时使用

----这三个为一组，画线三人组，为了让画的线更为光滑

var currentMenu = "icon-pen"        // 初始按钮            底部按钮选中的按钮
var currentColor = 0                // 初始颜色的index     颜色选择，默认第一个
var paintingModal = "pen"           // 画笔模式   line||pen||cut

----按钮功能三人组，按钮选中标记，颜色选中，画画的模式，切换前面画笔和画直线的模式

var lookModal = false               // 鼠标模式             按钮第一个功能，此模式不能绘画，只能看
var cuted = false                   // 标记裁剪时，是否已经裁剪       裁剪后，防止后续的操作再次触发裁剪操作 

----鼠标模式和剪切模式的定义

var animationTimer = null           // 弹幕动画的timer               动画的timer
var barrageArray = []               // 保存弹幕的数组
var globalPoint = { x : 0, y : 0 }  // canvas上鼠标的点        ---弹幕时使用

----弹幕三人组  globalPoint用来标记鼠标在canvas中的坐标，用于判断鼠标是否触碰到弹幕上

// 实现撤销和重做的功能
let canvasHistory = []                    // canvas数据，在每次画线和橡皮檫使用后保存数据
let step = 0                              // 画笔抬起的步数，清空时，步数也清空

----撤销/前进二人组，画笔抬起时，把画布信息用getImageData存入canvasHistory，用step完成前进和撤销的功能

var penAttibutes = {                       // 画笔数据，
    width : 2,
    lineCap : "round",
    lineJoin : "round",
    strokeStyle: "#000",
    fillStyle: "#000",
    globalCompositeOperation: "source-over",
    globalAlpha : 1
}

```





