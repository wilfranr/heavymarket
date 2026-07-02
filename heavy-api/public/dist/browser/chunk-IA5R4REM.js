import{a as ot}from"./chunk-XB6PQF6P.js";import{a as nt}from"./chunk-6PDKBLTJ.js";import{a as rt}from"./chunk-3ZCBMBS7.js";import{a as Ye}from"./chunk-2EJX7JJA.js";import{a as Ge}from"./chunk-U24KZ6HF.js";import{a as Ke}from"./chunk-HTVXTRFC.js";import{e as Xe,f as Ze}from"./chunk-R3EM6VQ5.js";import{b as it}from"./chunk-Z7BAEBDW.js";import{a as Ve,b as Re}from"./chunk-WFZIEJYO.js";import{e as ve,g as Ce,h as Me,m as Se}from"./chunk-HQVQYQH7.js";import{a as et,b as tt}from"./chunk-46OTPBL6.js";import{c as we}from"./chunk-UFAZVT43.js";import{a as ze,b as We}from"./chunk-5GBLFHFW.js";import{b as Qe,c as Je}from"./chunk-YL2SPGAS.js";import{a as Y,b as K}from"./chunk-LOQ3JJIR.js";import{A as Be,c as Te,d as G,f as Fe,g as qe,k as De,n as Le,o as Ne,p as Ae,q as Pe,v as Ue,x as Oe,z as $e}from"./chunk-RSJD6UOH.js";import{$ as Ie,Z as z,aa as W,ba as N,u as te,ua as He,v as Ee,va as je}from"./chunk-6GBDMTCE.js";import{F as ke,K as S}from"./chunk-735KUJFF.js";import{d as he}from"./chunk-TRR7HSZM.js";import{l as j,o as ye,w as T}from"./chunk-LWZ5NFGU.js";import{A as F,Aa as v,Ab as J,Bb as X,Cb as Z,F as se,G as I,Ia as C,Ib as $,Jb as B,La as q,Lb as be,Na as D,Oa as de,Qa as V,Ra as R,Sa as d,Ta as s,Ua as a,Va as u,Yb as H,ab as M,ba as Q,ca as le,d as A,e as P,fb as g,g as re,ga as p,hb as l,i as x,lb as ce,mb as me,nb as ue,o as f,p as _,q as ae,qc as ee,rb as E,rc as xe,sb as fe,ua as w,ub as _e,va as U,vb as b,w as k,wb as m,xb as L,ya as pe,yb as ge,za as O}from"./chunk-5FPXF5CH.js";import{Qa as oe}from"./chunk-CWEWLMB5.js";var at=`
    .p-steps {
        position: relative;
    }

    .p-steps-list {
        padding: 0;
        margin: 0;
        list-style-type: none;
        display: flex;
    }

    .p-steps-item {
        position: relative;
        display: flex;
        justify-content: center;
        flex: 1 1 auto;
    }

    .p-steps-item.p-disabled,
    .p-steps-item.p-disabled * {
        opacity: 1;
        pointer-events: auto;
        user-select: auto;
        cursor: auto;
    }

    .p-steps-item:before {
        content: ' ';
        border-top: 2px solid dt('steps.separator.background');
        width: 100%;
        top: 50%;
        left: 0;
        display: block;
        position: absolute;
        margin-top: calc(-1rem + 1px);
    }

    .p-steps-item:first-child::before {
        width: calc(50% + 1rem);
        transform: translateX(100%);
    }

    .p-steps-item:last-child::before {
        width: 50%;
    }

    .p-steps-item-link {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        overflow: hidden;
        text-decoration: none;
        transition:
            outline-color dt('steps.transition.duration'),
            box-shadow dt('steps.transition.duration');
        border-radius: dt('steps.item.link.border.radius');
        outline-color: transparent;
        gap: dt('steps.item.link.gap');
    }

    .p-steps-item-link:not(.p-disabled):focus-visible {
        box-shadow: dt('steps.item.link.focus.ring.shadow');
        outline: dt('steps.item.link.focus.ring.width') dt('steps.item.link.focus.ring.style') dt('steps.item.link.focus.ring.color');
        outline-offset: dt('steps.item.link.focus.ring.offset');
    }

    .p-steps-item-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        color: dt('steps.item.label.color');
        display: block;
        font-weight: dt('steps.item.label.font.weight');
    }

    .p-steps-item-number {
        display: flex;
        align-items: center;
        justify-content: center;
        color: dt('steps.item.number.color');
        border: 2px solid dt('steps.item.number.border.color');
        background: dt('steps.item.number.background');
        min-width: dt('steps.item.number.size');
        height: dt('steps.item.number.size');
        line-height: dt('steps.item.number.size');
        font-size: dt('steps.item.number.font.size');
        z-index: 1;
        border-radius: dt('steps.item.number.border.radius');
        position: relative;
        font-weight: dt('steps.item.number.font.weight');
    }

    .p-steps-item-number::after {
        content: ' ';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: dt('steps.item.number.border.radius');
        box-shadow: dt('steps.item.number.shadow');
    }

    .p-steps:not(.p-readonly) .p-steps-item {
        cursor: pointer;
    }

    .p-steps-item-active .p-steps-item-number {
        background: dt('steps.item.number.active.background');
        border-color: dt('steps.item.number.active.border.color');
        color: dt('steps.item.number.active.color');
    }

    .p-steps-item-active .p-steps-item-label {
        color: dt('steps.item.label.active.color');
    }
`;var gt=["list"],bt=(t,o)=>({item:t,index:o}),xt=()=>({exact:!1}),yt=(t,o)=>o.label;function ht(t,o){if(t&1&&(s(0,"span"),m(1),a()),t&2){let e=l(3).$implicit,n=l();b(n.cx("itemLabel")),p(),L(e.label)}}function vt(t,o){if(t&1&&u(0,"span",12),t&2){let e=l(3).$implicit,n=l();b(n.cx("itemLabel")),d("innerHTML",e.label,Q)}}function Ct(t,o){if(t&1){let e=M();s(0,"a",10),g("click",function(i){f(e);let r=l(2),c=r.$implicit,y=r.$index,h=l();return _(h.onItemClick(i,c,y))})("keydown",function(i){f(e);let r=l(2),c=r.$implicit,y=r.$index,h=l();return _(h.onItemKeydown(i,c,y))}),s(1,"span"),m(2),a(),v(3,ht,2,3,"span",11)(4,vt,1,3,"ng-template",null,3,H),a()}if(t&2){let e=E(5),n=l(2),i=n.$implicit,r=n.$index,c=l();b(c.cx("itemLink")),d("routerLink",i.routerLink)("queryParams",i.queryParams)("routerLinkActiveOptions",i.routerLinkActiveOptions||B(21,xt))("target",i.target)("fragment",i.fragment)("queryParamsHandling",i.queryParamsHandling)("preserveFragment",i.preserveFragment)("skipLocationChange",i.skipLocationChange)("replaceUrl",i.replaceUrl)("state",i.state),C("tabindex",c.getItemTabIndex(i,r))("aria-expanded",r===c.activeIndex)("aria-disabled",i.disabled||c.readonly&&r!==c.activeIndex)("ariaCurrentWhenActive",c.exact?"step":void 0),p(),b(c.cx("itemNumber")),p(),L(r+1),p(),d("ngIf",i.escape!==!1)("ngIfElse",e)}}function Mt(t,o){if(t&1&&(s(0,"span"),m(1),a()),t&2){let e=l(3).$implicit,n=l();b(n.cx("itemLabel")),p(),L(e.label)}}function St(t,o){if(t&1&&u(0,"span",12),t&2){let e=l(3).$implicit,n=l();b(n.cx("itemLabel")),d("innerHTML",e.label,Q)}}function Et(t,o){if(t&1){let e=M();s(0,"a",13),g("click",function(i){f(e);let r=l(2),c=r.$implicit,y=r.$index,h=l();return _(h.onItemClick(i,c,y))})("keydown",function(i){f(e);let r=l(2),c=r.$implicit,y=r.$index,h=l();return _(h.onItemKeydown(i,c,y))}),s(1,"span"),m(2),a(),v(3,Mt,2,3,"span",11)(4,St,1,3,"ng-template",null,4,H),a()}if(t&2){let e=E(5),n=l(2),i=n.$implicit,r=n.$index,c=l();b(c.cx("itemLink")),d("target",i.target),C("href",i.url,le)("tabindex",c.getItemTabIndex(i,r))("aria-expanded",r===c.activeIndex)("aria-disabled",i.disabled||c.readonly&&r!==c.activeIndex)("ariaCurrentWhenActive",c.exact&&(!i.disabled||c.readonly)?"step":void 0),p(),b(c.cx("itemNumber")),p(),L(r+1),p(),d("ngIf",i.escape!==!1)("ngIfElse",e)}}function kt(t,o){if(t&1&&(s(0,"li",8,1),v(2,Ct,6,22,"a",9)(3,Et,6,13,"ng-template",null,2,H),a()),t&2){let e=E(4),n=l(),i=n.$implicit,r=n.$index,c=l();b(c.cx("item",be(10,bt,i,r))),d("ngStyle",i.style)("tooltipOptions",i.tooltipOptions)("pTooltipUnstyled",c.unstyled()),C("aria-current",c.isActive(i,r)?"step":void 0)("id",i.id)("data-pc-section","menuitem"),p(2),d("ngIf",c.isClickableRouterLink(i))("ngIfElse",e)}}function It(t,o){if(t&1&&v(0,kt,5,13,"li",7),t&2){let e=o.$implicit;d("ngIf",e.visible!==!1)}}var wt={root:({instance:t})=>["p-steps p-component",{"p-readonly":t.readonly}],list:"p-steps-list",item:({instance:t,item:o,index:e})=>["p-steps-item",{"p-steps-item-active":t.isActive(o,e),"p-disabled":t.isItemDisabled(o,e)}],itemLink:"p-steps-item-link",itemNumber:"p-steps-item-number",itemLabel:"p-steps-item-label"},st=(()=>{class t extends z{name="steps";style=at;classes=wt;static \u0275fac=(()=>{let e;return function(i){return(e||(e=I(t)))(i||t)}})();static \u0275prov=A({token:t,factory:t.\u0275fac})}return t})();var Tt=(()=>{class t extends W{componentName="Steps";activeIndex=0;model;readonly=!0;style;styleClass;exact=!0;activeIndexChange=new k;listViewChild;router=x(Ce);route=x(ve);_componentStyle=x(st);subscription;onInit(){this.subscription=this.router.events.subscribe(()=>this.cd.markForCheck())}onItemClick(e,n,i){if(this.readonly||n.disabled){e.preventDefault();return}this.activeIndexChange.emit(i),!n.url&&!n.routerLink&&e.preventDefault(),n.command&&n.command({originalEvent:e,item:n,index:i})}onItemKeydown(e,n,i){switch(e.code){case"ArrowRight":{this.navigateToNextItem(e.target),e.preventDefault();break}case"ArrowLeft":{this.navigateToPrevItem(e.target),e.preventDefault();break}case"Home":{this.navigateToFirstItem(e.target),e.preventDefault();break}case"End":{this.navigateToLastItem(e.target),e.preventDefault();break}case"Tab":if(i!==(this.activeIndex??-1)){let r=te(this.listViewChild?.nativeElement,'[data-pc-section="menuitem"]');r[i].children[0].tabIndex="-1",r[this.activeIndex??0].children[0].tabIndex="0"}break;case"Enter":case"Space":{this.onItemClick(e,n,i),e.preventDefault();break}default:break}}navigateToNextItem(e){let n=this.findNextItem(e);n&&this.setFocusToMenuitem(e,n)}navigateToPrevItem(e){let n=this.findPrevItem(e);n&&this.setFocusToMenuitem(e,n)}navigateToFirstItem(e){let n=this.findFirstItem();n&&this.setFocusToMenuitem(e,n)}navigateToLastItem(e){let n=this.findLastItem();n&&this.setFocusToMenuitem(e,n)}findNextItem(e){let n=e.parentElement.nextElementSibling;return n?n.children[0]:null}findPrevItem(e){let n=e.parentElement.previousElementSibling;return n?n.children[0]:null}findFirstItem(){let e=Ee(this.listViewChild?.nativeElement,'[data-pc-section="menuitem"]');return e?e.children[0]:null}findLastItem(){let e=te(this.listViewChild?.nativeElement,'[data-pc-section="menuitem"]');return e?e[e.length-1].children[0]:null}setFocusToMenuitem(e,n){e.tabIndex="-1",n.tabIndex="0",n.focus()}isClickableRouterLink(e){return e.routerLink&&!this.readonly&&!e.disabled}isItemDisabled(e,n){return e.disabled||this.readonly&&!this.isActive(e,n)}isActive(e,n){if(e.routerLink){let i=Array.isArray(e.routerLink)?e.routerLink:[e.routerLink];return this.router.isActive(this.router.createUrlTree(i,{relativeTo:this.route}).toString(),!1)}return n===this.activeIndex}getItemTabIndex(e,n){return e.disabled?"-1":!e.disabled&&this.activeIndex===n?e.tabindex||"0":e.tabindex??"-1"}onDestroy(){this.subscription&&this.subscription.unsubscribe()}static \u0275fac=(()=>{let e;return function(i){return(e||(e=I(t)))(i||t)}})();static \u0275cmp=w({type:t,selectors:[["p-steps"]],viewQuery:function(n,i){if(n&1&&ce(gt,5),n&2){let r;me(r=ue())&&(i.listViewChild=r.first)}},inputs:{activeIndex:[2,"activeIndex","activeIndex",xe],model:"model",readonly:[2,"readonly","readonly",ee],style:"style",styleClass:"styleClass",exact:[2,"exact","exact",ee]},outputs:{activeIndexChange:"activeIndexChange"},features:[$([st]),O],decls:5,vars:7,consts:[["list",""],["menuitem",""],["elseBlock",""],["htmlLabel",""],["htmlRouteLabel",""],[3,"ngStyle"],["pTooltip","",3,"class","ngStyle","tooltipOptions","pTooltipUnstyled"],["pTooltip","",3,"class","ngStyle","tooltipOptions","pTooltipUnstyled",4,"ngIf"],["pTooltip","",3,"ngStyle","tooltipOptions","pTooltipUnstyled"],["role","link",3,"routerLink","queryParams","routerLinkActiveOptions","class","target","fragment","queryParamsHandling","preserveFragment","skipLocationChange","replaceUrl","state","click","keydown",4,"ngIf","ngIfElse"],["role","link",3,"click","keydown","routerLink","queryParams","routerLinkActiveOptions","target","fragment","queryParamsHandling","preserveFragment","skipLocationChange","replaceUrl","state"],[3,"class",4,"ngIf","ngIfElse"],[3,"innerHTML"],["role","link",3,"click","keydown","target"]],template:function(n,i){n&1&&(s(0,"nav",5)(1,"ul",null,0),V(3,It,1,1,"li",6,yt),a()()),n&2&&(b(i.cn(i.cx("root"),i.styleClass)),d("ngStyle",i.style),C("data-pc-name","steps"),p(),b(i.cx("list")),C("data-pc-section","menu"),p(2),R(i.model))},dependencies:[T,j,ye,Se,Me,K,Y,S],encapsulation:2,changeDetection:0})}return t})(),pi=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=U({type:t});static \u0275inj=P({imports:[Tt,S,S]})}return t})();var pt=`
    .p-progressspinner {
        position: relative;
        margin: 0 auto;
        width: 100px;
        height: 100px;
        display: inline-block;
    }

    .p-progressspinner::before {
        content: '';
        display: block;
        padding-top: 100%;
    }

    .p-progressspinner-spin {
        height: 100%;
        transform-origin: center center;
        width: 100%;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto;
        animation: p-progressspinner-rotate 2s linear infinite;
    }

    .p-progressspinner-circle {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: 0;
        stroke: dt('progressspinner.colorOne');
        animation:
            p-progressspinner-dash 1.5s ease-in-out infinite,
            p-progressspinner-color 6s ease-in-out infinite;
        stroke-linecap: round;
    }

    @keyframes p-progressspinner-rotate {
        100% {
            transform: rotate(360deg);
        }
    }
    @keyframes p-progressspinner-dash {
        0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
        }
        50% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -35px;
        }
        100% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -124px;
        }
    }
    @keyframes p-progressspinner-color {
        100%,
        0% {
            stroke: dt('progressspinner.color.one');
        }
        40% {
            stroke: dt('progressspinner.color.two');
        }
        66% {
            stroke: dt('progressspinner.color.three');
        }
        80%,
        90% {
            stroke: dt('progressspinner.color.four');
        }
    }
`;var Ft={root:()=>["p-progressspinner"],spin:"p-progressspinner-spin",circle:"p-progressspinner-circle"},dt=(()=>{class t extends z{name="progressspinner";style=pt;classes=Ft;static \u0275fac=(()=>{let e;return function(i){return(e||(e=I(t)))(i||t)}})();static \u0275prov=A({token:t,factory:t.\u0275fac})}return t})();var ct=new re("PROGRESSSPINNER_INSTANCE"),ie=(()=>{class t extends W{componentName="ProgressSpinner";$pcProgressSpinner=x(ct,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=x(N,{self:!0});styleClass;strokeWidth="2";fill="none";animationDuration="2s";ariaLabel;onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}_componentStyle=x(dt);static \u0275fac=(()=>{let e;return function(i){return(e||(e=I(t)))(i||t)}})();static \u0275cmp=w({type:t,selectors:[["p-progressSpinner"],["p-progress-spinner"],["p-progressspinner"]],hostVars:5,hostBindings:function(n,i){n&2&&(C("aria-label",i.ariaLabel)("role","progressbar")("aria-busy",!0),b(i.cn(i.cx("root"),i.styleClass)))},inputs:{styleClass:"styleClass",strokeWidth:"strokeWidth",fill:"fill",animationDuration:"animationDuration",ariaLabel:"ariaLabel"},features:[$([dt,{provide:ct,useExisting:t},{provide:Ie,useExisting:t}]),pe([N]),O],decls:2,vars:10,consts:[["viewBox","25 25 50 50",3,"pBind"],["cx","50","cy","50","r","20","stroke-miterlimit","10",3,"pBind"]],template:function(n,i){n&1&&(ae(),s(0,"svg",0),u(1,"circle",1),a()),n&2&&(b(i.cx("spin")),fe("animation-duration",i.animationDuration),d("pBind",i.ptm("spin")),p(),b(i.cx("circle")),d("pBind",i.ptm("circle")),C("fill",i.fill)("stroke-width",i.strokeWidth))},dependencies:[T,S,N],encapsulation:2,changeDetection:0})}return t})(),mt=(()=>{class t{static \u0275fac=function(n){return new(n||t)};static \u0275mod=U({type:t});static \u0275inj=P({imports:[ie,S,S]})}return t})();var Dt=()=>({width:"750px"});function Lt(t,o){t&1&&(s(0,"div",3),m(1,"Registre una nueva m\xE1quina. Se asociar\xE1 autom\xE1ticamente al tercero seleccionado."),a())}function Nt(t,o){t&1&&(s(0,"div",4),u(1,"p-progressSpinner",7),s(2,"span",8),m(3,"Cargando m\xE1quina..."),a()())}function At(t,o){if(t&1&&(s(0,"span",66),m(1),a()),t&2){let e,n=l().$implicit;p(),ge(" ",(e=n.get("fotoPlacaFile"))==null?null:e.value.name," ")}}function Pt(t,o){t&1&&(s(0,"span",67),m(1,"Sin foto placa"),a())}function Ut(t,o){if(t&1){let e=M();s(0,"div",33)(1,"div",45)(2,"p-button",46),g("onClick",function(){let i=f(e).$index,r=l(2);return _(r.duplicateComponente(i))}),a(),s(3,"p-button",47),g("onClick",function(){let i=f(e).$index,r=l(2);return _(r.removeComponente(i))}),a()(),s(4,"div",48)(5,"div")(6,"label",49),m(7,"Sistema"),a(),u(8,"p-select",50),a(),s(9,"div")(10,"label",49),m(11,"Marca / OEM"),a(),u(12,"p-select",51),a(),s(13,"div")(14,"label",49),m(15,"Modelo"),a(),u(16,"input",52),a(),s(17,"div")(18,"label",49),m(19,"Serie"),a(),u(20,"input",53),a(),s(21,"div",54)(22,"div",55)(23,"label",56),m(24,"Foto Placa y Observaciones"),a(),s(25,"div",57)(26,"p-button",58),g("onClick",function(){f(e);let i=E(37);return _(i.click())}),a(),s(27,"p-button",59),g("onClick",function(i){f(e);let r=E(29);return _(r.toggle(i))}),a(),s(28,"p-popover",null,0)(30,"div",60)(31,"label",61),m(32,"Observaciones del Componente"),a(),u(33,"textarea",62),a()(),v(34,At,2,1,"span",63)(35,Pt,2,0,"span",64),s(36,"input",65,1),g("change",function(i){let r=f(e).$index,c=l(2);return _(c.onFotoPlacaSelected(i.target.files[0],r))}),a()()()()()()}if(t&2){let e,n,i,r,c,y=o.$implicit,h=o.$index,ne=l(2);d("formGroupName",h),p(2),d("rounded",!0)("text",!0)("pTooltip","Duplicar"),p(),d("rounded",!0)("text",!0)("pTooltip","Eliminar"),p(5),d("options",ne.sistemas())("filter",!0),p(4),d("options",ne.marcasYFabricantes())("filter",!0),p(14),d("severity",(e=y.get("fotoPlacaFile"))!=null&&e.value?"success":"warn")("rounded",!0)("text",!0)("pTooltip",(n=y.get("fotoPlacaFile"))!=null&&n.value?"Foto seleccionada":"Adjuntar foto"),p(),d("severity",(i=y.get("comentario"))!=null&&i.value?"warn":"secondary")("rounded",!0)("text",!0)("pTooltip","Observaciones"),p(7),d("ngIf",(r=y.get("fotoPlacaFile"))==null?null:r.value),p(),d("ngIf",!((c=y.get("fotoPlacaFile"))!=null&&c.value))}}function Ot(t,o){t&1&&(s(0,"div",34),u(1,"i",68),s(2,"span",69),m(3,"No hay componentes adicionales"),a()())}function Vt(t,o){t&1&&(s(0,"div",70),u(1,"i",71),m(2," Archivo seleccionado "),a())}function Rt(t,o){t&1&&(s(0,"div",70),u(1,"i",71),m(2," Archivo seleccionado "),a())}function $t(t,o){if(t&1){let e=M();s(0,"p-button",72),g("onClick",function(){f(e);let i=l(2);return _(i.saveMaquina(!0))}),a()}if(t&2){let e=l(2);d("loading",e.loading)}}function Bt(t,o){if(t&1){let e=M();s(0,"form",9),g("ngSubmit",function(){f(e);let i=l();return _(i.saveMaquina())}),s(1,"div",10)(2,"div",11)(3,"label",12),m(4,"Tipo"),s(5,"span",13),m(6,"*"),a()(),s(7,"div",14),u(8,"p-select",15),s(9,"p-button",16),g("onClick",function(){f(e);let i=l();return _(i.openCreateTipoDialog())}),a()()(),s(10,"div",11)(11,"label",17),m(12,"Fabricante"),s(13,"span",13),m(14,"*"),a()(),u(15,"p-select",18),a(),s(16,"div",11)(17,"label",19),m(18,"Modelo"),s(19,"span",13),m(20,"*"),a()(),u(21,"input",20),a(),s(22,"div",11)(23,"label",21),m(24,"Serie"),a(),u(25,"input",22),a(),s(26,"div",23)(27,"label",24),m(28,"Arreglo"),a(),u(29,"input",25),a(),s(30,"div",26)(31,"div",27)(32,"div",28),u(33,"i",29),s(34,"h3",30),m(35,"Componentes"),a()(),s(36,"p-button",31),g("onClick",function(){f(e);let i=l();return _(i.addComponente())}),a()(),s(37,"div",32),V(38,Ut,38,21,"div",33,de,!1,Ot,4,0,"div",34),a()(),s(41,"div",35)(42,"div",36)(43,"label",37),m(44,"Foto M\xE1quina"),a(),s(45,"p-fileUpload",38),g("onSelect",function(i){f(e);let r=l();return _(r.onFileSelect(i,"foto"))}),a(),v(46,Vt,3,0,"div",39),a(),s(47,"div",36)(48,"label",37),m(49,"Foto Placa ID"),a(),s(50,"p-fileUpload",40),g("onSelect",function(i){f(e);let r=l();return _(r.onFileSelect(i,"fotoId"))}),a(),v(51,Rt,3,0,"div",39),a()()(),s(52,"div",41)(53,"p-button",42),g("onClick",function(){f(e);let i=l();return _(i.closeDialog())}),a(),q(54,$t,1,1,"p-button",43),u(55,"p-button",44),a()()}if(t&2){let e,n,i=l();d("formGroup",i.createMaquinaForm),p(8),d("options",i.tiposMaquina())("filter",!0),p(),d("rounded",!0),p(6),d("options",i.fabricantes())("filter",!0),p(21),d("rounded",!0),p(2),R(i.componentes.controls),p(7),d("showUploadButton",!1)("showCancelButton",!1),p(),d("ngIf",(e=i.createMaquinaForm.get("foto"))==null?null:e.value),p(4),d("showUploadButton",!1)("showCancelButton",!1),p(),d("ngIf",(n=i.createMaquinaForm.get("fotoId"))==null?null:n.value),p(2),d("text",!0),p(),D(i.isEditMode?-1:54),p(),d("label",i.isEditMode?"Actualizar":"Registrar")("loading",i.loading)("disabled",i.createMaquinaForm.invalid)}}function Ht(t,o){if(t&1){let e=M();s(0,"app-lista-create-modal",73),Z("visibleChange",function(i){f(e);let r=l();return X(r.showCreateTipoModal,i)||(r.showCreateTipoModal=i),_(i)}),g("onListaCreated",function(i){f(e);let r=l();return _(r.onTipoCreated(i))}),a()}if(t&2){let e=l();J("visible",e.showCreateTipoModal)}}var ut=class t{fb=x(Ue);maquinaService=x(Ye);fabricanteService=x(nt);listaService=x(Ge);sistemaService=x(Ke);messageService=x(ke);visible=!1;terceroId=null;maquinaId=null;visibleChange=new k;onMaquinaCreated=new k;onMaquinaUpdated=new k;createMaquinaForm;loading=!1;loadingMaquina=!1;get isEditMode(){return this.maquinaId!=null&&this.maquinaId>0}tiposMaquina=F([]);fabricantes=F([]);sistemas=F([]);marcasYFabricantes=F([]);showCreateTipoModal=!1;ngOnInit(){this.initForm(),this.loadTiposMaquina(),this.loadFabricantes(),this.loadSistemas(),this.loadMarcasYFabricantes()}ngOnChanges(o){if(this.visible){if(this.isEditMode&&(o.visible||o.maquinaId)){this.loadMaquinaForEdit();return}o.visible?.currentValue===!0&&!this.isEditMode&&this.resetForm()}}loadMaquinaForEdit(){this.maquinaId&&(this.loadingMaquina=!0,this.maquinaService.getById(this.maquinaId).pipe(oe(1)).subscribe({next:o=>{let e=o.data;this.createMaquinaForm.patchValue({tipo:e.tipo_id?Number(e.tipo_id):e.tipo?.id?Number(e.tipo.id):e.tipo?Number(e.tipo):null,fabricante_id:e.fabricante_id?Number(e.fabricante_id):e.fabricante?.id?Number(e.fabricante.id):null,modelo:e.modelo,serie:e.serie??"",arreglo:e.arreglo??"",foto:null,fotoId:null}),this.componentes.clear(),e.componentes&&e.componentes.length>0&&e.componentes.forEach(n=>{this.addComponente(n)}),this.loadingMaquina=!1},error:()=>{this.loadingMaquina=!1,this.messageService.add({severity:"error",summary:"Error",detail:"No se pudo cargar la m\xE1quina"}),this.closeDialog()}}))}initForm(){this.createMaquinaForm=this.fb.group({tipo:[null,[G.required]],fabricante_id:[null,[G.required]],modelo:["",[G.required]],serie:[""],arreglo:[""],foto:[null],fotoId:[null],componentes:this.fb.array([])})}get componentes(){return this.createMaquinaForm.get("componentes")}addComponente(o){let e=this.fb.group({id:[o?.id?Number(o.id):null],sistema_id:[o?.sistema_id?Number(o.sistema_id):null],marca_id:[o?.marca_id?Number(o.marca_id):null],modelo:[o?.modelo||""],serie:[o?.serie||""],comentario:[o?.comentario||""],foto_placa:[o?.foto_placa||null],fotoPlacaFile:[null]});this.componentes.push(e)}removeComponente(o){this.componentes.removeAt(o)}duplicateComponente(o){let e=this.componentes.at(o).value;this.addComponente({sistema_id:e.sistema_id,marca_id:e.marca_id,modelo:e.modelo,serie:e.serie,comentario:e.comentario})}resetForm(){this.createMaquinaForm&&this.createMaquinaForm.reset()}loadTiposMaquina(){this.listaService.getAll({tipo:"Tipo de M\xE1quina",per_page:500}).subscribe({next:o=>{this.tiposMaquina.set(o.data.map(e=>({label:e.nombre,value:e.id})))}})}loadFabricantes(){this.fabricanteService.getAll({per_page:100}).subscribe({next:o=>{this.fabricantes.set(o.data.map(e=>({label:e.nombre,value:e.id,foto:e.foto??null})))}})}loadSistemas(){this.sistemaService.getAll({per_page:100}).subscribe({next:o=>{this.sistemas.set(o.data)}})}loadMarcasYFabricantes(){this.listaService.getMarcasYFabricantesParaReferencia().subscribe({next:o=>{this.marcasYFabricantes.set(o)}})}openCreateTipoDialog(){this.showCreateTipoModal=!0}onTipoCreated(o){this.loadTiposMaquina(),this.createMaquinaForm.patchValue({tipo:o.id})}onFileSelect(o,e){o.files&&o.files.length>0&&this.createMaquinaForm.patchValue({[e]:o.files[0]})}closeDialog(){this.visible=!1,this.visibleChange.emit(!1),this.loadingMaquina=!1}saveMaquina(o=!1){this.loading=!0;let e=this.createMaquinaForm.value,n=new FormData;if(n.append("tipo",String(e.tipo)),n.append("modelo",e.modelo),n.append("fabricante_id",String(e.fabricante_id)),e.serie&&n.append("serie",e.serie),e.arreglo&&n.append("arreglo",e.arreglo),this.terceroId&&n.append("tercero_id",this.terceroId.toString()),e.foto instanceof File&&n.append("foto",e.foto),e.fotoId instanceof File&&n.append("fotoId",e.fotoId),e.componentes.forEach((i,r)=>{i.id&&n.append(`componentes[${r}][id]`,String(i.id)),i.sistema_id&&n.append(`componentes[${r}][sistema_id]`,String(i.sistema_id)),i.marca_id&&n.append(`componentes[${r}][marca_id]`,String(i.marca_id)),i.modelo&&n.append(`componentes[${r}][modelo]`,i.modelo),i.serie&&n.append(`componentes[${r}][serie]`,i.serie),i.comentario&&n.append(`componentes[${r}][comentario]`,i.comentario),i.fotoPlacaFile&&n.append(`componentes[${r}][foto_placa]`,i.fotoPlacaFile)}),this.isEditMode&&this.maquinaId){this.maquinaService.update(this.maquinaId,n).subscribe({next:i=>{this.loading=!1,this.messageService.add({severity:"success",summary:"\xC9xito",detail:"M\xE1quina actualizada correctamente"}),this.onMaquinaUpdated.emit(i.data),this.closeDialog()},error:i=>{this.loading=!1,console.error("Error actualizando m\xE1quina",i);let r="Fallo al actualizar la m\xE1quina";i.status===422&&i.error?.errors?r=Object.values(i.error.errors)[0][0]||r:i.error?.message&&(r=i.error.message),this.messageService.add({severity:"error",summary:"Error",detail:r})}});return}this.maquinaService.create(n).subscribe({next:i=>{this.loading=!1,this.messageService.add({severity:"success",summary:"\xC9xito",detail:"M\xE1quina creada correctamente"}),this.onMaquinaCreated.emit(i.data),o?(this.resetForm(),this.componentes.clear()):this.closeDialog()},error:i=>{this.loading=!1,console.error("Error creando maquina",i);let r=i.error?.message||"Fallo al crear m\xE1quina";this.messageService.add({severity:"error",summary:"Error",detail:r})}})}onFotoPlacaSelected(o,e){this.componentes.at(e).patchValue({fotoPlacaFile:o})}static \u0275fac=function(e){return new(e||t)};static \u0275cmp=w({type:t,selectors:[["app-maquina-create-modal"]],inputs:{visible:"visible",terceroId:"terceroId",maquinaId:"maquinaId"},outputs:{visibleChange:"visibleChange",onMaquinaCreated:"onMaquinaCreated",onMaquinaUpdated:"onMaquinaUpdated"},features:[se],decls:5,vars:11,consts:[["opModal",""],["placaUpload",""],["styleClass","rounded-[2rem] overflow-hidden",3,"visibleChange","onHide","header","visible","modal","draggable","resizable"],[1,"mb-6","text-gray-400","text-sm","px-2"],[1,"flex","flex-col","items-center","justify-center","py-20","gap-4"],[1,"px-2",3,"formGroup"],["tipoDefault","Tipo de M\xE1quina","title","Crear Tipo de M\xE1quina",3,"visible"],["styleClass","w-12 h-12","strokeWidth","4"],[1,"text-sm","text-gray-400","font-bold","tracking-widest","uppercase"],[1,"px-2",3,"ngSubmit","formGroup"],[1,"grid","grid-cols-1","md:grid-cols-2","gap-6"],[1,"field"],["for","tipo",1,"block","text-[11px]","font-black","text-gray-400","uppercase","tracking-widest","mb-2"],[1,"text-red-500"],[1,"flex","gap-2"],["appAutoFocus","","id","tipo","formControlName","tipo","optionLabel","label","optionValue","value","placeholder","Tipo...","styleClass","w-full flex-1 rounded-xl","filterBy","label","appendTo","body",3,"options","filter"],["icon","pi pi-plus","severity","secondary",3,"onClick","rounded"],["for","fabricante_id",1,"block","text-[11px]","font-black","text-gray-400","uppercase","tracking-widest","mb-2"],["id","fabricante_id","formControlName","fabricante_id","optionLabel","label","optionValue","value","optionImage","foto","filterBy","label","placeholder","Fabricante...","styleClass","w-full rounded-xl","appendTo","body",3,"options","filter"],["for","modelo",1,"block","text-[11px]","font-black","text-gray-400","uppercase","tracking-widest","mb-2"],["id","modelo","type","text","pInputText","","formControlName","modelo","placeholder","Modelo",1,"w-full","rounded-xl"],["for","serie",1,"block","text-[11px]","font-black","text-gray-400","uppercase","tracking-widest","mb-2"],["id","serie","type","text","pInputText","","formControlName","serie","placeholder","Serie",1,"w-full","rounded-xl"],[1,"field","md:col-span-2"],["for","arreglo",1,"block","text-[11px]","font-black","text-gray-400","uppercase","tracking-widest","mb-2"],["id","arreglo","type","text","pInputText","","formControlName","arreglo","placeholder","Arreglo",1,"w-full","rounded-xl"],[1,"md:col-span-2","mt-4"],[1,"flex","justify-between","items-center","mb-4"],[1,"flex","items-center","gap-3"],[1,"pi","pi-cog","text-[#fdb831]"],[1,"font-bold","text-lg"],["icon","pi pi-plus","severity","warn","label","Agregar","styleClass","text-xs font-bold px-4",3,"onClick","rounded"],["formArrayName","componentes",1,"flex","flex-col","gap-4","max-h-[350px]","overflow-y-auto","pr-2","custom-scrollbar"],[1,"p-4","border","border-surface-border","rounded-2xl","bg-surface-ground/30","relative","hover:border-[#fdb831]/30","transition-all",3,"formGroupName"],[1,"flex","flex-col","items-center","justify-center","py-10","border-2","border-dashed","border-surface-border","rounded-2xl","bg-surface-ground/10"],[1,"md:col-span-2","grid","grid-cols-1","md:grid-cols-2","gap-4","mt-4"],[1,"p-4","border","border-surface-border","rounded-2xl","bg-surface-ground/20"],[1,"block","mb-3","text-[11px]","font-black","text-gray-400","uppercase","tracking-widest"],["mode","basic","chooseLabel","Elegir Foto","chooseIcon","pi pi-image","styleClass","p-button-secondary p-button-sm w-full",3,"onSelect","showUploadButton","showCancelButton"],["class","mt-2 text-[10px] text-gray-500 flex items-center gap-2",4,"ngIf"],["mode","basic","chooseLabel","Elegir Placa","chooseIcon","pi pi-id-card","styleClass","p-button-secondary p-button-sm w-full",3,"onSelect","showUploadButton","showCancelButton"],[1,"flex","justify-end","gap-3","mt-10","mb-4"],["label","Cancelar","severity","secondary","styleClass","font-bold",3,"onClick","text"],["label","Crear y Otro","severity","secondary","styleClass","font-bold",3,"loading"],["type","submit","severity","warn","styleClass","font-bold px-8",3,"label","loading","disabled"],[1,"absolute","top-2","right-2","flex","gap-1"],["icon","pi pi-copy","severity","warn",3,"onClick","rounded","text","pTooltip"],["icon","pi pi-trash","severity","danger",3,"onClick","rounded","text","pTooltip"],[1,"grid","grid-cols-1","md:grid-cols-2","gap-4","mt-2"],[1,"text-[10px]","font-black","uppercase","text-gray-500","block","mb-1"],["formControlName","sistema_id","optionLabel","nombre","optionValue","id","placeholder","Sistema...","styleClass","w-full text-sm rounded-xl","filterBy","nombre","appendTo","body",3,"options","filter"],["formControlName","marca_id","optionLabel","nombre","optionValue","id","placeholder","Marca...","styleClass","w-full text-sm rounded-xl","filterBy","nombre","appendTo","body",3,"options","filter"],["type","text","pInputText","","formControlName","modelo","placeholder","Modelo",1,"w-full","text-sm","rounded-xl"],["type","text","pInputText","","formControlName","serie","placeholder","Serie",1,"w-full","text-sm","rounded-xl"],[1,"md:col-span-2","flex","items-center","gap-4"],[1,"flex-1"],[1,"text-[10px]","font-black","uppercase","text-gray-500","block","mb-2"],[1,"flex","items-center","gap-2","p-2","bg-surface-card","rounded-xl","border","border-surface-border"],["icon","pi pi-camera",3,"onClick","severity","rounded","text","pTooltip"],["icon","pi pi-comment",3,"onClick","severity","rounded","text","pTooltip"],[1,"p-3","w-80"],[1,"block","text-[10px]","font-black","uppercase","text-gray-500","mb-2","tracking-widest"],["pTextarea","","formControlName","comentario","rows","3","placeholder","Escriba aqu\xED...",1,"w-full","rounded-xl","text-sm","p-3","border-surface-border","bg-surface-ground/20"],["class","text-[10px] text-gray-400 truncate flex-1",4,"ngIf"],["class","text-[10px] text-gray-500",4,"ngIf"],["type","file","accept","image/*",1,"hidden",3,"change"],[1,"text-[10px]","text-gray-400","truncate","flex-1"],[1,"text-[10px]","text-gray-500"],[1,"pi","pi-box","text-2xl","text-gray-600","mb-2"],[1,"text-sm","text-gray-500","italic"],[1,"mt-2","text-[10px]","text-gray-500","flex","items-center","gap-2"],[1,"pi","pi-check-circle","text-green-500"],["label","Crear y Otro","severity","secondary","styleClass","font-bold",3,"onClick","loading"],["tipoDefault","Tipo de M\xE1quina","title","Crear Tipo de M\xE1quina",3,"visibleChange","onListaCreated","visible"]],template:function(e,n){e&1&&(s(0,"p-dialog",2),Z("visibleChange",function(r){return X(n.visible,r)||(n.visible=r),r}),g("onHide",function(){return n.closeDialog()}),q(1,Lt,2,0,"div",3),q(2,Nt,4,0,"div",4)(3,Bt,56,19,"form",5),a(),q(4,Ht,1,1,"app-lista-create-modal",6)),e&2&&(_e(B(10,Dt)),d("header",n.isEditMode?"Editar m\xE1quina":"Crear m\xE1quina"),J("visible",n.visible),d("modal",!0)("draggable",!1)("resizable",!1),p(),D(n.isEditMode?-1:1),p(),D(n.loadingMaquina?2:3),p(2),D(n.showCreateTipoModal?4:-1))},dependencies:[T,j,Oe,De,Te,Fe,qe,Pe,Ae,Le,Ne,We,ze,je,He,mt,ie,Be,$e,Je,Qe,we,Ze,Xe,it,tt,et,Re,Ve,K,Y,ot,rt],encapsulation:2})};var _n=[{key:"rut",label:"Adjuntar RUT"},{key:"certificacion_bancaria",label:"Adjuntar Certificaci\xF3n Bancaria"},{key:"camara_comercio",label:"Adjuntar C\xE1mara de Comercio"},{key:"cedula_representante_legal",label:"Adjuntar C\xE9dula Representante Legal"}];function gn(t){let o=null,e=t.originalEvent;if(e instanceof he)o=e.body;else if(t.xhr?.response)try{o=JSON.parse(t.xhr.response)}catch{return null}if(typeof o=="string")try{o=JSON.parse(o)}catch{return null}return o&&typeof o=="object"&&"success"in o?o:null}function bn(t){return{path:t.file_name??"",name:t.original_name??t.file_name?.split("/").pop()??"Archivo",size:t.size??0,url:t.file_url,status:"done",progress:100}}function xn(t){return{path:"",name:t.name,size:t.size,status:"pending",progress:0,objectURL:t.type.startsWith("image/")?URL.createObjectURL(t):void 0}}function yn(t){let o=t.replace(/^\/storage\//,"");return{path:o,name:o.split("/").pop()??o,size:0,url:t.startsWith("http")||t.startsWith("/storage")?t:`/storage/${o}`,status:"done",progress:100}}function hn(t){if(!t)return!1;if(typeof t!="string"&&t.objectURL)return!0;let o=typeof t=="string"?t:t.path||t.name||"";return/\.(jpg|jpeg|png|gif|webp|avif)$/i.test(o)}function vn(t){return t?(typeof t=="string"?t:t.name||t.path||"").toLowerCase().endsWith(".pdf"):!1}function Cn(t){return t?typeof t=="string"?t.startsWith("http")||t.startsWith("/storage")?t:`/storage/${t}`:t.objectURL?t.objectURL:t.url?t.url.startsWith("http")||t.url.startsWith("/storage")?t.url:`/storage/${t.url}`:t.path?t.path.startsWith("http")||t.path.startsWith("/storage")?t.path:`/storage/${t.path}`:"":""}function Mn(t){return t?`${(t/1024).toFixed(2)} KB`:"Subido"}var En="w-full";var kn="hm-field-label",In="hm-section-card",wn="hm-footer-divider",Tn="hm-document-upload-file",Fn="hm-document-upload-empty",qn="hm-document-upload-name",Dn="hm-document-upload-size",Ln="hm-document-upload-thumb",Nn="hm-document-icon-pdf",An="hm-document-icon-file",Pn="hm-text-primary-emphasis";export{Tt as a,pi as b,_n as c,gn as d,bn as e,xn as f,yn as g,hn as h,vn as i,Cn as j,Mn as k,ut as l,En as m,kn as n,In as o,wn as p,Tn as q,Fn as r,qn as s,Dn as t,Ln as u,Nn as v,An as w,Pn as x};
