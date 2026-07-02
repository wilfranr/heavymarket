import{d as ue,e as he,h as v}from"./chunk-2FHHIGBA.js";import{$ as ce,F as M,M as ne,O as re,X as le,Z as pe,aa as de,b as te,ba as c,i as oe,la as fe,o as m,v as ie}from"./chunk-6GBDMTCE.js";import{G as se,J as ae,K as b}from"./chunk-735KUJFF.js";import{B as f,o as G,p as J,w as ee}from"./chunk-LWZ5NFGU.js";import{Aa as w,G as C,Ia as z,Ib as U,Kb as X,La as Z,Na as F,Sa as d,Ta as k,Ua as $,ab as j,cc as S,d as I,e as E,fa as A,fb as u,g as V,ga as _,gc as L,hb as r,i as a,ib as Q,jb as W,kb as q,mb as T,nb as x,o as l,p,qc as h,rc as Y,ua as H,ub as K,va as B,vb as O,w as g,x as P,ya as N,za as R}from"./chunk-5FPXF5CH.js";import{a as y}from"./chunk-C6Q5SG76.js";var me=`
    .p-popover {
        margin-block-start: dt('popover.gutter');
        background: dt('popover.background');
        color: dt('popover.color');
        border: 1px solid dt('popover.border.color');
        border-radius: dt('popover.border.radius');
        box-shadow: dt('popover.shadow');
        will-change: transform;
    }

    .p-popover-content {
        padding: dt('popover.content.padding');
    }

    .p-popover-flipped {
        margin-block-start: calc(dt('popover.gutter') * -1);
        margin-block-end: dt('popover.gutter');
    }

    .p-popover:after,
    .p-popover:before {
        bottom: 100%;
        left: calc(dt('popover.arrow.offset') + dt('popover.arrow.left'));
        content: ' ';
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
    }

    .p-popover:after {
        border-width: calc(dt('popover.gutter') - 2px);
        margin-left: calc(-1 * (dt('popover.gutter') - 2px));
        border-style: solid;
        border-color: transparent;
        border-bottom-color: dt('popover.background');
    }

    .p-popover:before {
        border-width: dt('popover.gutter');
        margin-left: calc(-1 * dt('popover.gutter'));
        border-style: solid;
        border-color: transparent;
        border-bottom-color: dt('popover.border.color');
    }

    .p-popover-flipped:after,
    .p-popover-flipped:before {
        bottom: auto;
        top: 100%;
    }

    .p-popover.p-popover-flipped:after {
        border-bottom-color: transparent;
        border-top-color: dt('popover.background');
    }

    .p-popover.p-popover-flipped:before {
        border-bottom-color: transparent;
        border-top-color: dt('popover.border.color');
    }
`;var ye=["content"],ge=["*"],Ce=o=>({closeCallback:o});function _e(o,D){}function we(o,D){o&1&&w(0,_e,0,0,"ng-template")}function ke(o,D){if(o&1){let e=j();k(0,"div",1),u("click",function(i){l(e);let n=r();return p(n.onOverlayClick(i))})("pMotionOnEnter",function(i){l(e);let n=r();return p(n.onAnimationStart(i))})("pMotionOnAfterLeave",function(){l(e);let i=r();return p(i.onAnimationEnd())}),k(1,"div",2),u("click",function(i){l(e);let n=r();return p(n.onContentClick(i))})("mousedown",function(i){l(e);let n=r();return p(n.onContentClick(i))}),W(2),w(3,we,1,0,null,3),$()()}if(o&2){let e=r();K(e.sx("root")),O(e.cn(e.cx("root"),e.styleClass)),d("pBind",e.ptm("root"))("ngStyle",e.style)("pMotion",e.overlayVisible)("pMotionAppear",!0)("pMotionOptions",e.computedMotionOptions()),z("aria-modal",e.overlayVisible)("aria-label",e.ariaLabel)("aria-labelledBy",e.ariaLabelledBy),_(),O(e.cx("content")),d("pBind",e.ptm("content")),_(2),d("ngTemplateOutlet",e.contentTemplate||e._contentTemplate)("ngTemplateOutletContext",X(17,Ce,e.onCloseClick.bind(e)))}}var Te={root:()=>({position:"absolute"})},xe={root:"p-popover p-component",content:"p-popover-content"},be=(()=>{class o extends pe{name="popover";style=me;classes=xe;inlineStyles=Te;static \u0275fac=(()=>{let e;return function(i){return(e||(e=C(o)))(i||o)}})();static \u0275prov=I({token:o,factory:o.\u0275fac})}return o})(),ve=new V("POPOVER_INSTANCE"),Oe=(()=>{class o extends de{componentName="Popover";$pcPopover=a(ve,{optional:!0,skipSelf:!0})??void 0;bindDirectiveInstance=a(c,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("host"))}ariaLabel;ariaLabelledBy;dismissable=!0;style;styleClass;appendTo=L("body");autoZIndex=!0;ariaCloseLabel;baseZIndex=0;focusOnShow=!0;showTransitionOptions=".12s cubic-bezier(0, 0, 0.2, 1)";hideTransitionOptions=".1s linear";motionOptions=L(void 0);computedMotionOptions=S(()=>y(y({},this.ptm("motion")),this.motionOptions()));onShow=new g;onHide=new g;$appendTo=S(()=>this.appendTo()||this.config.overlayAppendTo());container;overlayVisible=!1;render=!1;selfClick=!1;documentClickListener;target;willHide;scrollHandler;documentResizeListener;contentTemplate;templates;_contentTemplate;destroyCallback;overlayEventListener;overlaySubscription;_componentStyle=a(be);zone=a(P);overlayService=a(se);onAfterContentInit(){this.templates.forEach(e=>{e.getType()==="content"&&(this._contentTemplate=e.template)})}bindDocumentClickListener(){if(f(this.platformId)&&!this.documentClickListener){let e=ne()?"touchstart":"click",t=this.el?this.el.nativeElement.ownerDocument:this.document;this.documentClickListener=this.renderer.listen(t,e,i=>{this.dismissable&&(!this.container?.contains(i.target)&&this.target!==i.target&&!this.target.contains(i.target)&&!this.selfClick&&this.hide(),this.selfClick=!1,this.cd.markForCheck())})}}unbindDocumentClickListener(){this.documentClickListener&&(this.documentClickListener(),this.documentClickListener=null,this.selfClick=!1)}toggle(e,t){this.overlayVisible?(this.hasTargetChanged(e,t)&&(this.destroyCallback=()=>{this.show(null,t||e.currentTarget||e.target)}),this.hide()):this.show(e,t)}show(e,t){t&&e&&e.stopPropagation(),this.container&&!this.overlayVisible&&(this.container=null),this.target=t||e.currentTarget||e.target,this.overlayVisible=!0,this.render=!0,this.cd.markForCheck()}onOverlayClick(e){this.overlayService.add({originalEvent:e,target:this.el.nativeElement}),this.selfClick=!0}onContentClick(e){let t=e.target;this.selfClick=e.offsetX<t.clientWidth&&e.offsetY<t.clientHeight}hasTargetChanged(e,t){return this.target!=null&&this.target!==(t||e.currentTarget||e.target)}appendOverlay(){this.$appendTo()&&this.$appendTo()!=="self"&&(this.$appendTo()==="body"?m(this.document.body,this.container):m(this.$appendTo(),this.container))}restoreAppend(){this.container&&this.$appendTo()&&this.$appendTo()!=="self"&&m(this.el.nativeElement,this.container)}setZIndex(){this.autoZIndex&&v.set("overlay",this.container,this.baseZIndex+this.config.zIndex.overlay)}align(){if(this.target&&this.container){oe(this.container,this.target,!1);let e=M(this.container),t=M(this.target),i=this.document.defaultView?.getComputedStyle(this.container).getPropertyValue("border-radius"),n=0;e.left<t.left&&(n=t.left-e.left-parseFloat(i)*2),this.container.style.setProperty(le("popover.arrow.left").name,`${n}px`),e.top<t.top&&(this.container.setAttribute("data-p-popover-flipped","true"),!this.$unstyled()&&te(this.container,"p-popover-flipped"))}}onAnimationStart(e){this.container=e.element,this.container?.setAttribute(this.$attrSelector,""),this.appendOverlay(),this.align(),this.setZIndex(),this.bindDocumentClickListener(),this.bindDocumentResizeListener(),this.bindScrollListener(),this.focusOnShow&&this.focus(),this.overlayEventListener=t=>{this.container&&this.container.contains(t.target)&&(this.selfClick=!0)},this.overlaySubscription=this.overlayService.clickObservable.subscribe(this.overlayEventListener),this.onShow.emit(null)}onAnimationEnd(){this.overlayVisible||(this.destroyCallback&&(this.destroyCallback(),this.destroyCallback=null),this.overlaySubscription&&this.overlaySubscription.unsubscribe(),this.autoZIndex&&v.clear(this.container),this.onContainerDestroy(),this.onHide.emit({}),this.render=!1,this.container=null)}focus(){let e=ie(this.container,"[autofocus]");e&&this.zone.runOutsideAngular(()=>{setTimeout(()=>e.focus(),5)})}hide(){this.overlayVisible=!1,this.cd.markForCheck()}onCloseClick(e){this.hide(),e.preventDefault()}onEscapeKeydown(e){this.hide()}onWindowResize(){this.overlayVisible&&!re()&&this.hide()}bindDocumentResizeListener(){if(f(this.platformId)&&!this.documentResizeListener){let e=this.document.defaultView;this.documentResizeListener=this.renderer.listen(e,"resize",this.onWindowResize.bind(this))}}unbindDocumentResizeListener(){this.documentResizeListener&&(this.documentResizeListener(),this.documentResizeListener=null)}bindScrollListener(){f(this.platformId)&&(this.scrollHandler||(this.scrollHandler=new fe(this.target,()=>{this.overlayVisible&&this.hide()})),this.scrollHandler.bindScrollListener())}unbindScrollListener(){this.scrollHandler&&this.scrollHandler.unbindScrollListener()}onContainerDestroy(){this.cd.destroyed||(this.target=null),this.unbindDocumentClickListener(),this.unbindDocumentResizeListener(),this.unbindScrollListener()}onDestroy(){this.scrollHandler&&(this.scrollHandler.destroy(),this.scrollHandler=null),this.container&&this.autoZIndex&&v.clear(this.container),this.cd.destroyed||(this.target=null),this.destroyCallback=null,this.container&&(this.restoreAppend(),this.onContainerDestroy()),this.overlaySubscription&&this.overlaySubscription.unsubscribe()}static \u0275fac=(()=>{let e;return function(i){return(e||(e=C(o)))(i||o)}})();static \u0275cmp=H({type:o,selectors:[["p-popover"]],contentQueries:function(t,i,n){if(t&1&&q(n,ye,4)(n,ae,4),t&2){let s;T(s=x())&&(i.contentTemplate=s.first),T(s=x())&&(i.templates=s)}},hostBindings:function(t,i){t&1&&u("keydown.escape",function(s){return i.onEscapeKeydown(s)},A)},inputs:{ariaLabel:"ariaLabel",ariaLabelledBy:"ariaLabelledBy",dismissable:[2,"dismissable","dismissable",h],style:"style",styleClass:"styleClass",appendTo:[1,"appendTo"],autoZIndex:[2,"autoZIndex","autoZIndex",h],ariaCloseLabel:"ariaCloseLabel",baseZIndex:[2,"baseZIndex","baseZIndex",Y],focusOnShow:[2,"focusOnShow","focusOnShow",h],showTransitionOptions:"showTransitionOptions",hideTransitionOptions:"hideTransitionOptions",motionOptions:[1,"motionOptions"]},outputs:{onShow:"onShow",onHide:"onHide"},features:[U([be,{provide:ve,useExisting:o},{provide:ce,useExisting:o}]),N([c]),R],ngContentSelectors:ge,decls:1,vars:1,consts:[["role","dialog","pMotionName","p-anchored-overlay",3,"pBind","class","style","ngStyle","pMotion","pMotionAppear","pMotionOptions"],["role","dialog","pMotionName","p-anchored-overlay",3,"click","pMotionOnEnter","pMotionOnAfterLeave","pBind","ngStyle","pMotion","pMotionAppear","pMotionOptions"],[3,"click","mousedown","pBind"],[4,"ngTemplateOutlet","ngTemplateOutletContext"]],template:function(t,i){t&1&&(Q(),Z(0,ke,4,19,"div",0)),t&2&&F(i.render?0:-1)},dependencies:[ee,J,G,b,c,he,ue],encapsulation:2,changeDetection:0})}return o})(),et=(()=>{class o{static \u0275fac=function(t){return new(t||o)};static \u0275mod=B({type:o});static \u0275inj=E({imports:[Oe,b,b]})}return o})();export{Oe as a,et as b};
