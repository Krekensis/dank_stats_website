"use strict";var $=Object.defineProperty;var h=Object.getOwnPropertyDescriptor;var x=Object.getOwnPropertyNames;var y=Object.prototype.hasOwnProperty;var B=(o,a)=>{for(var s in a)$(o,s,{get:a[s],enumerable:!0})},F=(o,a,s,g)=>{if(a&&typeof a=="object"||typeof a=="function")for(let e of x(a))!y.call(o,e)&&e!==s&&$(o,e,{get:()=>a[e],enumerable:!(g=h(a,e))||g.enumerable});return o};var z=o=>F($({},"__esModule",{value:!0}),o);var I={};B(I,{LinearBlur:()=>v,RadialBlur:()=>f});module.exports=z(I);var c=require("react/jsx-runtime");function f({strength:o=64,steps:a=8,falloffPercentage:s=100,tint:g="transparent",...e}){let b=Math.max(1,a),r=s/b,l=.5,u=Math.pow(o/l,1/(b-1)),n=100-s,t=d=>`blur(${l*u**(b-d-1)}px)`;return(0,c.jsx)("div",{...e,style:{pointerEvents:"none",...e.style},children:(0,c.jsxs)("div",{style:{position:"relative",zIndex:0,width:"100%",height:"100%",background:`radial-gradient(
            closest-side,
            rgb(from ${g} r g b / alpha) 0%,
            rgb(from ${g} r g b / 0%) 100%
          )`},children:[(0,c.jsx)("div",{style:{position:"absolute",zIndex:1,inset:0,mask:`radial-gradient(
                  closest-side,
                  rgba(0, 0, 0, 1) ${n}%,
                  rgba(0, 0, 0, 0) ${n+r}%
                )`,backdropFilter:t(0),WebkitBackdropFilter:t(0)}}),b>1&&(0,c.jsx)("div",{style:{position:"absolute",zIndex:2,inset:0,mask:`radial-gradient(
                  closest-side,
                  rgba(0, 0, 0, 1) ${n}%,
                  rgba(0, 0, 0, 1) ${n+r}%,
                  rgba(0, 0, 0, 0) ${n+r*2}%
                )`,backdropFilter:t(1),WebkitBackdropFilter:t(1)}}),b>2&&Array.from({length:b-2}).map((d,i)=>(0,c.jsx)("div",{style:{position:"absolute",zIndex:i+2,inset:0,mask:`radial-gradient(
                    closest-side,
                    rgba(0, 0, 0, 0) ${n+i*r}%,
                    rgba(0, 0, 0, 1) ${n+(i+1)*r}%,
                    rgba(0, 0, 0, 1) ${n+(i+2)*r}%,
                    rgba(0, 0, 0, 0) ${n+(i+3)*r}%
                  )`,backdropFilter:t(i+2),WebkitBackdropFilter:t(i+2)}},i))]})})}var m=require("react/jsx-runtime"),k={left:"right",right:"left",top:"bottom",bottom:"top"};function v({strength:o=64,steps:a=8,falloffPercentage:s=100,tint:g="transparent",side:e="top",...b}){let r=Math.max(1,a),l=s/r,u=.5,n=Math.pow(o/u,1/(r-1)),t=100-s,d=i=>`blur(${u*n**(r-i-1)}px)`;return(0,m.jsx)("div",{...b,style:{pointerEvents:"none",transformOrigin:e,...b.style},children:(0,m.jsxs)("div",{style:{position:"relative",zIndex:0,width:"100%",height:"100%",background:`linear-gradient(
            to ${k[e]},
            rgb(from ${g} r g b / alpha) 0%,
            rgb(from ${g} r g b / 0%) 100%
          )`},children:[(0,m.jsx)("div",{style:{position:"absolute",zIndex:1,inset:0,mask:`linear-gradient(
                  to ${k[e]},
                  rgba(0, 0, 0, 1) ${t}%,
                  rgba(0, 0, 0, 0) ${t+l}%
                )`,backdropFilter:d(0),WebkitBackdropFilter:d(0)}}),r>1&&(0,m.jsx)("div",{style:{position:"absolute",zIndex:2,inset:0,mask:`linear-gradient(
                to ${k[e]},
                  rgba(0, 0, 0, 1) ${t}%,
                  rgba(0, 0, 0, 1) ${t+l}%,
                  rgba(0, 0, 0, 0) ${t+l*2}%
                )`,backdropFilter:d(1),WebkitBackdropFilter:d(1)}}),r>2&&Array.from({length:r-2}).map((i,p)=>(0,m.jsx)("div",{style:{position:"absolute",zIndex:p+2,inset:0,mask:`linear-gradient(
                    to ${k[e]},
                    rgba(0, 0, 0, 0) ${t+p*l}%,
                    rgba(0, 0, 0, 1) ${t+(p+1)*l}%,
                    rgba(0, 0, 0, 1) ${t+(p+2)*l}%,
                    rgba(0, 0, 0, 0) ${t+(p+3)*l}%
                  )`,backdropFilter:d(p+2),WebkitBackdropFilter:d(p+2)}},p))]})})}0&&(module.exports={LinearBlur,RadialBlur});
//# sourceMappingURL=main.cjs.map