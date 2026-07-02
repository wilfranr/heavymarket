import{a as ie}from"./chunk-UFAZVT43.js";import{$ as ne,Z as ee,aa as te,ba as v}from"./chunk-6GBDMTCE.js";import{J as Y,K as x,L as Z}from"./chunk-735KUJFF.js";import{j as U,l as J,p as W,w as X}from"./chunk-LWZ5NFGU.js";import{Aa as m,G as I,Ia as f,Ib as q,Sa as c,Ta as _,Ua as g,Va as z,Yb as G,Za as w,_a as T,ab as h,ca as A,d as V,e as M,fb as u,g as S,ga as s,hb as r,i as y,ib as R,jb as K,kb as L,mb as k,nb as E,o as p,p as l,q as P,qc as B,rb as O,ua as D,ub as Q,va as N,vb as d,w as C,wb as H,xb as $,ya as j,za as F}from"./chunk-5FPXF5CH.js";var oe=`
    .p-chip {
        display: inline-flex;
        align-items: center;
        background: dt('chip.background');
        color: dt('chip.color');
        border-radius: dt('chip.border.radius');
        padding-block: dt('chip.padding.y');
        padding-inline: dt('chip.padding.x');
        gap: dt('chip.gap');
    }

    .p-chip-icon {
        color: dt('chip.icon.color');
        font-size: dt('chip.icon.size');
        width: dt('chip.icon.size');
        height: dt('chip.icon.size');
    }

    .p-chip-image {
        border-radius: 50%;
        width: dt('chip.image.width');
        height: dt('chip.image.height');
        margin-inline-start: calc(-1 * dt('chip.padding.y'));
    }

    .p-chip:has(.p-chip-remove-icon) {
        padding-inline-end: dt('chip.padding.y');
    }

    .p-chip:has(.p-chip-image) {
        padding-block-start: calc(dt('chip.padding.y') / 2);
        padding-block-end: calc(dt('chip.padding.y') / 2);
    }

    .p-chip-remove-icon {
        cursor: pointer;
        font-size: dt('chip.remove.icon.size');
        width: dt('chip.remove.icon.size');
        height: dt('chip.remove.icon.size');
        color: dt('chip.remove.icon.color');
        border-radius: 50%;
        transition:
            outline-color dt('chip.transition.duration'),
            box-shadow dt('chip.transition.duration');
        outline-color: transparent;
    }

    .p-chip-remove-icon:focus-visible {
        box-shadow: dt('chip.remove.icon.focus.ring.shadow');
        outline: dt('chip.remove.icon.focus.ring.width') dt('chip.remove.icon.focus.ring.style') dt('chip.remove.icon.focus.ring.color');
        outline-offset: dt('chip.remove.icon.focus.ring.offset');
    }
`;var ae=["removeicon"],se=["*"];function pe(n,a){if(n&1){let e=h();_(0,"img",4),u("error",function(i){p(e);let o=r();return l(o.imageError(i))}),g()}if(n&2){let e=r();d(e.cx("image")),c("pBind",e.ptm("image"))("src",e.image,A)("alt",e.alt)}}function le(n,a){if(n&1&&z(0,"span",6),n&2){let e=r(2);d(e.icon),c("pBind",e.ptm("icon"))("ngClass",e.cx("icon"))}}function de(n,a){if(n&1&&m(0,le,1,4,"span",5),n&2){let e=r();c("ngIf",e.icon)}}function me(n,a){if(n&1&&(_(0,"div",7),H(1),g()),n&2){let e=r();d(e.cx("label")),c("pBind",e.ptm("label")),s(),$(e.label)}}function _e(n,a){if(n&1){let e=h();_(0,"span",11),u("click",function(i){p(e);let o=r(3);return l(o.close(i))})("keydown",function(i){p(e);let o=r(3);return l(o.onKeydown(i))}),g()}if(n&2){let e=r(3);d(e.removeIcon),c("pBind",e.ptm("removeIcon"))("ngClass",e.cx("removeIcon")),f("tabindex",e.disabled?-1:0)("aria-label",e.removeAriaLabel)}}function ge(n,a){if(n&1){let e=h();P(),_(0,"svg",12),u("click",function(i){p(e);let o=r(3);return l(o.close(i))})("keydown",function(i){p(e);let o=r(3);return l(o.onKeydown(i))}),g()}if(n&2){let e=r(3);d(e.cx("removeIcon")),c("pBind",e.ptm("removeIcon")),f("tabindex",e.disabled?-1:0)("aria-label",e.removeAriaLabel)}}function fe(n,a){if(n&1&&(w(0),m(1,_e,1,6,"span",9)(2,ge,1,5,"svg",10),T()),n&2){let e=r(2);s(),c("ngIf",e.removeIcon),s(),c("ngIf",!e.removeIcon)}}function he(n,a){}function ue(n,a){n&1&&m(0,he,0,0,"ng-template")}function ve(n,a){if(n&1){let e=h();_(0,"span",13),u("click",function(i){p(e);let o=r(2);return l(o.close(i))})("keydown",function(i){p(e);let o=r(2);return l(o.onKeydown(i))}),m(1,ue,1,0,null,14),g()}if(n&2){let e=r(2);d(e.cx("removeIcon")),c("pBind",e.ptm("removeIcon")),f("tabindex",e.disabled?-1:0)("aria-label",e.removeAriaLabel),s(),c("ngTemplateOutlet",e.removeIconTemplate||e._removeIconTemplate)}}function be(n,a){if(n&1&&(w(0),m(1,fe,3,2,"ng-container",3)(2,ve,2,6,"span",8),T()),n&2){let e=r();s(),c("ngIf",!e.removeIconTemplate&&!e._removeIconTemplate),s(),c("ngIf",e.removeIconTemplate||e._removeIconTemplate)}}var ye={root:({instance:n})=>({display:!n.visible&&"none"})},xe={root:({instance:n})=>["p-chip p-component",{"p-disabled":n.disabled}],image:"p-chip-image",icon:"p-chip-icon",label:"p-chip-label",removeIcon:"p-chip-remove-icon"},re=(()=>{class n extends ee{name="chip";style=oe;classes=xe;inlineStyles=ye;static \u0275fac=(()=>{let e;return function(i){return(e||(e=I(n)))(i||n)}})();static \u0275prov=V({token:n,factory:n.\u0275fac})}return n})();var ce=new S("CHIP_INSTANCE"),Ce=(()=>{class n extends te{componentName="Chip";$pcChip=y(ce,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=y(v,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}label;icon;image;alt;styleClass;disabled=!1;removable=!1;removeIcon;onRemove=new C;onImageError=new C;visible=!0;get removeAriaLabel(){return this.config.getTranslation(Z.ARIA).removeLabel}get chipProps(){return this._chipProps}set chipProps(e){this._chipProps=e,e&&typeof e=="object"&&Object.entries(e).forEach(([t,i])=>this[`_${t}`]!==i&&(this[`_${t}`]=i))}_chipProps;_componentStyle=y(re);removeIconTemplate;templates;_removeIconTemplate;onAfterContentInit(){this.templates.forEach(e=>{e.getType()==="removeicon"?this._removeIconTemplate=e.template:this._removeIconTemplate=e.template})}onChanges(e){if(e.chipProps&&e.chipProps.currentValue){let{currentValue:t}=e.chipProps;t.label!==void 0&&(this.label=t.label),t.icon!==void 0&&(this.icon=t.icon),t.image!==void 0&&(this.image=t.image),t.alt!==void 0&&(this.alt=t.alt),t.styleClass!==void 0&&(this.styleClass=t.styleClass),t.removable!==void 0&&(this.removable=t.removable),t.removeIcon!==void 0&&(this.removeIcon=t.removeIcon)}}close(e){this.visible=!1,this.onRemove.emit(e)}onKeydown(e){(e.key==="Enter"||e.key==="Backspace")&&this.close(e)}imageError(e){this.onImageError.emit(e)}get dataP(){return this.cn({removable:this.removable})}static \u0275fac=(()=>{let e;return function(i){return(e||(e=I(n)))(i||n)}})();static \u0275cmp=D({type:n,selectors:[["p-chip"]],contentQueries:function(t,i,o){if(t&1&&L(o,ae,4)(o,Y,4),t&2){let b;k(b=E())&&(i.removeIconTemplate=b.first),k(b=E())&&(i.templates=b)}},hostVars:6,hostBindings:function(t,i){t&2&&(f("aria-label",i.label)("data-p",i.dataP),Q(i.sx("root")),d(i.cn(i.cx("root"),i.styleClass)))},inputs:{label:"label",icon:"icon",image:"image",alt:"alt",styleClass:"styleClass",disabled:[2,"disabled","disabled",B],removable:[2,"removable","removable",B],removeIcon:"removeIcon",chipProps:"chipProps"},outputs:{onRemove:"onRemove",onImageError:"onImageError"},features:[q([re,{provide:ce,useExisting:n},{provide:ne,useExisting:n}]),j([v]),F],ngContentSelectors:se,decls:6,vars:4,consts:[["iconTemplate",""],[3,"pBind","class","src","alt","error",4,"ngIf","ngIfElse"],[3,"pBind","class",4,"ngIf"],[4,"ngIf"],[3,"error","pBind","src","alt"],[3,"pBind","class","ngClass",4,"ngIf"],[3,"pBind","ngClass"],[3,"pBind"],["role","button",3,"pBind","class","click","keydown",4,"ngIf"],["role","button",3,"pBind","class","ngClass","click","keydown",4,"ngIf"],["data-p-icon","times-circle","role","button",3,"pBind","class","click","keydown",4,"ngIf"],["role","button",3,"click","keydown","pBind","ngClass"],["data-p-icon","times-circle","role","button",3,"click","keydown","pBind"],["role","button",3,"click","keydown","pBind"],[4,"ngTemplateOutlet"]],template:function(t,i){if(t&1&&(R(),K(0),m(1,pe,1,5,"img",1)(2,de,1,1,"ng-template",null,0,G)(4,me,2,4,"div",2)(5,be,3,2,"ng-container",3)),t&2){let o=O(3);s(),c("ngIf",i.image)("ngIfElse",o),s(3),c("ngIf",i.label),s(),c("ngIf",i.removable)}},dependencies:[X,U,J,W,ie,x,v],encapsulation:2,changeDetection:0})}return n})(),He=(()=>{class n{static \u0275fac=function(t){return new(t||n)};static \u0275mod=N({type:n});static \u0275inj=M({imports:[Ce,x,x]})}return n})();export{Ce as a,He as b};
