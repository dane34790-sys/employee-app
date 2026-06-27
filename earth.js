// =============================
// NASA WIREFRAME EARTH ENGINE
// Part 1
// =============================

let canvas;
let ctx;

function resize(){

if(!canvas) return;

canvas.width = canvas.clientWidth;

canvas.height = canvas.clientHeight;

}

window.addEventListener("resize", resize);

// =============================
// CAMERA
// =============================

const camera = {

    distance:700,

    fov:350

};

// =============================
// EARTH
// =============================

const earth = {

    radius:85,

    rotationY:0,

    rotationX:-0.25

};

// =============================
// POINTS
// =============================

const vertices=[];

const latSteps=42;

const lonSteps=84;

// create sphere

for(let lat=0;lat<=latSteps;lat++){

const theta=

(lat/latSteps)*Math.PI;

for(let lon=0;lon<=lonSteps;lon++){

const phi=

(lon/lonSteps)*Math.PI*2;

const x=

earth.radius*

Math.sin(theta)*

Math.cos(phi);

const y=

earth.radius*

Math.cos(theta);

const z=

earth.radius*

Math.sin(theta)*

Math.sin(phi);

vertices.push({

x,y,z

});

}

}

// =============================
// ROTATION
// =============================

function rotate(v){

let x=v.x;

let y=v.y;

let z=v.z;

// rotate Y

let cosY=Math.cos(

earth.rotationY

);

let sinY=Math.sin(

earth.rotationY

);

let dx=

x*cosY-z*sinY;

let dz=

x*sinY+z*cosY;

// rotate X

let cosX=Math.cos(

earth.rotationX

);

let sinX=Math.sin(

earth.rotationX

);

let dy=

y*cosX-dz*sinX;

dz=

y*sinX+dz*cosX;

return{

x:dx,

y:dy,

z:dz

};

}
// =============================
// PART 2
// WIREFRAME DRAW
// =============================

function project(v){

const scale =
camera.fov /
(camera.distance + v.z);

return{

x:
v.x * scale +
canvas.width / 2,

y:
v.y * scale +
canvas.height / 2,

scale

};

}

function drawSphere(){

ctx.clearRect(
0,
0,
canvas.width,
canvas.height
);

// Glow

const g =
ctx.createRadialGradient(

canvas.width/2,
canvas.height/2,

earth.radius*0.4,

canvas.width/2,
canvas.height/2,

earth.radius*1.6

);

g.addColorStop(0,"rgba(0,255,120,.12)");
g.addColorStop(1,"rgba(0,0,0,0)");

ctx.fillStyle=g;

ctx.fillRect(
0,
0,
canvas.width,
canvas.height
);

ctx.strokeStyle="#00ff99";
ctx.lineWidth=0.7;

let index=0;

for(let lat=0;lat<=latSteps;lat++){

ctx.beginPath();

for(let lon=0;lon<=lonSteps;lon++){

const p =
rotate(vertices[index++]);

const s =
project(p);

if(lon===0){

ctx.moveTo(
s.x,
s.y
);

}else{

ctx.lineTo(
s.x,
s.y
);

}

}

ctx.stroke();

}

// Vertical lines

for(let lon=0;lon<=lonSteps;lon++){

ctx.beginPath();

for(let lat=0;lat<=latSteps;lat++){

const id =
lat*(lonSteps+1)+lon;

const p =
rotate(vertices[id]);

const s =
project(p);

if(lat===0){

ctx.moveTo(
s.x,
s.y
);

}else{

ctx.lineTo(
s.x,
s.y
);

}

}

ctx.stroke();

}

}
// =============================
// PART 3
// ROTATION + NODES
// =============================

// Node locations
const nodes = [

{lat:35,lon:-120},

{lat:52,lon:15},

{lat:30,lon:110},

{lat:-25,lon:25},

{lat:-35,lon:145}

];

function geoPoint(lat,lon){

lat*=Math.PI/180;
lon*=Math.PI/180;

return{

x:
earth.radius*
Math.cos(lat)*
Math.cos(lon),

y:
earth.radius*
Math.sin(lat),

z:
-earth.radius*
Math.cos(lat)*
Math.sin(lon)

};

}

function drawNodes(){

nodes.forEach((n,i)=>{

const p=
rotate(
geoPoint(
n.lat,
n.lon
)
);

if(p.z<-120)return;

const s=
project(p);

// Glow

ctx.beginPath();

ctx.arc(
s.x,
s.y,
14+s.scale*2,
0,
Math.PI*2
);

ctx.fillStyle=
"rgba(0,255,100,.15)";

ctx.fill();

// Core

ctx.beginPath();

ctx.arc(
s.x,
s.y,
4+s.scale,
0,
Math.PI*2
);

ctx.fillStyle="#ff00cc";

ctx.fill();

// Ring

ctx.beginPath();

ctx.arc(
s.x,
s.y,
10+
Math.sin(
Date.now()*0.004+i
)*2,
0,
Math.PI*2
);

ctx.strokeStyle="#00ff99";

ctx.lineWidth=2;

ctx.stroke();

});

}

// =============================
// ROTATION
// =============================

function update(){

earth.rotationY += 0.003;

drawSphere();

drawLinks();

drawNodes();

requestAnimationFrame(update);

}

// update();
// =============================
// PART 4
// NETWORK LINKS
// =============================

const links=[

[0,1],

[1,2],

[2,3],

[3,0],

[1,4]

];

function drawLinks(){

ctx.strokeStyle=
"rgba(0,255,120,.55)";

ctx.lineWidth=1.5;

links.forEach(link=>{

const a=
rotate(
geoPoint(
nodes[link[0]].lat,
nodes[link[0]].lon
));

const b=
rotate(
geoPoint(
nodes[link[1]].lat,
nodes[link[1]].lon
));

if(a.z<-100 || b.z<-100) return;

const p1=project(a);

const p2=project(b);

const mx=
(p1.x+p2.x)/2;

const my=
(p1.y+p2.y)/2-40;

ctx.beginPath();

ctx.moveTo(
p1.x,
p1.y
);

ctx.quadraticCurveTo(
mx,
my,
p2.x,
p2.y
);

ctx.stroke();

});

}
// =============================
// START EARTH
// =============================

window.startEarth = function(){

    canvas = document.getElementById("earth");

    if(!canvas) return;

    ctx = canvas.getContext("2d");

    resize();

    update();

};
