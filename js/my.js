var $container = document.querySelector(".container")
var $menuBox = document.querySelector(".menuBox")
var $canvas = document.querySelector("#canvas")
var $sizeRange = document.getElementById("size-range")
var $opRange = document.getElementById("op-range")
var $mask = document.querySelector(".mask")
var $btn = document.querySelector("button.btn")
var $cutBox = document.querySelector(".select-cut-box")
var $input = document.getElementById("danmu-input")
var $rotateBtn = document.querySelector(".rotate-btn")

var isDown = false                  // 标志鼠标是否按下
var lookModal = false               // 鼠标模式
var ctx = null                      // 画笔
var ctx2 = null                     // 2号画笔
var points = []                     // 滑动时收集的点
var beginPoint = null               // 开始的点
var currentMenu = "icon-pen"        // 初始按钮
var currentColor = 0                // 初始颜色的index
var paintingModal = "pen"           // 画笔模式   line||pen||cut
var cuted = false                   // 标记裁剪时，是否已经裁剪
var animationTimer = null           // 弹幕动画的timer
var barrageArray = []               // 保存弹幕的数组
var globalPoint = { x : 0, y : 0 }  // canvas上鼠标的点
var barrageData = [                 // 弹幕假数据
    "1111111111",
    "我是一条弹幕",
    "gogogogo!!!!!",
    "66666666666666666",
    "好溜啊好溜啊好溜啊-----",
    "999999999999999999"
]

// 实现撤销和重做的功能
let canvasHistory = []
let step = 0

var penAttibutes = {
    width : 2,
    lineCap : "round",
    lineJoin : "round",
    strokeStyle: "#000",
    fillStyle: "#000",
    globalCompositeOperation: "source-over",
    globalAlpha : 1
}

var colorLsit = [
    "#000",
    "#FF3333",
    "#99CC00",
    "#0066FF",
    "#FFFF33",
    "#33CC66"
]

// 单个弹幕类
function Barrage( text, canvas ){
    this.x = canvas.width
    this.y = canvas.height / 2 * Math.random()
    this.speed = Math.random() * 4 + 2

    this.opacity = 0.8
    this.text = text
    this.color = "red"
    this.fontSize = 28
    this.width = 0
    this.isStop = false
}
Barrage.prototype.draw = function( ctx ){
    var text = this.text
    ctx.save()
    ctx.strokeStyle = this.color
    ctx.textBaseline = "top"                   // 设置文本基线，默认是bottom，，
    ctx.font = `bold  ${this.fontSize}px "microsoft yahei", sans-serif`
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.beginPath()
    ctx.fillText( text, this.x, this.y )
    ctx.strokeText(text, this.x, this.y)
    this.width = ctx.measureText( text ).width
    ctx.rect( this.x, this.y, this.width, this.fontSize + 2 )
    this.isStop = ctx.isPointInPath( globalPoint.x, globalPoint.y ) || ctx.isPointInStroke( globalPoint.x, globalPoint.y )
    ctx.restore()
}


window.onload = function(){
    canvasSetSize()      // 设置canvas的尺寸
    saveToHistory()      // 保存初始页面
    window.onblur = function(){
        document.title = "你的画还没画完！！"
    }
    window.onfocus = function(){
        document.title = "快到碗里来！！"
    }
}
// 设置canvas适应页面
function canvasSetSize(){
    ctx = $canvas.getContext("2d")
    let w = document.documentElement.clientWidth
    let h = document.documentElement.clientHeight
    $canvas.width = w
    $canvas.height = h
}
// 屏幕下方所有功能按钮
$container.addEventListener( "click", ( e ) => {
    switch ( e.target.dataset.fun ){
        case "save":
            funSave()
            break
        case "shubiao":
            funShubiao()
            break
        case "pen":
            funPen()
            break
        case "line":
            funLine()
            break
        case "eraser":
            funEraser()
            break
        case "closeMenu":
            closePenMenu()
            break
        case "del":
            funDel()
            break
        case "text":
            funText()
            break
        case "cut":
            funCut()
            break
        case "dan":
            funDan()
            break
        case "undo":
            funUndo()
            break
        case "redo":
            funRedo()
            break
    }
    if( e.target.dataset.color ){
        selectColor( e.target )
    }
} , false)

// 绘图三步走
$canvas.addEventListener('mousedown', down, false);
$canvas.addEventListener('mousemove', move, false);
$canvas.addEventListener('mouseup', up, false);
$canvas.addEventListener('mouseout', up, false);

function down( ev ){
    ev = ev || event
    if( lookModal )return 
    if( paintingModal === "cut" ) return
        
    isDown = true;
    var { x, y } = getPos(ev);
    points.push({x, y});
    beginPoint = {x, y};
    ctx.save()
}

