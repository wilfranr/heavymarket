import{$ as B,Z as x,aa as S,ba as r,ca as d}from"./chunk-6GBDMTCE.js";import{K as C}from"./chunk-735KUJFF.js";import{w as k}from"./chunk-LWZ5NFGU.js";import{G as l,Ia as y,Ib as M,Sa as h,Ta as m,Ua as b,d as s,e as p,g as c,i as o,ib as D,jb as I,ua as v,ub as z,va as u,vb as a,ya as g,za as f}from"./chunk-5FPXF5CH.js";var j=`
    .p-divider-horizontal {
        display: flex;
        width: 100%;
        position: relative;
        align-items: center;
        margin: dt('divider.horizontal.margin');
        padding: dt('divider.horizontal.padding');
    }

    .p-divider-horizontal:before {
        position: absolute;
        display: block;
        inset-block-start: 50%;
        inset-inline-start: 0;
        width: 100%;
        content: '';
        border-block-start: 1px solid dt('divider.border.color');
    }

    .p-divider-horizontal .p-divider-content {
        padding: dt('divider.horizontal.content.padding');
    }

    .p-divider-vertical {
        min-height: 100%;
        display: flex;
        position: relative;
        justify-content: center;
        margin: dt('divider.vertical.margin');
        padding: dt('divider.vertical.padding');
    }

    .p-divider-vertical:before {
        position: absolute;
        display: block;
        inset-block-start: 0;
        inset-inline-start: 50%;
        height: 100%;
        content: '';
        border-inline-start: 1px solid dt('divider.border.color');
    }

    .p-divider.p-divider-vertical .p-divider-content {
        padding: dt('divider.vertical.content.padding');
    }

    .p-divider-content {
        z-index: 1;
        background: dt('divider.content.background');
        color: dt('divider.content.color');
    }

    .p-divider-solid.p-divider-horizontal:before {
        border-block-start-style: solid;
    }

    .p-divider-solid.p-divider-vertical:before {
        border-inline-start-style: solid;
    }

    .p-divider-dashed.p-divider-horizontal:before {
        border-block-start-style: dashed;
    }

    .p-divider-dashed.p-divider-vertical:before {
        border-inline-start-style: dashed;
    }

    .p-divider-dotted.p-divider-horizontal:before {
        border-block-start-style: dotted;
    }

    .p-divider-dotted.p-divider-vertical:before {
        border-inline-start-style: dotted;
    }

    .p-divider-left:dir(rtl),
    .p-divider-right:dir(rtl) {
        flex-direction: row-reverse;
    }
`;var N=["*"],w={root:({instance:e})=>({justifyContent:e.layout==="horizontal"?e.align==="center"||e.align==null?"center":e.align==="left"?"flex-start":e.align==="right"?"flex-end":null:null,alignItems:e.layout==="vertical"?e.align==="center"||e.align==null?"center":e.align==="top"?"flex-start":e.align==="bottom"?"flex-end":null:null})},A={root:({instance:e})=>["p-divider p-component","p-divider-"+e.layout,"p-divider-"+e.type,{"p-divider-left":e.layout==="horizontal"&&(!e.align||e.align==="left")},{"p-divider-center":e.layout==="horizontal"&&e.align==="center"},{"p-divider-right":e.layout==="horizontal"&&e.align==="right"},{"p-divider-top":e.layout==="vertical"&&e.align==="top"},{"p-divider-center":e.layout==="vertical"&&(!e.align||e.align==="center")},{"p-divider-bottom":e.layout==="vertical"&&e.align==="bottom"}],content:"p-divider-content"},E=(()=>{class e extends x{name="divider";style=j;classes=A;inlineStyles=w;static \u0275fac=(()=>{let i;return function(t){return(i||(i=l(e)))(t||e)}})();static \u0275prov=s({token:e,factory:e.\u0275fac})}return e})();var F=new c("DIVIDER_INSTANCE"),T=(()=>{class e extends S{componentName="Divider";$pcDivider=o(F,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=o(r,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}styleClass;layout="horizontal";type="solid";align;_componentStyle=o(E);get dataP(){return this.cn({[this.align]:this.align,[this.layout]:this.layout,[this.type]:this.type})}static \u0275fac=(()=>{let i;return function(t){return(i||(i=l(e)))(t||e)}})();static \u0275cmp=v({type:e,selectors:[["p-divider"]],hostAttrs:["role","separator"],hostVars:6,hostBindings:function(n,t){n&2&&(y("aria-orientation",t.layout)("data-p",t.dataP),z(t.sx("root")),a(t.cn(t.cx("root"),t.styleClass)))},inputs:{styleClass:"styleClass",layout:"layout",type:"type",align:"align"},features:[M([E,{provide:F,useExisting:e},{provide:B,useExisting:e}]),g([r]),f],ngContentSelectors:N,decls:2,vars:3,consts:[[3,"pBind"]],template:function(n,t){n&1&&(D(),m(0,"div",0),I(1),b()),n&2&&(a(t.cx("content")),h("pBind",t.ptm("content")))},dependencies:[k,C,d,r],encapsulation:2,changeDetection:0})}return e})(),Y=(()=>{class e{static \u0275fac=function(n){return new(n||e)};static \u0275mod=u({type:e});static \u0275inj=p({imports:[T,d,d]})}return e})();export{T as a,Y as b};
