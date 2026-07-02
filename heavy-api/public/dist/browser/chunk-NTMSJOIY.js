import{a as te}from"./chunk-6J4R3HWQ.js";import{a as ce}from"./chunk-DDW3IO3E.js";import{a as oe,e as ie}from"./chunk-RSJD6UOH.js";import{a as ne}from"./chunk-2FHHIGBA.js";import{$ as Z,Z as Y,ba as u,ca as ee}from"./chunk-6GBDMTCE.js";import{J as W,K as v,f as U,g as J}from"./chunk-735KUJFF.js";import{j as H,l as G,p as K,w as X}from"./chunk-LWZ5NFGU.js";import{A as S,Aa as p,G as y,Ia as l,Ib as Q,Mb as j,Sa as a,Ta as C,Ua as I,Va as f,Za as B,_a as w,c as T,cc as R,d as V,e as E,fb as P,g as N,ga as d,gc as M,hb as h,i as k,kb as O,lb as $,mb as m,nb as g,q as _,qc as b,rc as q,ua as z,ub as L,va as F,vb as s,w as x,ya as D,za as A}from"./chunk-5FPXF5CH.js";var ae=`
    .p-checkbox {
        position: relative;
        display: inline-flex;
        user-select: none;
        vertical-align: bottom;
        width: dt('checkbox.width');
        height: dt('checkbox.height');
    }

    .p-checkbox-input {
        cursor: pointer;
        appearance: none;
        position: absolute;
        inset-block-start: 0;
        inset-inline-start: 0;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        opacity: 0;
        z-index: 1;
        outline: 0 none;
        border: 1px solid transparent;
        border-radius: dt('checkbox.border.radius');
    }

    .p-checkbox-box {
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: dt('checkbox.border.radius');
        border: 1px solid dt('checkbox.border.color');
        background: dt('checkbox.background');
        width: dt('checkbox.width');
        height: dt('checkbox.height');
        transition:
            background dt('checkbox.transition.duration'),
            color dt('checkbox.transition.duration'),
            border-color dt('checkbox.transition.duration'),
            box-shadow dt('checkbox.transition.duration'),
            outline-color dt('checkbox.transition.duration');
        outline-color: transparent;
        box-shadow: dt('checkbox.shadow');
    }

    .p-checkbox-icon {
        transition-duration: dt('checkbox.transition.duration');
        color: dt('checkbox.icon.color');
        font-size: dt('checkbox.icon.size');
        width: dt('checkbox.icon.size');
        height: dt('checkbox.icon.size');
    }

    .p-checkbox:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box {
        border-color: dt('checkbox.hover.border.color');
    }

    .p-checkbox-checked .p-checkbox-box {
        border-color: dt('checkbox.checked.border.color');
        background: dt('checkbox.checked.background');
    }

    .p-checkbox-checked .p-checkbox-icon {
        color: dt('checkbox.icon.checked.color');
    }

    .p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box {
        background: dt('checkbox.checked.hover.background');
        border-color: dt('checkbox.checked.hover.border.color');
    }

    .p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-icon {
        color: dt('checkbox.icon.checked.hover.color');
    }

    .p-checkbox:not(.p-disabled):has(.p-checkbox-input:focus-visible) .p-checkbox-box {
        border-color: dt('checkbox.focus.border.color');
        box-shadow: dt('checkbox.focus.ring.shadow');
        outline: dt('checkbox.focus.ring.width') dt('checkbox.focus.ring.style') dt('checkbox.focus.ring.color');
        outline-offset: dt('checkbox.focus.ring.offset');
    }

    .p-checkbox-checked:not(.p-disabled):has(.p-checkbox-input:focus-visible) .p-checkbox-box {
        border-color: dt('checkbox.checked.focus.border.color');
    }

    .p-checkbox.p-invalid > .p-checkbox-box {
        border-color: dt('checkbox.invalid.border.color');
    }

    .p-checkbox.p-variant-filled .p-checkbox-box {
        background: dt('checkbox.filled.background');
    }

    .p-checkbox-checked.p-variant-filled .p-checkbox-box {
        background: dt('checkbox.checked.background');
    }

    .p-checkbox-checked.p-variant-filled:not(.p-disabled):has(.p-checkbox-input:hover) .p-checkbox-box {
        background: dt('checkbox.checked.hover.background');
    }

    .p-checkbox.p-disabled {
        opacity: 1;
    }

    .p-checkbox.p-disabled .p-checkbox-box {
        background: dt('checkbox.disabled.background');
        border-color: dt('checkbox.checked.disabled.border.color');
    }

    .p-checkbox.p-disabled .p-checkbox-box .p-checkbox-icon {
        color: dt('checkbox.icon.disabled.color');
    }

    .p-checkbox-sm,
    .p-checkbox-sm .p-checkbox-box {
        width: dt('checkbox.sm.width');
        height: dt('checkbox.sm.height');
    }

    .p-checkbox-sm .p-checkbox-icon {
        font-size: dt('checkbox.icon.sm.size');
        width: dt('checkbox.icon.sm.size');
        height: dt('checkbox.icon.sm.size');
    }

    .p-checkbox-lg,
    .p-checkbox-lg .p-checkbox-box {
        width: dt('checkbox.lg.width');
        height: dt('checkbox.lg.height');
    }

    .p-checkbox-lg .p-checkbox-icon {
        font-size: dt('checkbox.icon.lg.size');
        width: dt('checkbox.icon.lg.size');
        height: dt('checkbox.icon.lg.size');
    }
`;var se=["icon"],he=["input"],pe=(t,r,e)=>({checked:t,class:r,dataP:e});function be(t,r){if(t&1&&f(0,"span",8),t&2){let e=h(3);s(e.cx("icon")),a("ngClass",e.checkboxIcon)("pBind",e.ptm("icon")),l("data-p",e.dataP)}}function ue(t,r){if(t&1&&(_(),f(0,"svg",9)),t&2){let e=h(3);s(e.cx("icon")),a("pBind",e.ptm("icon")),l("data-p",e.dataP)}}function ke(t,r){if(t&1&&(B(0),p(1,be,1,5,"span",6)(2,ue,1,4,"svg",7),w()),t&2){let e=h(2);d(),a("ngIf",e.checkboxIcon),d(),a("ngIf",!e.checkboxIcon)}}function xe(t,r){if(t&1&&(_(),f(0,"svg",10)),t&2){let e=h(2);s(e.cx("icon")),a("pBind",e.ptm("icon")),l("data-p",e.dataP)}}function fe(t,r){if(t&1&&(B(0),p(1,ke,3,2,"ng-container",3)(2,xe,1,4,"svg",5),w()),t&2){let e=h();d(),a("ngIf",e.checked),d(),a("ngIf",e._indeterminate())}}function me(t,r){}function ge(t,r){t&1&&p(0,me,0,0,"ng-template")}var ve=`
    ${ae}

    /* For PrimeNG */
    p-checkBox.ng-invalid.ng-dirty .p-checkbox-box,
    p-check-box.ng-invalid.ng-dirty .p-checkbox-box,
    p-checkbox.ng-invalid.ng-dirty .p-checkbox-box {
        border-color: dt('checkbox.invalid.border.color');
    }
`,_e={root:({instance:t})=>["p-checkbox p-component",{"p-checkbox-checked p-highlight":t.checked,"p-disabled":t.$disabled(),"p-invalid":t.invalid(),"p-variant-filled":t.$variant()==="filled","p-checkbox-sm p-inputfield-sm":t.size()==="small","p-checkbox-lg p-inputfield-lg":t.size()==="large"}],box:"p-checkbox-box",input:"p-checkbox-input",icon:"p-checkbox-icon"},re=(()=>{class t extends Y{name="checkbox";style=ve;classes=_e;static \u0275fac=(()=>{let e;return function(n){return(e||(e=y(t)))(n||t)}})();static \u0275prov=V({token:t,factory:t.\u0275fac})}return t})();var de=new N("CHECKBOX_INSTANCE"),ye={provide:oe,useExisting:T(()=>le),multi:!0},le=(()=>{class t extends ce{componentName="Checkbox";hostName="";value;binary;ariaLabelledBy;ariaLabel;tabindex;inputId;inputStyle;styleClass;inputClass;indeterminate=!1;formControl;checkboxIcon;readonly;autofocus;trueValue=!0;falseValue=!1;variant=M();size=M();onChange=new x;onFocus=new x;onBlur=new x;inputViewChild;get checked(){return this._indeterminate()?!1:this.binary?this.modelValue()===this.trueValue:J(this.value,this.modelValue())}_indeterminate=S(void 0);checkboxIconTemplate;templates;_checkboxIconTemplate;focused=!1;_componentStyle=k(re);bindDirectiveInstance=k(u,{self:!0});$pcCheckbox=k(de,{optional:!0,skipSelf:!0})??void 0;$variant=R(()=>this.variant()||this.config.inputStyle()||this.config.inputVariant());onAfterContentInit(){this.templates?.forEach(e=>{switch(e.getType()){case"icon":this._checkboxIconTemplate=e.template;break;case"checkboxicon":this._checkboxIconTemplate=e.template;break}})}onChanges(e){e.indeterminate&&this._indeterminate.set(e.indeterminate.currentValue)}onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}updateModel(e){let o,n=this.injector.get(ie,null,{optional:!0,self:!0}),i=n&&!this.formControl?n.value:this.modelValue();this.binary?(o=this._indeterminate()?this.trueValue:this.checked?this.falseValue:this.trueValue,this.writeModelValue(o),this.onModelChange(o)):(this.checked||this._indeterminate()?o=i.filter(c=>!U(c,this.value)):o=i?[...i,this.value]:[this.value],this.onModelChange(o),this.writeModelValue(o),this.formControl&&this.formControl.setValue(o)),this._indeterminate()&&this._indeterminate.set(!1),this.onChange.emit({checked:o,originalEvent:e})}handleChange(e){this.readonly||this.updateModel(e)}onInputFocus(e){this.focused=!0,this.onFocus.emit(e)}onInputBlur(e){this.focused=!1,this.onBlur.emit(e),this.onModelTouched()}focus(){this.inputViewChild?.nativeElement.focus()}writeControlValue(e,o){o(e),this.cd.markForCheck()}get dataP(){return this.cn({invalid:this.invalid(),checked:this.checked,disabled:this.$disabled(),filled:this.$variant()==="filled",[this.size()]:this.size()})}static \u0275fac=(()=>{let e;return function(n){return(e||(e=y(t)))(n||t)}})();static \u0275cmp=z({type:t,selectors:[["p-checkbox"],["p-checkBox"],["p-check-box"]],contentQueries:function(o,n,i){if(o&1&&O(i,se,4)(i,W,4),o&2){let c;m(c=g())&&(n.checkboxIconTemplate=c.first),m(c=g())&&(n.templates=c)}},viewQuery:function(o,n){if(o&1&&$(he,5),o&2){let i;m(i=g())&&(n.inputViewChild=i.first)}},hostVars:6,hostBindings:function(o,n){o&2&&(l("data-p-highlight",n.checked)("data-p-checked",n.checked)("data-p-disabled",n.$disabled())("data-p",n.dataP),s(n.cn(n.cx("root"),n.styleClass)))},inputs:{hostName:"hostName",value:"value",binary:[2,"binary","binary",b],ariaLabelledBy:"ariaLabelledBy",ariaLabel:"ariaLabel",tabindex:[2,"tabindex","tabindex",q],inputId:"inputId",inputStyle:"inputStyle",styleClass:"styleClass",inputClass:"inputClass",indeterminate:[2,"indeterminate","indeterminate",b],formControl:"formControl",checkboxIcon:"checkboxIcon",readonly:[2,"readonly","readonly",b],autofocus:[2,"autofocus","autofocus",b],trueValue:"trueValue",falseValue:"falseValue",variant:[1,"variant"],size:[1,"size"]},outputs:{onChange:"onChange",onFocus:"onFocus",onBlur:"onBlur"},features:[Q([ye,re,{provide:de,useExisting:t},{provide:Z,useExisting:t}]),D([u]),A],decls:5,vars:26,consts:[["input",""],["type","checkbox",3,"focus","blur","change","checked","pBind"],[3,"pBind"],[4,"ngIf"],[4,"ngTemplateOutlet","ngTemplateOutletContext"],["data-p-icon","minus",3,"class","pBind",4,"ngIf"],[3,"class","ngClass","pBind",4,"ngIf"],["data-p-icon","check",3,"class","pBind",4,"ngIf"],[3,"ngClass","pBind"],["data-p-icon","check",3,"pBind"],["data-p-icon","minus",3,"pBind"]],template:function(o,n){o&1&&(C(0,"input",1,0),P("focus",function(c){return n.onInputFocus(c)})("blur",function(c){return n.onInputBlur(c)})("change",function(c){return n.handleChange(c)}),I(),C(2,"div",2),p(3,fe,3,2,"ng-container",3)(4,ge,1,0,null,4),I()),o&2&&(L(n.inputStyle),s(n.cn(n.cx("input"),n.inputClass)),a("checked",n.checked)("pBind",n.ptm("input")),l("id",n.inputId)("value",n.value)("name",n.name())("tabindex",n.tabindex)("required",n.required()?"":void 0)("readonly",n.readonly?"":void 0)("disabled",n.$disabled()?"":void 0)("aria-labelledby",n.ariaLabelledBy)("aria-label",n.ariaLabel),d(2),s(n.cx("box")),a("pBind",n.ptm("box")),l("data-p",n.dataP),d(),a("ngIf",!n.checkboxIconTemplate&&!n._checkboxIconTemplate),d(),a("ngTemplateOutlet",n.checkboxIconTemplate||n._checkboxIconTemplate)("ngTemplateOutletContext",j(22,pe,n.checked,n.cx("icon"),n.dataP)))},dependencies:[X,H,G,K,v,ne,te,ee,u],encapsulation:2,changeDetection:0})}return t})(),Ue=(()=>{class t{static \u0275fac=function(o){return new(o||t)};static \u0275mod=F({type:t});static \u0275inj=E({imports:[le,v,v]})}return t})();export{le as a,Ue as b};