function move( ev ) {
    const { x, y } = getPos(ev)
    globalPoint.x = x
    globalPoint.y = y
    if (!isDown) return;
    if( paintingModal === "cut" ) return
    points.push({x, y});
    if( paintingModal === "line" ){
        drawLine1( beginPoint, { x, y } )
    } else {
        if (points.length > 3) {
            const lastTwoPoints = points.slice(-2);
            const controlPoint = lastTwoPoints[0];
            const endPoint = {
                x: (lastTwoPoints[0].x + lastTwoPoints[1].x) / 2,
                y: (lastTwoPoints[0].y + lastTwoPoints[1].y) / 2,
            }
            drawLine(beginPoint, controlPoint, endPoint);
            beginPoint = endPoint;
        }
    }
}

function up(ev) {
    if (!isDown) return;
    if( paintingModal === "cut" ) return
    const { x, y } = getPos(ev);
    points.push({x, y});
    if( paintingModal === "line" ){
        drawLine1( beginPoint, { x, y } )
    } else {
        if (points.length > 3) {
            const lastTwoPoints = points.slice(-2);
            const controlPoint = lastTwoPoints[0];
            const endPoint = lastTwoPoints[1];
            drawLine(beginPoint, controlPoint, endPoint);
        }
    }
    ctx.restore()
    saveToHistory()
    beginPoint = null;
    isDown = false;
    points = [];
}

// 直线
function drawLine1( beginPoint, endPoint ) {
    ctx.putImageData( canvasHistory[ step - 1 ], 0, 0 )
    ctx.lineWidth = penAttibutes.width
    ctx.lineCap = penAttibutes.lineCap
    ctx.strokeStyle = penAttibutes.strokeStyle
    ctx.fillStyle = penAttibutes.fillStyle
    ctx.globalCompositeOperation = penAttibutes.globalCompositeOperation
    ctx.globalAlpha = penAttibutes.globalAlpha
    ctx.beginPath()
    ctx.moveTo(beginPoint.x, beginPoint.y)
    ctx.lineTo( endPoint.x, endPoint.y )
    ctx.stroke()
}

// 绘画
function drawLine(beginPoint, controlPoint, endPoint) {
    ctx.lineWidth = penAttibutes.width
    ctx.lineCap = penAttibutes.lineCap
    ctx.lineJoin = penAttibutes.lineJoin
    ctx.strokeStyle = penAttibutes.strokeStyle
    ctx.fillStyle = penAttibutes.fillStyle
    ctx.globalCompositeOperation = penAttibutes.globalCompositeOperation
    ctx.globalAlpha = penAttibutes.globalAlpha
    ctx.beginPath()
    ctx.moveTo(beginPoint.x, beginPoint.y)
    ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y)
    ctx.stroke()
}
// 获取点
function getPos( ev ) {
    return {
        x: ev.clientX,
        y: ev.clientY
    }
}

// 点击保存
function funSave(){
    $mask.style.display = "block"
    document.querySelector(".r-drawer-box").style.display = "block"
    var imgUrl = $canvas.toDataURL("image/png")
    var imgEl = document.getElementsByClassName("displayImg")[0]
    imgEl.src = imgUrl
}
// 鼠标
function funShubiao(){
    paintingModal = "pen"
    closePenMenu()
    classToggle( "icon-shubiao" )
    lookModalToggle( true )
}
// 鼠标功能选择
function lookModalToggle( islook ){
    if( islook ){
        $canvas.style.cursor = "default"
        lookModal = true
    } else {
        lookModal = false
        $canvas.style.cursor = ""
    }
}
// 点击笔
function funPen(){
    paintingModal = "pen"
    lookModalToggle( false )
    $menuBox.classList.toggle("hide")
    if( currentMenu === "icon-pen" ){
        // 关闭功能窗
    } else {
        // 换上action，显示功能窗
        classToggle( "icon-pen" )
    }
    penAttibutes.globalCompositeOperation = "source-over"
}
// 画线函数
function funLine(){
    paintingModal = "line"
    lookModalToggle( false )
    closePenMenu()
    classToggle( "icon-line1" )
    penAttibutes.globalCompositeOperation = "source-over"
}
// 橡皮檫
function funEraser(){
    paintingModal = "pen"
    lookModalToggle( false )
    closePenMenu()
    classToggle( "icon-eraser" )
    penAttibutes.globalCompositeOperation = "destination-out"
}
// 清空画布
function funDel(){
    // ctx.clearRect( 0, 0, $canvas.width, $canvas.height )
    // saveToHistory()
    ctx.putImageData( canvasHistory[0], 0, 0 )
    step = 1
    canvasHistory.length = step
}
// 文字
function funText(){
    
}
// 截图
function funCut(){
    lookModalToggle( true )
    classToggle( "icon-caijian" )
    closePenMenu()
    paintingModal = "cut"
}
// 发送弹幕
function funDan(){
    document.querySelector(".danmu-box").style.display = "block"
    closePenMenu()
    lookModalToggle( true )
    barrageData.forEach( item => {
        var aBraage = new Barrage( item, $canvas )
        barrageArray.push( aBraage )
    })
    var drawAll = function(){
        barrageArray = barrageArray.filter( item => {
            if( item.x < -( item.width ) ){ 
                return false 
            } else {
                if( item.isStop ){

                } else {
                    item.x -= item.speed
                }
                item.draw( ctx )
                return true
            }
        } )
    }
    var render = function(){
        ctx.clearRect(0, 0, $canvas.width, $canvas.height);
        ctx.putImageData( canvasHistory[ canvasHistory.length - 1 ], 0, 0 )
        drawAll()
        animationTimer = requestAnimationFrame( render )
    }
    render()
}
send.addEventListener( 'click', function(){
    var inputText = $input.value
    $input.value = ""
    var aBarrage = new Barrage( inputText, $canvas )
    barrageArray.push( aBarrage )
} )
$input.addEventListener( "keydown", function( ev ){
    if (event.keyCode == "13") {
        var inputText = $input.value
        $input.value = ""
        var aBarrage = new Barrage( inputText, $canvas )
        barrageArray.push( aBarrage )
    }
} )
quitDanmu.addEventListener( "click", function(){
    $input.value = ""
    cancelAnimationFrame( animationTimer )
    document.querySelector(".danmu-box").style.display = "none"
    ctx.putImageData( canvasHistory[ canvasHistory.length - 1 ], 0, 0 )
    lookModalToggle( false )
    barrageData = []
} )


