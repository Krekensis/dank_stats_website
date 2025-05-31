import{jsx as p,jsxs as f}from"react/jsx-runtime";function $({strength:u=64,steps:k=8,falloffPercentage:b=100,tint:d="transparent",...s}){let n=Math.max(1,k),e=b/n,o=.5,g=Math.pow(u/o,1/(n-1)),r=100-b,t=i=>`blur(${o*g**(n-i-1)}px)`;return p("div",{...s,style:{pointerEvents:"none",...s.style},children:f("div",{style:{position:"relative",zIndex:0,width:"100%",height:"100%",background:`radial-gradient(
            closest-side,
            rgb(from ${d} r g b / alpha) 0%,
            rgb(from ${d} r g b / 0%) 100%
          )`},children:[p("div",{style:{position:"absolute",zIndex:1,inset:0,mask:`radial-gradient(
                  closest-side,
                  rgba(0, 0, 0, 1) ${r}%,
                  rgba(0, 0, 0, 0) ${r+e}%
                )`,backdropFilter:t(0),WebkitBackdropFilter:t(0)}}),n>1&&p("div",{style:{position:"absolute",zIndex:2,inset:0,mask:`radial-gradient(
                  closest-side,
                  rgba(0, 0, 0, 1) ${r}%,
                  rgba(0, 0, 0, 1) ${r+e}%,
                  rgba(0, 0, 0, 0) ${r+e*2}%
                )`,backdropFilter:t(1),WebkitBackdropFilter:t(1)}}),n>2&&Array.from({length:n-2}).map((i,a)=>p("div",{style:{position:"absolute",zIndex:a+2,inset:0,mask:`radial-gradient(
                    closest-side,
                    rgba(0, 0, 0, 0) ${r+a*e}%,
                    rgba(0, 0, 0, 1) ${r+(a+1)*e}%,
                    rgba(0, 0, 0, 1) ${r+(a+2)*e}%,
                    rgba(0, 0, 0, 0) ${r+(a+3)*e}%
                  )`,backdropFilter:t(a+2),WebkitBackdropFilter:t(a+2)}},a))]})})}import{jsx as m,jsxs as h}from"react/jsx-runtime";var c={left:"right",right:"left",top:"bottom",bottom:"top"};function v({strength:u=64,steps:k=8,falloffPercentage:b=100,tint:d="transparent",side:s="top",...n}){let e=Math.max(1,k),o=b/e,g=.5,r=Math.pow(u/g,1/(e-1)),t=100-b,i=a=>`blur(${g*r**(e-a-1)}px)`;return m("div",{...n,style:{pointerEvents:"none",transformOrigin:s,...n.style},children:h("div",{style:{position:"relative",zIndex:0,width:"100%",height:"100%",background:`linear-gradient(
            to ${c[s]},
            rgb(from ${d} r g b / alpha) 0%,
            rgb(from ${d} r g b / 0%) 100%
          )`},children:[m("div",{style:{position:"absolute",zIndex:1,inset:0,mask:`linear-gradient(
                  to ${c[s]},
                  rgba(0, 0, 0, 1) ${t}%,
                  rgba(0, 0, 0, 0) ${t+o}%
                )`,backdropFilter:i(0),WebkitBackdropFilter:i(0)}}),e>1&&m("div",{style:{position:"absolute",zIndex:2,inset:0,mask:`linear-gradient(
                to ${c[s]},
                  rgba(0, 0, 0, 1) ${t}%,
                  rgba(0, 0, 0, 1) ${t+o}%,
                  rgba(0, 0, 0, 0) ${t+o*2}%
                )`,backdropFilter:i(1),WebkitBackdropFilter:i(1)}}),e>2&&Array.from({length:e-2}).map((a,l)=>m("div",{style:{position:"absolute",zIndex:l+2,inset:0,mask:`linear-gradient(
                    to ${c[s]},
                    rgba(0, 0, 0, 0) ${t+l*o}%,
                    rgba(0, 0, 0, 1) ${t+(l+1)*o}%,
                    rgba(0, 0, 0, 1) ${t+(l+2)*o}%,
                    rgba(0, 0, 0, 0) ${t+(l+3)*o}%
                  )`,backdropFilter:i(l+2),WebkitBackdropFilter:i(l+2)}},l))]})})}export{v as LinearBlur,$ as RadialBlur};
//# sourceMappingURL=main.js.map