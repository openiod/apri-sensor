import{C as nt,S as x,i as tt,s as et,k,l as w,m as I,h as p,n as g,b as V,g as at,D as ot,d as lt,f as q,t as C,E as st,q as J,a as M,r as K,c as R,p as j,F as v,u as it,G as rt,H as ct,I as ut,J as ft,K as A,L as dt,M as U,N as _t,O as ht,w as T,x as z,y as G,P as mt,Q as pt,R as gt,z as H}from"../../chunks/index-e2c7dba6.js";import{c as $t,n as vt,f as W,B as N,a as bt}from"../../chunks/Button-ec0de317.js";function yt(n,{from:e,to:t},s={}){const r=getComputedStyle(n),d=r.transform==="none"?"":r.transform,[_,a]=r.transformOrigin.split(" ").map(parseFloat),o=e.left+e.width*_/t.width-(t.left+_),l=e.top+e.height*a/t.height-(t.top+a),{delay:m=0,duration:$=u=>Math.sqrt(u)*120,easing:c=$t}=s;return{delay:m,duration:nt($)?$(Math.sqrt(o*o+l*l)):$,easing:c,css:(u,h)=>{const S=h*o,E=h*l,L=u+h*e.width/t.width,D=u+h*e.height/t.height;return`transform: ${d} translate(${S}px, ${E}px) scale(${L}, ${D});`}}}function X(n,e,t){const s=n.slice();return s[2]=e[t],s}function Y(n){let e,t;return{c(){e=k("i"),this.h()},l(s){e=w(s,"I",{class:!0}),I(e).forEach(p),this.h()},h(){g(e,"class",t=U(n[2].icon)+" svelte-1ykrt2d")},m(s,r){V(s,e,r)},p(s,r){r&2&&t!==(t=U(s[2].icon)+" svelte-1ykrt2d")&&g(e,"class",t)},d(s){s&&p(e)}}}function Z(n,e){let t,s,r=e[2].message+"",d,_,a,o,l,m=_t,$,c=e[2].icon&&Y(e);return{key:n,first:null,c(){t=k("div"),s=k("div"),d=J(r),_=M(),c&&c.c(),a=M(),this.h()},l(u){t=w(u,"DIV",{class:!0,style:!0});var h=I(t);s=w(h,"DIV",{class:!0});var S=I(s);d=K(S,r),S.forEach(p),_=R(h),c&&c.l(h),a=R(h),h.forEach(p),this.h()},h(){g(s,"class","content svelte-1ykrt2d"),g(t,"class","toast svelte-1ykrt2d"),j(t,"background",e[0][e[2].type]),this.first=t},m(u,h){V(u,t,h),v(t,s),v(s,d),v(t,_),c&&c.m(t,null),v(t,a),$=!0},p(u,h){e=u,(!$||h&2)&&r!==(r=e[2].message+"")&&it(d,r),e[2].icon?c?c.p(e,h):(c=Y(e),c.c(),c.m(t,a)):c&&(c.d(1),c=null),(!$||h&3)&&j(t,"background",e[0][e[2].type])},r(){l=t.getBoundingClientRect()},f(){rt(t),m(),ct(t,l)},a(){m(),m=ut(t,l,yt,{})},i(u){$||(ft(()=>{o||(o=A(t,W,{y:30},!0)),o.run(1)}),$=!0)},o(u){o||(o=A(t,W,{y:30},!1)),o.run(0),$=!1},d(u){u&&p(t),c&&c.d(),u&&o&&o.end()}}}function kt(n){let e,t=[],s=new Map,r,d=n[1];const _=a=>a[2].id;for(let a=0;a<d.length;a+=1){let o=X(n,d,a),l=_(o);s.set(l,t[a]=Z(l,o))}return{c(){e=k("div");for(let a=0;a<t.length;a+=1)t[a].c();this.h()},l(a){e=w(a,"DIV",{class:!0});var o=I(e);for(let l=0;l<t.length;l+=1)t[l].l(o);o.forEach(p),this.h()},h(){g(e,"class","notifications svelte-1ykrt2d")},m(a,o){V(a,e,o);for(let l=0;l<t.length;l+=1)t[l].m(e,null);r=!0},p(a,[o]){if(o&3){d=a[1],at();for(let l=0;l<t.length;l+=1)t[l].r();t=ot(t,o,_,1,a,d,s,e,dt,Z,null,X);for(let l=0;l<t.length;l+=1)t[l].a();lt()}},i(a){if(!r){for(let o=0;o<d.length;o+=1)q(t[o]);r=!0}},o(a){for(let o=0;o<t.length;o+=1)C(t[o]);r=!1},d(a){a&&p(e);for(let o=0;o<t.length;o+=1)t[o].d()}}}function wt(n,e,t){let s;st(n,vt,d=>t(1,s=d));let{themes:r={danger:"#E26D69",success:"#84C991",warning:"#f0ad4e",info:"#5bc0de",default:"#aaaaaa"}}=e;return n.$$set=d=>{"themes"in d&&t(0,r=d.themes)},[r,s]}class It extends x{constructor(e){super(),tt(this,e,wt,kt,et,{themes:0})}}function Et(n){let e;return{c(){e=J("Sensorkit")},l(t){e=K(t,"Sensorkit")},m(t,s){V(t,e,s)},d(t){t&&p(e)}}}function Dt(n){let e;return{c(){e=J("Reboot")},l(t){e=K(t,"Reboot")},m(t,s){V(t,e,s)},d(t){t&&p(e)}}}function St(n){let e;return{c(){e=J("Shutdown")},l(t){e=K(t,"Shutdown")},m(t,s){V(t,e,s)},d(t){t&&p(e)}}}function Vt(n){let e;return{c(){e=J("Info")},l(t){e=K(t,"Info")},m(t,s){V(t,e,s)},d(t){t&&p(e)}}}function qt(n){let e,t,s,r,d,_,a,o,l,m,$,c,u,h,S,E,L,D;r=new N({props:{class:"connectionstatusbutton ",status:n[0],type:n[0],rounded:!0,$$slots:{default:[Et]},$$scope:{ctx:n}}}),a=new N({props:{class:"rebootbutton",type:n[0],rounded:!0,$$slots:{default:[Dt]},$$scope:{ctx:n}}}),a.$on("click",n[3]),m=new N({props:{class:"shutdownbutton",type:n[0],rounded:!0,$$slots:{default:[St]},$$scope:{ctx:n}}}),m.$on("click",n[4]),u=new N({props:{class:"infobutton",type:n[0],rounded:!0,$$slots:{default:[Vt]},$$scope:{ctx:n}}}),u.$on("click",n[5]),E=new It({});const P=n[2].default,b=ht(P,n,n[6],null);return{c(){e=k("div"),t=k("div"),s=k("div"),T(r.$$.fragment),d=M(),_=k("div"),T(a.$$.fragment),o=M(),l=k("div"),T(m.$$.fragment),$=M(),c=k("div"),T(u.$$.fragment),S=M(),T(E.$$.fragment),L=M(),b&&b.c(),this.h()},l(i){e=w(i,"DIV",{class:!0});var f=I(e);t=w(f,"DIV",{id:!0,class:!0});var y=I(t);s=w(y,"DIV",{id:!0,class:!0});var B=I(s);z(r.$$.fragment,B),B.forEach(p),d=R(y),_=w(y,"DIV",{id:!0,class:!0});var O=I(_);z(a.$$.fragment,O),O.forEach(p),o=R(y),l=w(y,"DIV",{id:!0,class:!0});var F=I(l);z(m.$$.fragment,F),F.forEach(p),$=R(y),c=w(y,"DIV",{id:!0,class:!0});var Q=I(c);z(u.$$.fragment,Q),Q.forEach(p),y.forEach(p),S=R(f),z(E.$$.fragment,f),L=R(f),b&&b.l(f),f.forEach(p),this.h()},h(){g(s,"id","connectionstatusbutton"),g(s,"class","col-start-2 my-2"),g(_,"id","rebootbutton"),g(_,"class","my-2"),g(l,"id","shutdownbutton"),g(l,"class","my-2"),g(c,"id","infobutton"),g(c,"class","my-2"),g(t,"id","topmenu"),g(t,"class",h="container inline-flex max-w-full "+n[1]+" grid grid-cols-6 gap-1 svelte-qkcmna"),g(e,"class","grid place-items-center h-full")},m(i,f){V(i,e,f),v(e,t),v(t,s),G(r,s,null),v(t,d),v(t,_),G(a,_,null),v(t,o),v(t,l),G(m,l,null),v(t,$),v(t,c),G(u,c,null),v(e,S),G(E,e,null),v(e,L),b&&b.m(e,null),D=!0},p(i,[f]){const y={};f&1&&(y.status=i[0]),f&1&&(y.type=i[0]),f&64&&(y.$$scope={dirty:f,ctx:i}),r.$set(y);const B={};f&1&&(B.type=i[0]),f&64&&(B.$$scope={dirty:f,ctx:i}),a.$set(B);const O={};f&1&&(O.type=i[0]),f&64&&(O.$$scope={dirty:f,ctx:i}),m.$set(O);const F={};f&1&&(F.type=i[0]),f&64&&(F.$$scope={dirty:f,ctx:i}),u.$set(F),(!D||f&2&&h!==(h="container inline-flex max-w-full "+i[1]+" grid grid-cols-6 gap-1 svelte-qkcmna"))&&g(t,"class",h),b&&b.p&&(!D||f&64)&&mt(b,P,i,i[6],D?gt(P,i[6],f,null):pt(i[6]),null)},i(i){D||(q(r.$$.fragment,i),q(a.$$.fragment,i),q(m.$$.fragment,i),q(u.$$.fragment,i),q(E.$$.fragment,i),q(b,i),D=!0)},o(i){C(r.$$.fragment,i),C(a.$$.fragment,i),C(m.$$.fragment,i),C(u.$$.fragment,i),C(E.$$.fragment,i),C(b,i),D=!1},d(i){i&&p(e),H(r),H(a),H(m),H(u),H(E),b&&b.d(i)}}}function Ct(n,e,t){let s;st(n,bt,m=>t(0,s=m));let{$$slots:r={},$$scope:d}=e,_="bg-green-400";const a=()=>{confirm({action:"reboot"})},o=()=>{confirm({action:"shutdown"})},l=()=>{confirm({action:"info"})};return n.$$set=m=>{"$$scope"in m&&t(6,d=m.$$scope)},n.$$.update=()=>{n.$$.dirty&1&&(s=="is-info"?t(1,_="bg-blue-400"):s=="is-danger"?t(1,_="bg-red-400"):s=="is-success"?t(1,_="bg-green-400"):s=="is-busy"&&t(1,_="bg-blue-300"))},[s,_,r,a,o,l,d]}class Bt extends x{constructor(e){super(),tt(this,e,Ct,qt,et,{})}}export{Bt as default};