// 选择颜色
function selectColor( current ){
    var colorIndex = parseInt( current.dataset.color )
    if( colorIndex === currentColor  ){

    } else {
        document.getElementsByClassName("color-item")[currentColor].classList.toggle("action")
        document.getElementsByClassName("color-item")[colorIndex].classList.toggle("action")
        currentColor = colorIndex
        penAttibutes.fillStyle = colorLsit[currentColor]
        penAttibutes.strokeStyle = colorLsit[currentColor]
    }
}
// 撤销
function funUndo(){
    if( step > 1 ){
        ctx.putImageData( canvasHistory[ --step - 1 ], 0, 0 )
    } else {
        alert( "现在正是初始时的画布哦----" )
    }
}
// 前进
function funRedo(){
    if( step < canvasHistory.length ){
        ctx.putImageData( canvasHistory[ step++ ], 0, 0 )
    } else {
        alert( "现在正是最新的画布----" )
    }
}

// 保存到历史
function saveToHistory(){
    if(step === canvasHistory.length){
        let nowImage = ctx.getImageData( 0, 0, $canvas.width, $canvas.height )
        canvasHistory.push( nowImage )
        step++
    } else {
        canvasHistory.length = step;    // 截断数组
    }
    if( step === 0 ){
        console.log("----------初始化的时候")
    }
}

// 页面相关的方法
$mask.addEventListener("click", function(){
    cuted = false
    $mask.style.display = "none"
    $rotateBtn.style.display = "none"
    document.querySelector(".r-drawer-box").style.display = "none"
})

$btn.addEventListener("click", function(){
    cuted = false
    let saveA = document.createElement('a');
    document.body.appendChild(saveA);
    saveA.href = document.getElementsByClassName("displayImg")[0].src
    saveA.download = 'canvas-'+(new Date).getTime()
    saveA.target = '_blank'
    saveA.click();
})

function classToggle( nowClass ){
    if( nowClass === currentMenu ){
        return
    } else {
        var action = document.querySelector( "i." + currentMenu )
        action.classList.toggle("action")
        var currentEle = document.querySelector( "i." + nowClass )
        currentEle.classList.toggle("action")
        currentMenu = nowClass
    }
}

function closePenMenu(){
    if( Array.from($menuBox.classList).includes( "hide" ) ){

    } else {
        $menuBox.classList.toggle("hide")
    }
}

$sizeRange.onchange = function(  ){
    document.getElementsByClassName("circle-dot")[0].style.transform = 'scale('+ (parseInt($sizeRange.value)) +')';
    penAttibutes.width = parseInt( $sizeRange.value ) * 2
}

$opRange.onchange = function(){
    // 暂时不实现，效果不理想
    // penAttibutes.globalAlpha = 1 - parseInt( $opRange.value ) / 10
    document.getElementsByClassName("opacity-dot")[0].style.opacity = 1 - parseInt( $opRange.value ) / 10
}

// -------------------裁剪-------------------------------

