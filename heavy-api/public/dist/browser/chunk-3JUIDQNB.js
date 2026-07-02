import{$ as v,Z as I,aa as w,ba as i,ca as N}from"./chunk-6GBDMTCE.js";import{K as u}from"./chunk-735KUJFF.js";import{G as r,Ib as y,d,e as a,g as s,i as e,ib as m,jb as b,ua as l,ub as D,va as c,vb as h,ya as f,za as g}from"./chunk-5FPXF5CH.js";var M=`
    .p-inputgroup,
    .p-inputgroup .p-iconfield,
    .p-inputgroup .p-floatlabel,
    .p-inputgroup .p-iftalabel {
        display: flex;
        align-items: stretch;
        width: 100%;
    }

    .p-inputgroup .p-floatlabel .p-inputwrapper,
    .p-inputgroup .p-iftalabel .p-inputwrapper {
        display: inline-flex;
    }

    .p-inputgroup .p-inputtext,
    .p-inputgroup .p-inputwrapper {
        flex: 1 1 auto;
        width: 1%;
    }

    .p-inputgroupaddon {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: dt('inputgroup.addon.padding');
        background: dt('inputgroup.addon.background');
        color: dt('inputgroup.addon.color');
        border-block-start: 1px solid dt('inputgroup.addon.border.color');
        border-block-end: 1px solid dt('inputgroup.addon.border.color');
        min-width: dt('inputgroup.addon.min.width');
    }

    .p-inputgroupaddon:first-child,
    .p-inputgroupaddon + .p-inputgroupaddon {
        border-inline-start: 1px solid dt('inputgroup.addon.border.color');
    }

    .p-inputgroupaddon:last-child {
        border-inline-end: 1px solid dt('inputgroup.addon.border.color');
    }

    .p-inputgroupaddon:has(.p-button) {
        padding: 0;
        overflow: hidden;
    }

    .p-inputgroupaddon .p-button {
        border-radius: 0;
    }

    .p-inputgroup > .p-component,
    .p-inputgroup > .p-inputwrapper > .p-component,
    .p-inputgroup > .p-iconfield > .p-component,
    .p-inputgroup > .p-floatlabel > .p-component,
    .p-inputgroup > .p-floatlabel > .p-inputwrapper > .p-component,
    .p-inputgroup > .p-iftalabel > .p-component,
    .p-inputgroup > .p-iftalabel > .p-inputwrapper > .p-component {
        border-radius: 0;
        margin: 0;
    }

    .p-inputgroupaddon:first-child,
    .p-inputgroup > .p-component:first-child,
    .p-inputgroup > .p-inputwrapper:first-child > .p-component,
    .p-inputgroup > .p-iconfield:first-child > .p-component,
    .p-inputgroup > .p-floatlabel:first-child > .p-component,
    .p-inputgroup > .p-floatlabel:first-child > .p-inputwrapper > .p-component,
    .p-inputgroup > .p-iftalabel:first-child > .p-component,
    .p-inputgroup > .p-iftalabel:first-child > .p-inputwrapper > .p-component {
        border-start-start-radius: dt('inputgroup.addon.border.radius');
        border-end-start-radius: dt('inputgroup.addon.border.radius');
    }

    .p-inputgroupaddon:last-child,
    .p-inputgroup > .p-component:last-child,
    .p-inputgroup > .p-inputwrapper:last-child > .p-component,
    .p-inputgroup > .p-iconfield:last-child > .p-component,
    .p-inputgroup > .p-floatlabel:last-child > .p-component,
    .p-inputgroup > .p-floatlabel:last-child > .p-inputwrapper > .p-component,
    .p-inputgroup > .p-iftalabel:last-child > .p-component,
    .p-inputgroup > .p-iftalabel:last-child > .p-inputwrapper > .p-component {
        border-start-end-radius: dt('inputgroup.addon.border.radius');
        border-end-end-radius: dt('inputgroup.addon.border.radius');
    }

    .p-inputgroup .p-component:focus,
    .p-inputgroup .p-component.p-focus,
    .p-inputgroup .p-inputwrapper-focus,
    .p-inputgroup .p-component:focus ~ label,
    .p-inputgroup .p-component.p-focus ~ label,
    .p-inputgroup .p-inputwrapper-focus ~ label,
    .p-inputgroup .p-floatlabel .p-inputwrapper ~ label,
    .p-inputgroup .p-iftalabel .p-inputwrapper ~ label {
        z-index: 1;
    }

    .p-inputgroup > .p-button:not(.p-button-icon-only) {
        width: auto;
    }

    .p-inputgroup .p-iconfield + .p-iconfield .p-inputtext {
        border-inline-start: 0;
    }
`;var j=["*"],T=`
    ${M}

    /*For PrimeNG*/

    .p-inputgroup > .p-component,
    .p-inputgroup > .p-inputwrapper > .p-component,
    .p-inputgroup:first-child > p-button > .p-button,
    .p-inputgroup > .p-floatlabel > .p-component,
    .p-inputgroup > .p-floatlabel > .p-inputwrapper > .p-component,
    .p-inputgroup > .p-iftalabel > .p-component,
    .p-inputgroup > .p-iftalabel > .p-inputwrapper > .p-component {
        border-radius: 0;
        margin: 0;
    }

    .p-inputgroup p-button:first-child,
    .p-inputgroup p-button:last-child {
        display: inline-flex;
    }

    .p-inputgroup:has(> p-button:first-child) .p-button {
        border-start-start-radius: dt('inputgroup.addon.border.radius');
        border-end-start-radius: dt('inputgroup.addon.border.radius');
    }

    .p-inputgroup:has(> p-button:last-child) .p-button {
        border-start-end-radius: dt('inputgroup.addon.border.radius');
        border-end-end-radius: dt('inputgroup.addon.border.radius');
    }

    .p-inputgroup > p-inputmask > .p-inputtext {
        width: 100%;
    }
`,G={root:({instance:n})=>["p-inputgroup",{"p-inputgroup-fluid":n.fluid}]},C=(()=>{class n extends I{name="inputgroup";style=T;classes=G;static \u0275fac=(()=>{let p;return function(t){return(p||(p=r(n)))(t||n)}})();static \u0275prov=d({token:n,factory:n.\u0275fac})}return n})();var x=new s("INPUTGROUP_INSTANCE"),k=(()=>{class n extends w{componentName="InputGroup";_componentStyle=e(C);$pcInputGroup=e(x,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=e(i,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}styleClass;static \u0275fac=(()=>{let p;return function(t){return(p||(p=r(n)))(t||n)}})();static \u0275cmp=l({type:n,selectors:[["p-inputgroup"],["p-inputGroup"],["p-input-group"]],hostVars:2,hostBindings:function(o,t){o&2&&h(t.cn(t.cx("root"),t.styleClass))},inputs:{styleClass:"styleClass"},features:[y([C,{provide:x,useExisting:n},{provide:v,useExisting:n}]),f([i]),g],ngContentSelectors:j,decls:1,vars:0,template:function(o,t){o&1&&(m(),b(0))},dependencies:[N],encapsulation:2})}return n})(),Q=(()=>{class n{static \u0275fac=function(o){return new(o||n)};static \u0275mod=c({type:n});static \u0275inj=a({imports:[k,u,u]})}return n})();var P=["*"],E={root:"p-inputgroupaddon"},F=(()=>{class n extends I{name="inputgroupaddon";classes=E;static \u0275fac=(()=>{let p;return function(t){return(p||(p=r(n)))(t||n)}})();static \u0275prov=d({token:n,factory:n.\u0275fac})}return n})(),A=new s("INPUTGROUPADDON_INSTANCE"),U=(()=>{class n extends w{componentName="InputGroupAddon";_componentStyle=e(F);$pcInputGroupAddon=e(A,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=e(i,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}style;styleClass;get hostStyle(){return this.style}static \u0275fac=(()=>{let p;return function(t){return(p||(p=r(n)))(t||n)}})();static \u0275cmp=l({type:n,selectors:[["p-inputgroup-addon"],["p-inputGroupAddon"]],hostVars:4,hostBindings:function(o,t){o&2&&(D(t.hostStyle),h(t.cn(t.cx("root"),t.styleClass)))},inputs:{style:"style",styleClass:"styleClass"},features:[y([F,{provide:A,useExisting:n},{provide:v,useExisting:n}]),f([i]),g],ngContentSelectors:P,decls:1,vars:0,template:function(o,t){o&1&&(m(),b(0))},dependencies:[N],encapsulation:2})}return n})(),dn=(()=>{class n{static \u0275fac=function(o){return new(o||n)};static \u0275mod=c({type:n});static \u0275inj=a({imports:[U,u,u]})}return n})();export{k as a,Q as b,U as c,dn as d};