// 裁剪三步走
document.addEventListener('mousedown', docDown, false);
document.addEventListener('mousemove', docMove, false);
document.addEventListener('mouseup', docUp, false);

function docDown( ev ){
    if( cuted ) return
    if( paintingModal === "cut" ){
        isDown = true
        points = []
        points.push({ x : ev.clientX, y : ev.clientY })
        $cutBox.style.top = points[0].y + "px"
        $cutBox.style.left = points[0].x + "px"
    }
}
function docMove( ev ){
    if( cuted ) return
    if( paintingModal === "cut" ){
        if( isDown  && ev.clientX !== points[0].x && ev.clientY !== points[0].y ){
            var op = document.querySelector(".op-mask")
            if( op.style.display !== "block" ){
                op.style.display = "block"
            }
            var { x, y } = getPos( ev )
            var elw = x - points[0].x
            var elh = y - points[0].y
            document.querySelector(".text-px").innerHTML = elw + "x" + elh
            $cutBox.style.display = "block"
            $cutBox.style.height = elh + "px"
            $cutBox.style.width = elw + "px"
        }
    }
}
function docUp( ev ){
    if( cuted ) return
    if( !isDown ) return
    if( paintingModal === "cut" ){
        if( $cutBox.style.display === "block" ) {
            cuted = true
        }
        isDown = false
        points.push( { x : ev.clientX, y : ev.clientY } )
    }
}
// 裁剪方法
$cutBox.addEventListener( "click", ( e ) => {
    switch ( e.target.dataset.cutfun ){
        case "save":
            cutSave()
            break
        case "close":
            cutClose()
            break
        case "ok":
            cutOk()
            break
    }
} )

function cutSave(  ){
    // 通用
    $rotateBtn.style.display = "block"
    $cutBox.style.display = "none"
    document.querySelector(".op-mask").style.display = "none"

    $mask.style.display = "block"
    document.querySelector(".r-drawer-box").style.display = "block"
    var cutw = Math.abs( points[1].x - points[0].x )
    var cuth = Math.abs( points[1].y - points[0].y )
    if( points[1].x < points[0].x || points[1].y < points[0].y ){
        [ points[1], points[0] ] = [ points[0], points[1] ]
    }
    ctx2 = canvas2.getContext("2d")

    canvas2.width = cutw
    canvas2.height = cuth

    var oldData = ctx.getImageData( points[0].x, points[0].y, cutw, cuth )
    ctx2.putImageData( oldData, 0, 0, )

    var imgUrl = canvas2.toDataURL()
    var imgEl = document.getElementsByClassName("displayImg")[0]
    imgEl.src = imgUrl
    points = []
}
$rotateBtn.addEventListener( "click", function(){
    var imgEl = document.getElementsByClassName("displayImg")[0]
    var w = canvas2.height
    var h = canvas2.width
    canvas2.height = h
    canvas2.width = w

    ctx2.translate( canvas2.width , 0 )
    ctx2.rotate( 90 * Math.PI / 180 )
    ctx2.drawImage( imgEl, 0, 0 )
    ctx2.restore()
    var imgUrl = canvas2.toDataURL()
    imgEl.src = imgUrl
    document.getElementsByClassName("img-box")[0].appendChild( imgEl )
} )
function cutClose(){
    cuted = false
    $cutBox.style.display = "none"
    document.querySelector(".op-mask").style.display = "none"
    points = []
}
function cutOk(){
    alert("暂时还未想好功能能----")
}




//   我的实现绘画
// function draw(){
//     if( $canvas.getContext ){
//         ctx = $canvas.getContext("2d")
//         console.dir( ctx )
//         $canvas.onmousedown = function( ev ){
//             ev = ev || event
//             var x = ev.clientX
//             var y = ev.clientY
//             ctx.save()
//             ctx.lineWidth = penAttibutes.width
//             console.log( penAttibutes )
//             ctx.lineCap = penAttibutes.lineCap
//             ctx.lineJoin = penAttibutes.lineJoin
//             ctx.strokeStyle = penAttibutes.strokeStyle
//             ctx.fillStyle = penAttibutes.fillStyle
//             ctx.globalCompositeOperation = penAttibutes.globalCompositeOperation
//             ctx.beginPath()
//             ctx.moveTo( x + 6 , y + 6 )
//             document.onmousemove = function( moveev ){
//                 moveev = moveev || event
//                 ctx.lineTo( moveev.clientX  + 6, moveev.clientY + 6 )
//                 ctx.stroke()
//             }
//             document.onmouseup = () => {
//                 ctx.restore()
//                 document.onmousemove = document.onmouseup = null
//             }
//             return false
//         }
//     } else {
//         alert("-------对不起-你的浏览器不支持canvas")
//     }
// }
