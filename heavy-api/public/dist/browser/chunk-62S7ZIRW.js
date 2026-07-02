import{a as Re}from"./chunk-ZO2JSVB7.js";import{a as ce}from"./chunk-DYHEMNIN.js";import{a as q,b as K}from"./chunk-D5FQBT6F.js";import{a as se}from"./chunk-KRBH2E32.js";import{b as de,d as Pe,e as Ee,h as ue}from"./chunk-2FHHIGBA.js";import{$ as Ne,T as oe,V as Ae,Z as Fe,aa as D,b as Ve,ba as x,c as $,ca as Ge,ja as De,ka as Le,ma as He,u as E,v as j,w as Be,x as Me}from"./chunk-6GBDMTCE.js";import{J as Oe,K as re}from"./chunk-735KUJFF.js";import{B as V,j as ke,k as ne,l as P,o as ae,p as Q,w as le}from"./chunk-LWZ5NFGU.js";import{$a as _e,A as W,Aa as m,G as X,I as ve,Ia as T,Ib as R,Jb as we,Kb as ee,La as Y,Lb as Te,Na as J,Sa as l,Ta as g,Ua as v,Va as I,Yb as Ce,Za as F,_a as N,ab as w,cc as te,d as me,e as he,fa as fe,fb as f,g as ge,ga as c,gc as ie,hb as o,i as y,kb as Ie,lb as z,mb as b,nb as _,o as u,oc as Se,p,pa as M,q as S,qc as h,rb as xe,rc as G,ua as A,ub as ye,va as be,vb as d,w as C,ya as H,za as O}from"./chunk-5FPXF5CH.js";import{a as L}from"./chunk-C6Q5SG76.js";var Qe=`
    .p-galleria {
        overflow: hidden;
        border-style: solid;
        border-width: dt('galleria.border.width');
        border-color: dt('galleria.border.color');
        border-radius: dt('galleria.border.radius');
    }

    .p-galleria-content {
        display: flex;
        flex-direction: column;
    }

    .p-galleria-items-container {
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .p-galleria-items {
        position: relative;
        display: flex;
        height: 100%;
    }

    .p-galleria-nav-button {
        position: absolute !important;
        top: 50%;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        background: dt('galleria.nav.button.background');
        color: dt('galleria.nav.button.color');
        width: dt('galleria.nav.button.size');
        height: dt('galleria.nav.button.size');
        transition:
            background dt('galleria.transition.duration'),
            color dt('galleria.transition.duration'),
            outline-color dt('galleria.transition.duration'),
            box-shadow dt('galleria.transition.duration');
        margin: calc(-1 * calc(dt('galleria.nav.button.size')) / 2) dt('galleria.nav.button.gutter') 0 dt('galleria.nav.button.gutter');
        padding: 0;
        user-select: none;
        border: 0 none;
        cursor: pointer;
        outline-color: transparent;
    }

    .p-galleria-nav-button:not(.p-disabled):hover {
        background: dt('galleria.nav.button.hover.background');
        color: dt('galleria.nav.button.hover.color');
    }

    .p-galleria-nav-button:not(.p-disabled):focus-visible {
        box-shadow: dt('galleria.nav.button.focus.ring.shadow');
        outline: dt('galleria.nav.button.focus.ring.width') dt('galleria.nav.button.focus.ring.style') dt('galleria.nav.button.focus.ring.color');
        outline-offset: dt('galleria.nav.button.focus.ring.offset');
    }

    .p-galleria-next-icon,
    .p-galleria-prev-icon {
        font-size: dt('galleria.nav.icon.size');
        width: dt('galleria.nav.icon.size');
        height: dt('galleria.nav.icon.size');
    }

    .p-galleria-prev-button {
        border-radius: dt('galleria.nav.button.prev.border.radius');
        left: 0;
    }

    .p-galleria-next-button {
        border-radius: dt('galleria.nav.button.next.border.radius');
        right: 0;
    }

    .p-galleria-prev-button:dir(rtl) {
        left: auto;
        right: 0;
        transform: rotate(180deg);
    }

    .p-galleria-next-button:dir(rtl) {
        right: auto;
        left: 0;
        transform: rotate(180deg);
    }

    .p-galleria-item {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
    }

    .p-galleria-hover-navigators .p-galleria-nav-button {
        pointer-events: none;
        opacity: 0;
        transition: opacity dt('galleria.transition.duration') ease-in-out;
    }

    .p-galleria-hover-navigators .p-galleria-items-container:hover .p-galleria-nav-button {
        pointer-events: all;
        opacity: 1;
    }

    .p-galleria-hover-navigators .p-galleria-items-container:hover .p-galleria-nav-button.p-disabled {
        pointer-events: none;
    }

    .p-galleria-caption {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        background: dt('galleria.caption.background');
        color: dt('galleria.caption.color');
        padding: dt('galleria.caption.padding');
    }

    .p-galleria-thumbnails {
        display: flex;
        flex-direction: column;
        overflow: auto;
        flex-shrink: 0;
    }

    .p-galleria-thumbnail-nav-button {
        align-self: center;
        flex: 0 0 auto;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        position: relative;
        margin: 0 dt('galleria.thumbnail.nav.button.gutter');
        padding: 0;
        border: none;
        user-select: none;
        cursor: pointer;
        background: transparent;
        color: dt('galleria.thumbnail.nav.button.color');
        width: dt('galleria.thumbnail.nav.button.size');
        height: dt('galleria.thumbnail.nav.button.size');
        transition:
            background dt('galleria.transition.duration'),
            color dt('galleria.transition.duration'),
            outline-color dt('galleria.transition.duration');
        outline-color: transparent;
        border-radius: dt('galleria.thumbnail.nav.button.border.radius');
    }

    .p-galleria-thumbnail-nav-button:hover {
        background: dt('galleria.thumbnail.nav.button.hover.background');
        color: dt('galleria.thumbnail.nav.button.hover.color');
    }

    .p-galleria-thumbnail-nav-button:focus-visible {
        box-shadow: dt('galleria.thumbnail.nav.button.focus.ring.shadow');
        outline: dt('galleria.thumbnail.nav.button.focus.ring.width') dt('galleria.thumbnail.nav.button.focus.ring.style') dt('galleria.thumbnail.nav.button.focus.ring.color');
        outline-offset: dt('galleria.thumbnail.nav.button.focus.ring.offset');
    }

    .p-galleria-thumbnail-nav-button .p-galleria-thumbnail-next-icon,
    .p-galleria-thumbnail-nav-button .p-galleria-thumbnail-prev-icon {
        font-size: dt('galleria.thumbnail.nav.button.icon.size');
        width: dt('galleria.thumbnail.nav.button.icon.size');
        height: dt('galleria.thumbnail.nav.button.icon.size');
    }

    .p-galleria-thumbnails-content {
        display: flex;
        flex-direction: row;
        background: dt('galleria.thumbnails.content.background');
        padding: dt('galleria.thumbnails.content.padding');
    }

    .p-galleria-thumbnails-viewport {
        overflow: hidden;
        width: 100%;
    }

    .p-galleria:not(.p-galleria-thumbnails-right):not(.p-galleria-thumbnails-left) .p-galleria-thumbnail-prev-button:dir(rtl),
    .p-galleria:not(.p-galleria-thumbnails-right):not(.p-galleria-thumbnails-left) .p-galleria-thumbnail-next-button:dir(rtl) {
        transform: rotate(180deg);
    }

    .p-galleria-thumbnail-items {
        display: flex;
    }

    .p-galleria-thumbnail-items:dir(rtl) {
        flex-direction: row-reverse;
    }

    .p-galleria-thumbnail-item {
        overflow: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.5;
    }

    .p-galleria-thumbnail {
        outline-color: transparent;
    }

    .p-galleria-thumbnail-item:hover {
        opacity: 1;
        transition: opacity 0.3s;
    }

    .p-galleria-thumbnail-item-current {
        opacity: 1;
    }

    .p-galleria-thumbnails-left .p-galleria-content,
    .p-galleria-thumbnails-right .p-galleria-content {
        flex-direction: row;
    }

    .p-galleria-thumbnails-left .p-galleria-items-container,
    .p-galleria-thumbnails-right .p-galleria-items-container {
        flex-direction: row;
    }

    .p-galleria-thumbnails-left .p-galleria-items-container,
    .p-galleria-thumbnails-top .p-galleria-items-container {
        order: 2;
    }

    .p-galleria-thumbnails-left .p-galleria-thumbnails,
    .p-galleria-thumbnails-top .p-galleria-thumbnails {
        order: 1;
    }

    .p-galleria-thumbnails-left .p-galleria-thumbnails-content,
    .p-galleria-thumbnails-right .p-galleria-thumbnails-content {
        flex-direction: column;
        flex-grow: 1;
    }

    .p-galleria-thumbnails-left .p-galleria-thumbnail-items,
    .p-galleria-thumbnails-right .p-galleria-thumbnail-items {
        flex-direction: column;
        height: 100%;
    }

    .p-galleria-indicator-list {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: dt('galleria.indicator.list.padding');
        gap: dt('galleria.indicator.list.gap');
        margin: 0;
        list-style: none;
    }

    .p-galleria-indicator-button {
        display: inline-flex;
        align-items: center;
        background: dt('galleria.indicator.button.background');
        width: dt('galleria.indicator.button.width');
        height: dt('galleria.indicator.button.height');
        transition:
            background dt('galleria.transition.duration'),
            color dt('galleria.transition.duration'),
            outline-color dt('galleria.transition.duration'),
            box-shadow dt('galleria.transition.duration');
        outline-color: transparent;
        border-radius: dt('galleria.indicator.button.border.radius');
        margin: 0;
        padding: 0;
        border: none;
        user-select: none;
        cursor: pointer;
    }

    .p-galleria-indicator-button:hover {
        background: dt('galleria.indicator.button.hover.background');
    }

    .p-galleria-indicator-button:focus-visible {
        box-shadow: dt('galleria.indicator.button.focus.ring.shadow');
        outline: dt('galleria.indicator.button.focus.ring.width') dt('galleria.indicator.button.focus.ring.style') dt('galleria.indicator.button.focus.ring.color');
        outline-offset: dt('galleria.indicator.button.focus.ring.offset');
    }

    .p-galleria-indicator-active .p-galleria-indicator-button {
        background: dt('galleria.indicator.button.active.background');
    }

    .p-galleria-indicators-left .p-galleria-items-container,
    .p-galleria-indicators-right .p-galleria-items-container {
        flex-direction: row;
        align-items: center;
    }

    .p-galleria-indicators-left .p-galleria-items,
    .p-galleria-indicators-top .p-galleria-items {
        order: 2;
    }

    .p-galleria-indicators-left .p-galleria-indicator-list,
    .p-galleria-indicators-top .p-galleria-indicator-list {
        order: 1;
    }

    .p-galleria-indicators-left .p-galleria-indicator-list,
    .p-galleria-indicators-right .p-galleria-indicator-list {
        flex-direction: column;
    }

    .p-galleria-inset-indicators .p-galleria-indicator-list {
        position: absolute;
        display: flex;
        z-index: 1;
        background: dt('galleria.inset.indicator.list.background');
    }

    .p-galleria-inset-indicators .p-galleria-indicator-button {
        background: dt('galleria.inset.indicator.button.background');
    }

    .p-galleria-inset-indicators .p-galleria-indicator-button:hover {
        background: dt('galleria.inset.indicator.button.hover.background');
    }

    .p-galleria-inset-indicators .p-galleria-indicator-active .p-galleria-indicator-button {
        background: dt('galleria.inset.indicator.button.active.background');
    }

    .p-galleria-inset-indicators.p-galleria-indicators-top .p-galleria-indicator-list {
        top: 0;
        left: 0;
        width: 100%;
        align-items: flex-start;
    }

    .p-galleria-inset-indicators.p-galleria-indicators-right .p-galleria-indicator-list {
        right: 0;
        top: 0;
        height: 100%;
        align-items: flex-end;
    }

    .p-galleria-inset-indicators.p-galleria-indicators-bottom .p-galleria-indicator-list {
        bottom: 0;
        left: 0;
        width: 100%;
        align-items: flex-end;
    }

    .p-galleria-inset-indicators.p-galleria-indicators-left .p-galleria-indicator-list {
        left: 0;
        top: 0;
        height: 100%;
        align-items: flex-start;
    }

    .p-galleria-mask {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .p-galleria-close-button {
        position: absolute !important;
        top: 0;
        right: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        margin: dt('galleria.close.button.gutter');
        background: dt('galleria.close.button.background');
        color: dt('galleria.close.button.color');
        width: dt('galleria.close.button.size');
        height: dt('galleria.close.button.size');
        padding: 0;
        border: none;
        user-select: none;
        cursor: pointer;
        border-radius: dt('galleria.close.button.border.radius');
        outline-color: transparent;
        transition:
            background dt('galleria.transition.duration'),
            color dt('galleria.transition.duration'),
            outline-color dt('galleria.transition.duration');
    }

    .p-galleria-close-icon {
        font-size: dt('galleria.close.button.icon.size');
        width: dt('galleria.close.button.icon.size');
        height: dt('galleria.close.button.icon.size');
    }

    .p-galleria-close-button:hover {
        background: dt('galleria.close.button.hover.background');
        color: dt('galleria.close.button.hover.color');
    }

    .p-galleria-close-button:focus-visible {
        box-shadow: dt('galleria.close.button.focus.ring.shadow');
        outline: dt('galleria.close.button.focus.ring.width') dt('galleria.close.button.focus.ring.style') dt('galleria.close.button.focus.ring.color');
        outline-offset: dt('galleria.close.button.focus.ring.offset');
    }

    .p-galleria-mask .p-galleria-nav-button {
        position: fixed;
        top: 50%;
    }

       .p-items-hidden .p-galleria-thumbnail-item {
        visibility: hidden;
    }

    .p-items-hidden .p-galleria-thumbnail-item.p-galleria-thumbnail-item-active {
        visibility: visible;
    }

    .p-galleria-enter-active {
        animation: p-animate-galleria-enter 300ms cubic-bezier(.19,1,.22,1);
    }

    .p-galleria-leave-active {
        animation: p-animate-galleria-leave 300ms cubic-bezier(.19,1,.22,1);
    }

    .p-galleria-enter-active .p-galleria-nav-button {
        opacity: 0;
    }

    @keyframes p-animate-galleria-enter {
        from {
            opacity: 0;
            transform: scale(0.93);
        }
    }

    @keyframes p-animate-galleria-leave {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.93);
        }
    }
`;var ze=["header"],$e=["footer"],je=["indicator"],qe=["caption"],Ke=["closeicon"],Ze=["previousthumbnailicon"],Ue=["nextthumbnailicon"],We=["itempreviousicon"],Xe=["itemnexticon"],Ye=["item"],Je=["thumbnail"],et=["container"];function tt(t,r){if(t&1){let e=w();g(0,"div",6),f("pMotionOnBeforeEnter",function(n){u(e);let a=o(3);return p(a.onBeforeEnter(n))})("pMotionOnBeforeLeave",function(){u(e);let n=o(3);return p(n.onBeforeLeave())})("pMotionOnAfterLeave",function(){u(e);let n=o(3);return p(n.onAfterLeave())})("maskHide",function(){u(e);let n=o(3);return p(n.onMaskHide())})("activeItemChange",function(n){u(e);let a=o(3);return p(a.onActiveItemChange(n))}),v()}if(t&2){let e=o(3);l("pMotion",e.visible)("pMotionAppear",!0)("pMotionName","p-galleria")("pMotionOptions",e.computedMotionOptions())("value",e.value)("activeIndex",e.activeIndex)("numVisible",e.numVisibleLimit||e.numVisible)("ngStyle",e.containerStyle)("fullScreen",e.fullScreen)("pt",e.pt())("pFocusTrapDisabled",!e.fullScreen)("unstyled",e.unstyled())}}function it(t,r){if(t&1){let e=w();g(0,"div",4),f("pMotionOnAfterLeave",function(){u(e);let n=o(2);return p(n.onMaskAfterLeave())})("click",function(n){u(e);let a=o(2);return p(a.onMaskHide(n))}),Y(1,tt,1,12,"div",5),v()}if(t&2){let e=o(2);d(e.maskClass),l("pBind",e.ptm("mask"))("pMotion",e.maskVisible)("pMotionAppear",!0)("pMotionEnterActiveClass",e.fullScreen?"p-overlay-mask-enter-active":"")("pMotionLeaveActiveClass",e.fullScreen?"p-overlay-mask-leave-active":"")("pMotionOptions",e.computedMaskMotionOptions())("ngClass",e.cx("mask")),T("role",e.fullScreen?"dialog":"region")("aria-modal",e.fullScreen?"true":void 0),c(),J(e.renderContent()?1:-1)}}function nt(t,r){if(t&1&&(g(0,"div",null,1),Y(2,it,2,12,"div",3),v()),t&2){let e=o();c(2),J(e.renderMask()?2:-1)}}function at(t,r){if(t&1){let e=w();g(0,"div",7),f("activeItemChange",function(n){u(e);let a=o();return p(a.onActiveItemChange(n))}),v()}if(t&2){let e=o();l("pt",e.pt())("unstyled",e.unstyled())("value",e.value)("activeIndex",e.activeIndex)("numVisible",e.numVisibleLimit||e.numVisible)}}var lt=["closeButton"],ot=()=>({}),rt=["pGalleriaContent",""];function st(t,r){if(t&1&&(S(),I(0,"svg",10)),t&2){let e=o(3);d(e.cx("closeIcon")),l("pBind",e.getPTOptions("closeIcon"))}}function ct(t,r){}function dt(t,r){t&1&&m(0,ct,0,0,"ng-template")}function ut(t,r){if(t&1){let e=w();g(0,"button",7),f("click",function(){u(e);let n=o(2);return p(n.maskHide.emit())}),m(1,st,1,3,"svg",8)(2,dt,1,0,null,9),v()}if(t&2){let e=o(2);d(e.cx("closeButton")),l("pBind",e.getPTOptions("closeButton")),T("aria-label",e.closeAriaLabel()),c(),l("ngIf",!e.galleria.closeIconTemplate&&!e.galleria._closeIconTemplate),c(),l("ngTemplateOutlet",e.galleria.closeIconTemplate||e.galleria._closeIconTemplate)}}function pt(t,r){if(t&1&&I(0,"div",11),t&2){let e=o(2);d(e.cx("header")),l("unstyled",e.unstyled())("templates",e.galleria.templates)("pBind",e.getPTOptions("header"))}}function mt(t,r){if(t&1){let e=w();g(0,"div",12),f("onActiveIndexChange",function(n){u(e);let a=o(2);return p(a.onActiveIndexChange(n))})("stopSlideShow",function(){u(e);let n=o(2);return p(n.stopSlideShow())}),v()}if(t&2){let e=o(2);l("containerId",e.id)("value",e.value)("activeIndex",e.activeIndex)("templates",e.galleria.templates)("numVisible",e.numVisible)("responsiveOptions",e.galleria.responsiveOptions)("circular",e.galleria.circular)("isVertical",e.isVertical())("contentHeight",e.galleria.verticalThumbnailViewPortHeight)("showThumbnailNavigators",e.galleria.showThumbnailNavigators)("slideShowActive",e.slideShowActive)("pt",e.pt())("unstyled",e.unstyled())}}function ht(t,r){if(t&1&&I(0,"div",13),t&2){let e=o(2);d(e.cx("footer")),l("pBind",e.getPTOptions("footer"))("templates",e.galleria.templates)("unstyled",e.unstyled())}}function gt(t,r){if(t&1){let e=w();F(0),m(1,ut,3,6,"button",1)(2,pt,1,5,"div",2),g(3,"div",3)(4,"div",4),f("onActiveIndexChange",function(n){u(e);let a=o();return p(a.onActiveIndexChange(n))})("startSlideShow",function(){u(e);let n=o();return p(n.startSlideShow())})("stopSlideShow",function(){u(e);let n=o();return p(n.stopSlideShow())}),v(),m(5,mt,1,13,"div",5),v(),m(6,ht,1,5,"div",6),N()}if(t&2){let e=o();c(),l("ngIf",e.galleria.fullScreen),c(),l("ngIf",e.galleria.templates&&(e.galleria.headerFacet||e.galleria.headerTemplate)),c(),d(e.cx("content")),l("pBind",e.getPTOptions("content")),T("aria-live",e.galleria.autoPlay?"polite":"off"),c(),d(e.cx("itemsContainer")),l("id",e.id)("value",e.value)("activeIndex",e.activeIndex)("circular",e.galleria.circular)("templates",e.galleria.templates)("showIndicators",e.galleria.showIndicators)("changeItemOnIndicatorHover",e.galleria.changeItemOnIndicatorHover)("indicatorFacet",e.galleria.indicatorFacet)("captionFacet",e.galleria.captionFacet)("showItemNavigators",e.galleria.showItemNavigators)("autoPlay",e.galleria.autoPlay)("slideShowActive",e.slideShowActive)("pt",e.pt())("unstyled",e.unstyled()),c(),l("ngIf",e.galleria.showThumbnails),c(),l("ngIf",e.shouldRenderFooter())}}var vt=["pGalleriaItemSlot",""];function ft(t,r){t&1&&_e(0)}function bt(t,r){if(t&1&&(F(0),m(1,ft,1,0,"ng-container",1),N()),t&2){let e=o();c(),l("ngTemplateOutlet",e.contentTemplate)("ngTemplateOutletContext",e.context)}}var _t=["pGalleriaItem",""],It=t=>({index:t});function xt(t,r){if(t&1&&(S(),I(0,"svg",8)),t&2){let e=o(2);d(e.cx("prevIcon")),l("pBind",e.ptm("prevIcon"))}}function yt(t,r){}function wt(t,r){t&1&&m(0,yt,0,0,"ng-template")}function Tt(t,r){if(t&1){let e=w();g(0,"button",5),f("click",function(n){u(e);let a=o();return p(a.navBackward(n))})("focus",function(){u(e);let n=o();return p(n.onButtonFocus("left"))})("blur",function(){u(e);let n=o();return p(n.onButtonBlur("left"))}),m(1,xt,1,3,"svg",6)(2,wt,1,0,null,7),v()}if(t&2){let e=o();d(e.cx("prevButton")),l("pBind",e.ptm("prevButton")),c(),l("ngIf",!e.galleria.itemPreviousIconTemplate&&!e.galleria._itemPreviousIconTemplate),c(),l("ngTemplateOutlet",e.galleria.itemPreviousIconTemplate||e.galleria._itemPreviousIconTemplate)}}function Ct(t,r){if(t&1&&(S(),I(0,"svg",10)),t&2){let e=o(2);d(e.cx("nextIcon")),l("pBind",e.ptm("nextIcon"))}}function St(t,r){}function kt(t,r){t&1&&m(0,St,0,0,"ng-template")}function Vt(t,r){if(t&1){let e=w();g(0,"button",5),f("click",function(n){u(e);let a=o();return p(a.navForward(n))})("focus",function(){u(e);let n=o();return p(n.onButtonFocus("right"))})("blur",function(){u(e);let n=o();return p(n.onButtonBlur("right"))}),m(1,Ct,1,3,"svg",9)(2,kt,1,0,null,7),v()}if(t&2){let e=o();d(e.cx("nextButton")),l("pBind",e.ptm("nextButton")),c(),l("ngIf",!e.galleria.itemNextIconTemplate&&!e.galleria._itemNextIconTemplate),c(),l("ngTemplateOutlet",e.galleria.itemNextIconTemplate||e.galleria._itemNextIconTemplate)}}function Bt(t,r){if(t&1&&I(0,"div",11),t&2){let e=o();d(e.cx("caption")),l("pBind",e.ptm("caption"))("unstyled",e.unstyled())("item",e.activeItem)("templates",e.templates)}}function Mt(t,r){if(t&1&&I(0,"button",16),t&2){let e=o().index,i=o(2);d(i.cx("indicatorButton")),l("pBind",i.ptm("indicatorButton",i.getIndicatorPTOptions(e)))}}function At(t,r){if(t&1&&(F(0),I(1,"div",17),N()),t&2){let e=o().index,i=o(2);c(),l("index",e)("templates",i.templates)("pBind",i.ptm("item"))("unstyled",i.unstyled())}}function Ot(t,r){if(t&1){let e=w();g(0,"li",13),f("click",function(){let n=u(e).index,a=o(2);return p(a.onIndicatorClick(n))})("mouseenter",function(){let n=u(e).index,a=o(2);return p(a.onIndicatorMouseEnter(n))})("keydown",function(n){let a=u(e).index,s=o(2);return p(s.onIndicatorKeyDown(n,a))}),m(1,Mt,1,3,"button",14)(2,At,2,4,"ng-container",15),v()}if(t&2){let e=r.index,i=o(2);d(i.cx("indicator",ee(10,It,e))),l("pBind",i.getIndicatorPTOptions(e))("pBind",i.ptm("indicator",i.getIndicatorPTOptions(e))),T("aria-label",i.ariaPageLabel(e+1))("aria-selected",i.activeIndex===e)("aria-controls",i.id+"_item_"+e)("data-p-active",i.isIndicatorItemActive(e)),c(),l("ngIf",!i.indicatorFacet&&!i.galleria.indicatorTemplate),c(),l("ngIf",i.indicatorFacet||i.galleria.indicatorTemplate)}}function Ft(t,r){if(t&1&&(g(0,"ul",0),m(1,Ot,3,12,"li",12),v()),t&2){let e=o();d(e.cx("indicatorList")),l("pBind",e.ptm("indicatorList")),c(),l("ngForOf",e.value)}}var Nt=["itemsContainer"],Gt=["pGalleriaThumbnails",""],Pt=t=>({height:t}),Et=(t,r)=>({index:t,activeIndex:r});function Dt(t,r){if(t&1&&(S(),I(0,"svg",11)),t&2){let e=o(3);d(e.cx("thumbnailPrevIcon")),l("pBind",e.ptm("thumbnailPrevIcon"))}}function Lt(t,r){if(t&1&&(S(),I(0,"svg",12)),t&2){let e=o(3);d(e.cx("thumbnailPrevIcon")),l("pBind",e.ptm("thumbnailPrevIcon"))}}function Ht(t,r){if(t&1&&(F(0),m(1,Dt,1,3,"svg",9)(2,Lt,1,3,"svg",10),N()),t&2){let e=o(2);c(),l("ngIf",!e.isVertical),c(),l("ngIf",e.isVertical)}}function Rt(t,r){}function Qt(t,r){t&1&&m(0,Rt,0,0,"ng-template")}function zt(t,r){if(t&1){let e=w();g(0,"button",6),f("click",function(n){u(e);let a=o();return p(a.navBackward(n))}),m(1,Ht,3,2,"ng-container",7)(2,Qt,1,0,null,8),v()}if(t&2){let e=o();d(e.cx("thumbnailPrevButton")),l("pBind",e.ptm("thumbnailPrevButton")),T("aria-label",e.ariaPrevButtonLabel()),c(),l("ngIf",!e.galleria.previousThumbnailIconTemplate&&!e.galleria._previousThumbnailIconTemplate),c(),l("ngTemplateOutlet",e.galleria.previousThumbnailIconTemplate||e.galleria._previousThumbnailIconTemplate)}}function $t(t,r){if(t&1){let e=w();g(0,"div",13),f("keydown",function(n){let a=u(e).index,s=o();return p(s.onThumbnailKeydown(n,a))}),g(1,"div",14),f("click",function(){let n=u(e).index,a=o();return p(a.onItemClick(n))})("touchend",function(){let n=u(e).index,a=o();return p(a.onItemClick(n))})("keydown.enter",function(){let n=u(e).index,a=o();return p(a.onItemClick(n))}),I(2,"div",15),v()()}if(t&2){let e=r.$implicit,i=r.index,n=o();d(n.cx("thumbnailItem",Te(16,Et,i,n.activeIndex))),l("pBind",n.ptm("thumbnailItem")),T("aria-selected",n.activeIndex===i)("aria-controls",n.containerId+"_item_"+i)("data-p-active",n.activeIndex===i),c(),d(n.cx("thumbnail")),l("pBind",n.ptm("thumbnail")),T("tabindex",n.activeIndex===i?0:-1)("aria-current",n.activeIndex===i?"page":void 0)("aria-label",n.ariaPageLabel(i+1)),c(),l("pBind",n.ptm("thumbnailItem"))("item",e)("templates",n.templates)("unstyled",n.unstyled())}}function jt(t,r){if(t&1&&(S(),I(0,"svg",18)),t&2){let e=o(3);d(e.cx("thumbnailNextIcon")),l("pBind",e.ptm("thumbnailNextIcon"))}}function qt(t,r){if(t&1&&(S(),I(0,"svg",19)),t&2){let e=o(3);d(e.cx("thumbnailNextIcon")),l("pBind",e.ptm("thumbnailNextIcon"))}}function Kt(t,r){if(t&1&&(F(0),m(1,jt,1,3,"svg",16)(2,qt,1,3,"svg",17),N()),t&2){let e=o(2);c(),l("ngIf",!e.isVertical),c(),l("ngIf",e.isVertical)}}function Zt(t,r){}function Ut(t,r){t&1&&m(0,Zt,0,0,"ng-template")}function Wt(t,r){if(t&1){let e=w();g(0,"button",6),f("click",function(n){u(e);let a=o();return p(a.navForward(n))}),m(1,Kt,3,2,"ng-container",7)(2,Ut,1,0,null,8),v()}if(t&2){let e=o();d(e.cx("thumbnailNextButton")),l("pBind",e.ptm("thumbnailNextButton")),T("aria-label",e.ariaNextButtonLabel()),c(),l("ngIf",!e.galleria.nextThumbnailIconTemplate&&!e.galleria._nextThumbnailIconTemplate),c(),l("ngTemplateOutlet",e.galleria.nextThumbnailIconTemplate||e.galleria._nextThumbnailIconTemplate)}}var Xt={mask:"p-galleria-mask p-overlay-mask",root:({instance:t})=>{let r=t.galleria.showThumbnails&&t.getPositionClass("p-galleria-thumbnails",t.galleria.thumbnailsPosition),e=t.galleria.showIndicators&&t.getPositionClass("p-galleria-indicators",t.galleria.indicatorsPosition);return["p-galleria p-component",{"p-galleria-fullscreen":t.galleria.fullScreen,"p-galleria-inset-indicators":t.galleria.showIndicatorsOnItem,"p-galleria-hover-navigators":t.galleria.showItemNavigatorsOnHover&&!t.galleria.fullScreen},r,e]},closeButton:"p-galleria-close-button",closeIcon:"p-galleria-close-icon",header:"p-galleria-header",content:"p-galleria-content",footer:"p-galleria-footer",itemsContainer:"p-galleria-items-container",items:"p-galleria-items",prevButton:({instance:t})=>["p-galleria-prev-button p-galleria-nav-button",{"p-disabled":t.isNavBackwardDisabled()}],prevIcon:"p-galleria-prev-icon",item:"p-galleria-item",nextButton:({instance:t})=>["p-galleria-next-button p-galleria-nav-button",{"p-disabled":t.isNavForwardDisabled()}],nextIcon:"p-galleria-next-icon",caption:"p-galleria-caption",indicatorList:"p-galleria-indicator-list",indicator:({instance:t,index:r})=>["p-galleria-indicator",{"p-galleria-indicator-active":t.isIndicatorItemActive(r)}],indicatorButton:"p-galleria-indicator-button",thumbnails:"p-galleria-thumbnails",thumbnailContent:"p-galleria-thumbnails-content",thumbnailPrevButton:({instance:t})=>["p-galleria-thumbnail-prev-button p-galleria-thumbnail-nav-button",{"p-disabled":t.isNavBackwardDisabled()}],thumbnailPrevIcon:"p-galleria-thumbnail-prev-icon",thumbnailsViewport:"p-galleria-thumbnails-viewport",thumbnailItems:"p-galleria-thumbnail-items",thumbnailItem:({instance:t,index:r,activeIndex:e})=>["p-galleria-thumbnail-item",{"p-galleria-thumbnail-item-current":e===r,"p-galleria-thumbnail-item-active":t.isItemActive(r),"p-galleria-thumbnail-item-start":t.firstItemAciveIndex()===r,"p-galleria-thumbnail-item-end":t.lastItemActiveIndex()===r}],thumbnail:"p-galleria-thumbnail",thumbnailNextButton:({instance:t})=>["p-galleria-thumbnail-next-button  p-galleria-thumbnail-nav-button",{"p-disabled":t.isNavForwardDisabled()}],thumbnailNextIcon:"p-galleria-thumbnail-next-icon"},k=(()=>{class t extends Fe{name="galleria";style=Qe;classes=Xt;static \u0275fac=(()=>{let e;return function(n){return(e||(e=X(t)))(n||t)}})();static \u0275prov=me({token:t,factory:t.\u0275fac})}return t})();var Z=new ge("GALLERIA_INSTANCE"),U=(()=>{class t extends D{element;componentName="Galleria";bindDirectiveInstance=y(x,{self:!0});$pcGalleria=y(Z,{optional:!0,skipSelf:!0})??void 0;onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("host"))}get activeIndex(){return this._activeIndex}set activeIndex(e){this._activeIndex=e}fullScreen=!1;id;value;numVisible=3;responsiveOptions;showItemNavigators=!1;showThumbnailNavigators=!0;showItemNavigatorsOnHover=!1;changeItemOnIndicatorHover=!1;circular=!1;autoPlay=!1;shouldStopAutoplayByClick=!0;transitionInterval=4e3;showThumbnails=!0;thumbnailsPosition="bottom";verticalThumbnailViewPortHeight="300px";showIndicators=!1;showIndicatorsOnItem=!1;indicatorsPosition="bottom";baseZIndex=0;maskClass;containerClass;containerStyle;showTransitionOptions="150ms cubic-bezier(0, 0, 0.2, 1)";hideTransitionOptions="150ms cubic-bezier(0, 0, 0.2, 1)";motionOptions=ie(void 0);computedMotionOptions=te(()=>L(L({},this.ptm("motion")),this.motionOptions()));maskMotionOptions=ie(void 0);computedMaskMotionOptions=te(()=>L(L({},this.ptm("maskMotion")),this.maskMotionOptions()));get visible(){return this._visible}set visible(e){this._visible=e,this._visible&&!this.maskVisible?(this.maskVisible=!0,this.renderMask.set(!0),this.renderContent.set(!0)):!this._visible&&this.maskVisible&&(this.maskVisible=!1)}renderMask=W(!1);renderContent=W(!1);activeIndexChange=new C;visibleChange=new C;container;_visible=!1;_activeIndex=0;headerTemplate;headerFacet;footerTemplate;footerFacet;indicatorTemplate;indicatorFacet;captionTemplate;captionFacet;_closeIconTemplate;closeIconTemplate;_previousThumbnailIconTemplate;previousThumbnailIconTemplate;_nextThumbnailIconTemplate;nextThumbnailIconTemplate;_itemPreviousIconTemplate;itemPreviousIconTemplate;_itemNextIconTemplate;itemNextIconTemplate;_itemTemplate;itemTemplate;_thumbnailTemplate;thumbnailTemplate;maskVisible=!1;numVisibleLimit=0;_componentStyle=y(k);mask;templates;constructor(e){super(),this.element=e}onAfterContentInit(){this.templates?.forEach(e=>{switch(e.getType()){case"header":this.headerFacet=e.template;break;case"footer":this.footerFacet=e.template;break;case"indicator":this.indicatorFacet=e.template;break;case"closeicon":this.closeIconTemplate=e.template;break;case"itemnexticon":this.itemNextIconTemplate=e.template;break;case"itempreviousicon":this.itemPreviousIconTemplate=e.template;break;case"previousthumbnailicon":this.previousThumbnailIconTemplate=e.template;break;case"nextthumbnailicon":this.nextThumbnailIconTemplate=e.template;break;case"caption":this.captionFacet=e.template;break;case"item":this.itemTemplate=e.template;break;case"thumbnail":this.thumbnailTemplate=e.template;break}})}onChanges(e){e.value&&e.value.currentValue?.length<this.numVisible?this.numVisibleLimit=e.value.currentValue.length:this.numVisibleLimit=0}onMaskHide(e){(!e||e.target===e.currentTarget)&&(this.visible=!1,this.visibleChange.emit(!1))}onActiveItemChange(e){this.activeIndex!==e&&(this.activeIndex=e,this.activeIndexChange.emit(e))}onBeforeEnter(e){this.mask=e.element?.parentElement,this.enableModality(),setTimeout(()=>{let i=j(this.container?.nativeElement,'[data-pc-section="closebutton"]');i&&Be(i)},25)}onBeforeLeave(){this.mask&&(this.maskVisible=!1)}onAfterLeave(){this.disableModality(),this.renderContent.set(!1)}onMaskAfterLeave(){this.renderContent()||this.renderMask.set(!1)}enableModality(){De(),this.cd.markForCheck(),this.mask&&ue.set("modal",this.mask,this.baseZIndex||this.config.zIndex.modal)}disableModality(){Le(),this.cd.markForCheck(),this.mask&&ue.clear(this.mask)}onDestroy(){this.fullScreen&&$(this.document.body,"p-overflow-hidden"),this.mask&&this.disableModality()}static \u0275fac=function(i){return new(i||t)(M(ve))};static \u0275cmp=A({type:t,selectors:[["p-galleria"]],contentQueries:function(i,n,a){if(i&1&&Ie(a,ze,4)(a,$e,4)(a,je,4)(a,qe,4)(a,Ke,4)(a,Ze,4)(a,Ue,4)(a,We,4)(a,Xe,4)(a,Ye,4)(a,Je,4)(a,Oe,4),i&2){let s;b(s=_())&&(n.headerTemplate=s.first),b(s=_())&&(n.footerTemplate=s.first),b(s=_())&&(n.indicatorTemplate=s.first),b(s=_())&&(n.captionTemplate=s.first),b(s=_())&&(n._closeIconTemplate=s.first),b(s=_())&&(n._previousThumbnailIconTemplate=s.first),b(s=_())&&(n._nextThumbnailIconTemplate=s.first),b(s=_())&&(n._itemPreviousIconTemplate=s.first),b(s=_())&&(n._itemNextIconTemplate=s.first),b(s=_())&&(n._itemTemplate=s.first),b(s=_())&&(n._thumbnailTemplate=s.first),b(s=_())&&(n.templates=s)}},viewQuery:function(i,n){if(i&1&&z(et,5),i&2){let a;b(a=_())&&(n.container=a.first)}},inputs:{activeIndex:"activeIndex",fullScreen:[2,"fullScreen","fullScreen",h],id:"id",value:"value",numVisible:[2,"numVisible","numVisible",G],responsiveOptions:"responsiveOptions",showItemNavigators:[2,"showItemNavigators","showItemNavigators",h],showThumbnailNavigators:[2,"showThumbnailNavigators","showThumbnailNavigators",h],showItemNavigatorsOnHover:[2,"showItemNavigatorsOnHover","showItemNavigatorsOnHover",h],changeItemOnIndicatorHover:[2,"changeItemOnIndicatorHover","changeItemOnIndicatorHover",h],circular:[2,"circular","circular",h],autoPlay:[2,"autoPlay","autoPlay",h],shouldStopAutoplayByClick:[2,"shouldStopAutoplayByClick","shouldStopAutoplayByClick",h],transitionInterval:[2,"transitionInterval","transitionInterval",G],showThumbnails:[2,"showThumbnails","showThumbnails",h],thumbnailsPosition:"thumbnailsPosition",verticalThumbnailViewPortHeight:"verticalThumbnailViewPortHeight",showIndicators:[2,"showIndicators","showIndicators",h],showIndicatorsOnItem:[2,"showIndicatorsOnItem","showIndicatorsOnItem",h],indicatorsPosition:"indicatorsPosition",baseZIndex:[2,"baseZIndex","baseZIndex",G],maskClass:"maskClass",containerClass:"containerClass",containerStyle:"containerStyle",showTransitionOptions:"showTransitionOptions",hideTransitionOptions:"hideTransitionOptions",motionOptions:[1,"motionOptions"],maskMotionOptions:[1,"maskMotionOptions"],visible:"visible"},outputs:{activeIndexChange:"activeIndexChange",visibleChange:"visibleChange"},standalone:!1,features:[R([k,{provide:Z,useExisting:t},{provide:Ne,useExisting:t}]),H([x]),O],decls:3,vars:2,consts:[["windowed",""],["container",""],[4,"ngIf","ngIfElse"],[3,"pBind","pMotion","pMotionAppear","pMotionEnterActiveClass","pMotionLeaveActiveClass","pMotionOptions","ngClass","class"],[3,"pMotionOnAfterLeave","click","pBind","pMotion","pMotionAppear","pMotionEnterActiveClass","pMotionLeaveActiveClass","pMotionOptions","ngClass"],["pGalleriaContent","","pFocusTrap","",3,"pMotion","pMotionAppear","pMotionName","pMotionOptions","value","activeIndex","numVisible","ngStyle","fullScreen","pt","pFocusTrapDisabled","unstyled"],["pGalleriaContent","","pFocusTrap","",3,"pMotionOnBeforeEnter","pMotionOnBeforeLeave","pMotionOnAfterLeave","maskHide","activeItemChange","pMotion","pMotionAppear","pMotionName","pMotionOptions","value","activeIndex","numVisible","ngStyle","fullScreen","pt","pFocusTrapDisabled","unstyled"],["pGalleriaContent","",3,"activeItemChange","pt","unstyled","value","activeIndex","numVisible"]],template:function(i,n){if(i&1&&m(0,nt,3,1,"div",2)(1,at,1,5,"ng-template",null,0,Ce),i&2){let a=xe(2);l("ngIf",n.fullScreen)("ngIfElse",a)}},dependencies:()=>[ke,P,ae,Re,x,Pe,Yt],encapsulation:2,changeDetection:0})}return t})(),Yt=(()=>{class t extends D{galleria;differs;hostName="Galleria";bindDirectiveInstance=y(x,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.getPTOptions("root"))}get activeIndex(){return this._activeIndex}set activeIndex(e){this._activeIndex=e}value=[];numVisible;fullScreen;maskHide=new C;activeItemChange=new C;closeButton;_componentStyle=y(k);$pcGalleria=y(Z,{optional:!0,skipSelf:!0})??void 0;id;_activeIndex=0;slideShowActive=!0;interval;styleClass;differ;constructor(e,i){super(),this.galleria=e,this.differs=i,this.id=this.galleria.id||Ae("pn_id_"),this.differ=this.differs.find(this.galleria).create()}handleFullscreenChange(e){document?.fullscreenElement===this.el.nativeElement?.children[0]?this.fullScreen=!0:this.fullScreen=!1}onDoCheck(){if(V(this.galleria.platformId)){let e=this.differ.diff(this.galleria);e&&e.forEachItem.length>0&&this.cd.markForCheck()}}shouldRenderFooter(){return this.galleria.footerFacet&&this.galleria.templates&&this.galleria.templates.toArray().length>0||this.galleria.footerTemplate}startSlideShow(){V(this.galleria.platformId)&&(this.interval=setInterval(()=>{let e=this.galleria.circular&&this.value.length-1===this.activeIndex?0:this.activeIndex+1;this.onActiveIndexChange(e),this.activeIndex=e},this.galleria.transitionInterval),this.slideShowActive=!0)}stopSlideShow(){this.galleria.autoPlay&&!this.galleria.shouldStopAutoplayByClick||(this.interval&&clearInterval(this.interval),this.slideShowActive=!1)}getPositionClass(e,i){let a=["top","left","bottom","right"].find(s=>s===i);return a?`${e}-${a}`:""}isVertical(){return this.galleria.thumbnailsPosition==="left"||this.galleria.thumbnailsPosition==="right"}onActiveIndexChange(e){this.activeIndex!==e&&(this.activeIndex=e,this.activeItemChange.emit(this.activeIndex))}closeAriaLabel(){return this.config.translation.aria?this.config.translation.aria.close:void 0}getPTOptions(e){return this.ptm(e,{context:{pt:this.pt(),unstyled:this.unstyled()}})}static \u0275fac=function(i){return new(i||t)(M(U),M(Se))};static \u0275cmp=A({type:t,selectors:[["div","pGalleriaContent",""]],viewQuery:function(i,n){if(i&1&&z(lt,5),i&2){let a;b(a=_())&&(n.closeButton=a.first)}},hostVars:7,hostBindings:function(i,n){i&1&&f("fullscreenchange",function(s){return n.handleFullscreenChange(s)},fe),i&2&&(T("id",n.id)("role","region"),ye(n.galleria.fullScreen?we(6,ot):n.galleria.containerStyle),d(n.cn(n.cx("root"))))},inputs:{activeIndex:"activeIndex",value:"value",numVisible:[2,"numVisible","numVisible",G],fullScreen:[2,"fullScreen","fullScreen",h]},outputs:{maskHide:"maskHide",activeItemChange:"activeItemChange"},standalone:!1,features:[R([k]),H([x]),O],attrs:rt,decls:1,vars:1,consts:[[4,"ngIf"],["type","button",3,"pBind","class","click",4,"ngIf"],["pGalleriaItemSlot","","type","header",3,"unstyled","templates","pBind","class",4,"ngIf"],[3,"pBind"],["pGalleriaItem","",3,"onActiveIndexChange","startSlideShow","stopSlideShow","id","value","activeIndex","circular","templates","showIndicators","changeItemOnIndicatorHover","indicatorFacet","captionFacet","showItemNavigators","autoPlay","slideShowActive","pt","unstyled"],["pGalleriaThumbnails","",3,"containerId","value","activeIndex","templates","numVisible","responsiveOptions","circular","isVertical","contentHeight","showThumbnailNavigators","slideShowActive","pt","unstyled","onActiveIndexChange","stopSlideShow",4,"ngIf"],["pGalleriaItemSlot","","type","footer",3,"pBind","class","templates","unstyled",4,"ngIf"],["type","button",3,"click","pBind"],["data-p-icon","times",3,"pBind","class",4,"ngIf"],[4,"ngTemplateOutlet"],["data-p-icon","times",3,"pBind"],["pGalleriaItemSlot","","type","header",3,"unstyled","templates","pBind"],["pGalleriaThumbnails","",3,"onActiveIndexChange","stopSlideShow","containerId","value","activeIndex","templates","numVisible","responsiveOptions","circular","isVertical","contentHeight","showThumbnailNavigators","slideShowActive","pt","unstyled"],["pGalleriaItemSlot","","type","footer",3,"pBind","templates","unstyled"]],template:function(i,n){i&1&&m(0,gt,7,24,"ng-container",0),i&2&&l("ngIf",n.value&&n.value.length>0)},dependencies:()=>[P,Q,de,x,pe,Jt,ei],encapsulation:2,changeDetection:0})}return t})(),pe=(()=>{class t extends D{hostName="Galleria";templates;index;get item(){return this._item}shouldRender(){return this.contentTemplate||this.galleria._itemTemplate||this.galleria.itemTemplate||this.galleria.captionTemplate||this.galleria.captionTemplate||this.galleria.captionFacet||this.galleria.thumbnailTemplate||this.galleria._thumbnailTemplate||this.galleria.footerTemplate}galleria=y(U);$pcGalleria=y(Z,{optional:!0,skipSelf:!0})??void 0;set item(e){this._item=e,this.templates&&this.templates?.toArray().length>0?this.templates.forEach(i=>{if(i.getType()===this.type)switch(this.type){case"item":case"caption":case"thumbnail":this.context={$implicit:this.item},this.contentTemplate=i.template;break;case"footer":this.context={$implicit:this.item},this.contentTemplate=i.template;break}}):this.getContentTemplate()}getTemplateFromQueryList(e){return this.galleria.templates?.find(i=>i.getType()===e)?.template}getContentTemplate(){switch(this.type){case"item":this.context={$implicit:this.item},this.contentTemplate=this.galleria._itemTemplate||this.getTemplateFromQueryList("item");break;case"caption":this.context={$implicit:this.item},this.contentTemplate=this.galleria.captionTemplate||this.getTemplateFromQueryList("caption");break;case"thumbnail":this.context={$implicit:this.item},this.contentTemplate=this.galleria._thumbnailTemplate||this.getTemplateFromQueryList("thumbnail");break;case"indicator":this.context={$implicit:this.index},this.contentTemplate=this.galleria.indicatorTemplate||this.getTemplateFromQueryList("indicator");break;case"footer":this.context={$implicit:this.item},this.contentTemplate=this.galleria.footerTemplate||this.getTemplateFromQueryList("footer");break;default:this.context={$implicit:this.item},this.contentTemplate=this.galleria._itemTemplate||this.getTemplateFromQueryList("item")}}type;contentTemplate;context;_item;onAfterContentInit(){this.templates&&this.templates.toArray().length>0?this.templates?.forEach(e=>{if(e.getType()===this.type)switch(this.type){case"item":case"caption":case"thumbnail":this.context={$implicit:this.item},this.contentTemplate=e.template;break;case"indicator":this.context={$implicit:this.index},this.contentTemplate=e.template;break;case"footer":this.context={$implicit:this.item},this.contentTemplate=e.template;break;default:this.context={$implicit:this.item},this.contentTemplate=e.template;break}}):this.getContentTemplate()}static \u0275fac=(()=>{let e;return function(n){return(e||(e=X(t)))(n||t)}})();static \u0275cmp=A({type:t,selectors:[["div","pGalleriaItemSlot",""]],inputs:{templates:"templates",index:[2,"index","index",G],item:"item",type:"type"},standalone:!1,features:[O],attrs:vt,decls:1,vars:1,consts:[[4,"ngIf"],[4,"ngTemplateOutlet","ngTemplateOutletContext"]],template:function(i,n){i&1&&m(0,bt,2,2,"ng-container",0),i&2&&l("ngIf",n.shouldRender())},dependencies:[P,Q],encapsulation:2,changeDetection:0})}return t})(),Jt=(()=>{class t extends D{galleria;hostName="Galleria";bindDirectiveInstance=y(x,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("itemsContainer"))}id;circular=!1;value;showItemNavigators=!1;showIndicators=!0;slideShowActive=!0;changeItemOnIndicatorHover=!0;autoPlay=!1;templates;indicatorFacet;captionFacet;startSlideShow=new C;stopSlideShow=new C;onActiveIndexChange=new C;_componentStyle=y(k);get activeIndex(){return this._activeIndex}set activeIndex(e){this._activeIndex=e}get activeItem(){return this.value&&this.value[this._activeIndex]}_activeIndex=0;leftButtonFocused=!1;rightButtonFocused=!1;constructor(e){super(),this.galleria=e}getIndicatorPTOptions(e){return this.ptm("indicator",{context:{highlighted:this.activeIndex===e}})}onChanges({autoPlay:e}){e?.currentValue&&this.startSlideShow.emit(),e&&e.currentValue===!1&&this.stopTheSlideShow()}next(){let e=this.activeIndex+1,i=this.circular&&this.value.length-1===this.activeIndex?0:e;this.onActiveIndexChange.emit(i)}prev(){let e=this.activeIndex!==0?this.activeIndex-1:0,i=this.circular&&this.activeIndex===0?this.value.length-1:e;this.onActiveIndexChange.emit(i)}onButtonFocus(e){e==="left"?this.leftButtonFocused=!0:this.rightButtonFocused=!0}onButtonBlur(e){e==="left"?this.leftButtonFocused=!1:this.rightButtonFocused=!1}stopTheSlideShow(){this.slideShowActive&&this.stopSlideShow&&this.stopSlideShow.emit()}navForward(e){this.stopTheSlideShow(),this.next(),e&&e.cancelable&&(e.stopPropagation(),e.preventDefault())}navBackward(e){this.stopTheSlideShow(),this.prev(),e&&e.cancelable&&(e.stopPropagation(),e.preventDefault())}onIndicatorClick(e){this.stopTheSlideShow(),this.onActiveIndexChange.emit(e)}onIndicatorMouseEnter(e){this.changeItemOnIndicatorHover&&(this.stopTheSlideShow(),this.onActiveIndexChange.emit(e))}onIndicatorKeyDown(e,i){switch(e.code){case"Enter":case"Space":this.stopTheSlideShow(),this.onActiveIndexChange.emit(i),e.preventDefault();break;case"ArrowDown":case"ArrowUp":e.preventDefault();break;default:break}}isNavForwardDisabled(){return!this.circular&&this.activeIndex===this.value.length-1}isNavBackwardDisabled(){return!this.circular&&this.activeIndex===0}isIndicatorItemActive(e){return this.activeIndex===e}ariaSlideLabel(){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.slide:void 0}ariaSlideNumber(e){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.slideNumber?.replace(/{slideNumber}/g,e):void 0}ariaPageLabel(e){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.pageLabel?.replace(/{page}/g,e):void 0}static \u0275fac=function(i){return new(i||t)(M(U))};static \u0275cmp=A({type:t,selectors:[["div","pGalleriaItem",""]],inputs:{id:"id",circular:[2,"circular","circular",h],value:"value",showItemNavigators:[2,"showItemNavigators","showItemNavigators",h],showIndicators:[2,"showIndicators","showIndicators",h],slideShowActive:[2,"slideShowActive","slideShowActive",h],changeItemOnIndicatorHover:[2,"changeItemOnIndicatorHover","changeItemOnIndicatorHover",h],autoPlay:[2,"autoPlay","autoPlay",h],templates:"templates",indicatorFacet:"indicatorFacet",captionFacet:"captionFacet",activeIndex:"activeIndex"},outputs:{startSlideShow:"startSlideShow",stopSlideShow:"stopSlideShow",onActiveIndexChange:"onActiveIndexChange"},standalone:!1,features:[R([k]),H([x]),O],attrs:_t,decls:6,vars:16,consts:[[3,"pBind"],["type","button","role","navigation","data-pc-group-section","itemnavigator",3,"pBind","class","click","focus","blur",4,"ngIf"],["pGalleriaItemSlot","","role","group",3,"pBind","unstyled","item","templates","id"],["pGalleriaItemSlot","","type","caption",3,"pBind","unstyled","class","item","templates",4,"ngIf"],[3,"pBind","class",4,"ngIf"],["type","button","role","navigation","data-pc-group-section","itemnavigator",3,"click","focus","blur","pBind"],["data-p-icon","chevron-left",3,"pBind","class",4,"ngIf"],[4,"ngTemplateOutlet"],["data-p-icon","chevron-left",3,"pBind"],["data-p-icon","chevron-right",3,"pBind","class",4,"ngIf"],["data-p-icon","chevron-right",3,"pBind"],["pGalleriaItemSlot","","type","caption",3,"pBind","unstyled","item","templates"],["tabindex","0",3,"pBind","class","click","mouseenter","keydown",4,"ngFor","ngForOf"],["tabindex","0",3,"click","mouseenter","keydown","pBind"],["type","button","tabIndex","-1",3,"pBind","class",4,"ngIf"],[4,"ngIf"],["type","button","tabIndex","-1",3,"pBind"],["pGalleriaItemSlot","","type","indicator",3,"index","templates","pBind","unstyled"]],template:function(i,n){i&1&&(g(0,"div",0),m(1,Tt,3,5,"button",1),I(2,"div",2),m(3,Vt,3,5,"button",1)(4,Bt,1,6,"div",3),v(),m(5,Ft,2,4,"ul",4)),i&2&&(d(n.cx("items")),l("pBind",n.ptm("items")),c(),l("ngIf",n.showItemNavigators),c(),d(n.cx("item")),l("pBind",n.ptm("item"))("unstyled",n.unstyled())("item",n.activeItem)("templates",n.templates)("id",n.id+"_item_"+n.activeIndex),T("aria-label",n.ariaSlideNumber(n.activeIndex+1))("aria-roledescription",n.ariaSlideLabel()),c(),l("ngIf",n.showItemNavigators),c(),l("ngIf",n.captionFacet||n.galleria.captionTemplate),c(),l("ngIf",n.showIndicators))},dependencies:()=>[ne,P,Q,K,q,x,pe],encapsulation:2,changeDetection:0})}return t})(),ei=(()=>{class t extends D{galleria;hostName="Galleria";bindDirectiveInstance=y(x,{self:!0});onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptm("thumbnails"))}containerId;value;isVertical=!1;slideShowActive=!1;circular=!1;responsiveOptions;contentHeight="300px";showThumbnailNavigators=!0;templates;onActiveIndexChange=new C;stopSlideShow=new C;itemsContainer;get numVisible(){return this._numVisible}set numVisible(e){this._numVisible=e,this._oldNumVisible=this.d_numVisible,this.d_numVisible=e}get activeIndex(){return this._activeIndex}set activeIndex(e){this._oldactiveIndex=this._activeIndex,this._activeIndex=e}index;startPos=null;thumbnailsStyle=null;sortedResponsiveOptions=null;totalShiftedItems=0;page=0;documentResizeListener;_numVisible=0;d_numVisible=0;_oldNumVisible=0;_activeIndex=0;_oldactiveIndex=0;_componentStyle=y(k);constructor(e){super(),this.galleria=e}onInit(){V(this.platformId)&&(this.createStyle(),this.responsiveOptions&&this.bindDocumentListeners())}onAfterContentChecked(){let e=this.totalShiftedItems;(this._oldNumVisible!==this.d_numVisible||this._oldactiveIndex!==this._activeIndex)&&this.itemsContainer&&(this._activeIndex<=this.getMedianItemIndex()?e=0:this.value.length-this.d_numVisible+this.getMedianItemIndex()<this._activeIndex?e=this.d_numVisible-this.value.length:this.value.length-this.d_numVisible<this._activeIndex&&this.d_numVisible%2===0?e=this._activeIndex*-1+this.getMedianItemIndex()+1:e=this._activeIndex*-1+this.getMedianItemIndex(),e!==this.totalShiftedItems&&(this.totalShiftedItems=e),this.itemsContainer&&this.itemsContainer.nativeElement&&(this.itemsContainer.nativeElement.style.transform=this.isVertical?`translate3d(0, ${e*(100/this.d_numVisible)}%, 0)`:`translate3d(${e*(100/this.d_numVisible)}%, 0, 0)`),this._oldactiveIndex!==this._activeIndex&&(this.document.body.setAttribute("data-p-items-hidden","false"),!this.$unstyled()&&$(this.itemsContainer.nativeElement,"p-items-hidden"),this.itemsContainer.nativeElement.style.transition="transform 500ms ease 0s"),this._oldactiveIndex=this._activeIndex,this._oldNumVisible=this.d_numVisible)}onAfterViewInit(){V(this.platformId)&&this.calculatePosition()}createStyle(){this.thumbnailsStyle||(this.thumbnailsStyle=this.document.createElement("style"),oe(this.thumbnailsStyle,"nonce",this.galleria.config?.csp()?.nonce),this.document.body.appendChild(this.thumbnailsStyle));let e=`
            #${this.containerId} .p-galleria-thumbnail-item {
                flex: 1 0 ${100/this.d_numVisible}%
            }
        `;if(this.responsiveOptions&&!this.$unstyled()){this.sortedResponsiveOptions=[...this.responsiveOptions],this.sortedResponsiveOptions.sort((i,n)=>{let a=i.breakpoint,s=n.breakpoint,B;return a==null&&s!=null?B=-1:a!=null&&s==null?B=1:a==null&&s==null?B=0:typeof a=="string"&&typeof s=="string"?B=a.localeCompare(s,void 0,{numeric:!0}):B=a<s?-1:a>s?1:0,-1*B});for(let i=0;i<this.sortedResponsiveOptions.length;i++){let n=this.sortedResponsiveOptions[i];e+=`
                    @media screen and (max-width: ${n.breakpoint}) {
                        #${this.containerId} .p-galleria-thumbnail-item {
                            flex: 1 0 ${100/n.numVisible}%
                        }
                    }
                `}}this.thumbnailsStyle.innerHTML=e,oe(this.thumbnailsStyle,"nonce",this.galleria.config?.csp()?.nonce)}calculatePosition(){if(V(this.platformId)&&this.itemsContainer&&this.sortedResponsiveOptions){let e=window.innerWidth,i={numVisible:this._numVisible};for(let n=0;n<this.sortedResponsiveOptions.length;n++){let a=this.sortedResponsiveOptions[n];parseInt(a.breakpoint,10)>=e&&(i=a)}this.d_numVisible!==i.numVisible&&(this.d_numVisible=i.numVisible,this.cd.markForCheck())}}getTabIndex(e){return this.isItemActive(e)?0:null}navForward(e){this.stopTheSlideShow();let i=this._activeIndex+1;i+this.totalShiftedItems>this.getMedianItemIndex()&&(-1*this.totalShiftedItems<this.getTotalPageNumber()-1||this.circular)&&this.step(-1);let n=this.circular&&this.value.length-1===this._activeIndex?0:i;this.onActiveIndexChange.emit(n),e.cancelable&&e.preventDefault()}navBackward(e){this.stopTheSlideShow();let i=this._activeIndex!==0?this._activeIndex-1:0,n=i+this.totalShiftedItems;this.d_numVisible-n-1>this.getMedianItemIndex()&&(-1*this.totalShiftedItems!==0||this.circular)&&this.step(1);let a=this.circular&&this._activeIndex===0?this.value.length-1:i;this.onActiveIndexChange.emit(a),e.cancelable&&e.preventDefault()}onItemClick(e){this.stopTheSlideShow();let i=e;if(i!==this._activeIndex){let n=i+this.totalShiftedItems,a=0;i<this._activeIndex?(a=this.d_numVisible-n-1-this.getMedianItemIndex(),a>0&&-1*this.totalShiftedItems!==0&&this.step(a)):(a=this.getMedianItemIndex()-n,a<0&&-1*this.totalShiftedItems<this.getTotalPageNumber()-1&&this.step(a)),this.activeIndex=i,this.onActiveIndexChange.emit(this.activeIndex)}}onThumbnailKeydown(e,i){switch((e.code==="Enter"||e.code==="Space")&&(this.onItemClick(i),e.preventDefault()),e.code){case"ArrowRight":this.onRightKey();break;case"ArrowLeft":this.onLeftKey();break;case"Home":this.onHomeKey(),e.preventDefault();break;case"End":this.onEndKey(),e.preventDefault();break;case"ArrowUp":case"ArrowDown":e.preventDefault();break;case"Tab":this.onTabKey();break;default:break}}onRightKey(){let e=E(this.itemsContainer?.nativeElement,'[data-pc-section="thumbnailitem"]'),i=this.findFocusedIndicatorIndex();this.changedFocusedIndicator(i,i+1===e.length?e.length-1:i+1)}onLeftKey(){let e=this.findFocusedIndicatorIndex();this.changedFocusedIndicator(e,e-1<=0?0:e-1)}onHomeKey(){let e=this.findFocusedIndicatorIndex();this.changedFocusedIndicator(e,0)}onEndKey(){let e=E(this.itemsContainer?.nativeElement,'[data-pc-section="thumbnailitem"]'),i=this.findFocusedIndicatorIndex();this.changedFocusedIndicator(i,e.length-1)}onTabKey(){let e=[...E(this.itemsContainer?.nativeElement,'[data-pc-section="thumbnailitem"]')],i=e.findIndex(s=>Me(s,"data-p-active")===!0),n=j(this.itemsContainer?.nativeElement,'[tabindex="0"]'),a=e.findIndex(s=>s===n?.parentElement);e[a].children[0].tabIndex="-1",e[i].children[0].tabIndex="0"}findFocusedIndicatorIndex(){let e=[...E(this.itemsContainer?.nativeElement,'[data-pc-section="thumbnailitem"]')],i=j(this.itemsContainer?.nativeElement,'[data-pc-section="thumbnailitem"] > [tabindex="0"]');return e.findIndex(n=>n===i?.parentElement)}changedFocusedIndicator(e,i){let n=E(this.itemsContainer?.nativeElement,'[data-pc-section="thumbnailitem"]');n[e].children[0].tabIndex="-1",n[i].children[0].tabIndex="0",n[i].children[0].focus()}step(e){let i=this.totalShiftedItems+e;e<0&&-1*i+this.d_numVisible>this.value.length-1?i=this.d_numVisible-this.value.length:e>0&&i>0&&(i=0),this.circular&&(e<0&&this.value.length-1===this._activeIndex?i=0:e>0&&this._activeIndex===0&&(i=this.d_numVisible-this.value.length)),this.itemsContainer&&(this.document.body.setAttribute("data-p-items-hidden","false"),!this.$unstyled()&&$(this.itemsContainer.nativeElement,"p-items-hidden"),this.itemsContainer.nativeElement.style.transform=this.isVertical?`translate3d(0, ${i*(100/this.d_numVisible)}%, 0)`:`translate3d(${i*(100/this.d_numVisible)}%, 0, 0)`,this.itemsContainer.nativeElement.style.transition="transform 500ms ease 0s"),this.totalShiftedItems=i}stopTheSlideShow(){this.slideShowActive&&this.stopSlideShow&&this.stopSlideShow.emit()}changePageOnTouch(e,i){i<0?this.navForward(e):this.navBackward(e)}getTotalPageNumber(){return this.value.length>this.d_numVisible?this.value.length-this.d_numVisible+1:0}getMedianItemIndex(){let e=Math.floor(this.d_numVisible/2);return this.d_numVisible%2?e:e-1}onTransitionEnd(){this.itemsContainer&&this.itemsContainer.nativeElement&&(this.document.body.setAttribute("data-p-items-hidden","true"),!this.$unstyled()&&Ve(this.itemsContainer.nativeElement,"p-items-hidden"),this.itemsContainer.nativeElement.style.transition="")}onTouchEnd(e){let i=e.changedTouches[0];this.isVertical?this.changePageOnTouch(e,i.pageY-this.startPos.y):this.changePageOnTouch(e,i.pageX-this.startPos.x)}onTouchMove(e){e.cancelable&&e.preventDefault()}onTouchStart(e){let i=e.changedTouches[0];this.startPos={x:i.pageX,y:i.pageY}}isNavBackwardDisabled(){return!this.circular&&this._activeIndex===0||this.value.length<=this.d_numVisible}isNavForwardDisabled(){return!this.circular&&this._activeIndex===this.value.length-1||this.value.length<=this.d_numVisible}firstItemAciveIndex(){return this.totalShiftedItems*-1}lastItemActiveIndex(){return this.firstItemAciveIndex()+this.d_numVisible-1}isItemActive(e){return this.firstItemAciveIndex()<=e&&this.lastItemActiveIndex()>=e}bindDocumentListeners(){if(V(this.platformId)){let e=this.document.defaultView||"window";this.documentResizeListener=this.renderer.listen(e,"resize",()=>{this.calculatePosition()})}}unbindDocumentListeners(){this.documentResizeListener&&(this.documentResizeListener(),this.documentResizeListener=null)}onDestroy(){this.responsiveOptions&&this.unbindDocumentListeners(),this.thumbnailsStyle&&this.thumbnailsStyle.parentNode?.removeChild(this.thumbnailsStyle)}ariaPrevButtonLabel(){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.prevPageLabel:void 0}ariaNextButtonLabel(){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.nextPageLabel:void 0}ariaPageLabel(e){return this.galleria.config.translation.aria?this.galleria.config.translation.aria.pageLabel?.replace(/{page}/g,e):void 0}static \u0275fac=function(i){return new(i||t)(M(U))};static \u0275cmp=A({type:t,selectors:[["div","pGalleriaThumbnails",""]],viewQuery:function(i,n){if(i&1&&z(Nt,5),i&2){let a;b(a=_())&&(n.itemsContainer=a.first)}},hostVars:2,hostBindings:function(i,n){i&2&&d(n.cx("thumbnails"))},inputs:{containerId:"containerId",value:"value",isVertical:[2,"isVertical","isVertical",h],slideShowActive:[2,"slideShowActive","slideShowActive",h],circular:[2,"circular","circular",h],responsiveOptions:"responsiveOptions",contentHeight:"contentHeight",showThumbnailNavigators:"showThumbnailNavigators",templates:"templates",numVisible:"numVisible",activeIndex:"activeIndex"},outputs:{onActiveIndexChange:"onActiveIndexChange",stopSlideShow:"stopSlideShow"},standalone:!1,features:[R([k]),H([x]),O],attrs:Gt,decls:7,vars:15,consts:[["itemsContainer",""],[3,"pBind"],["type","button","pRipple","","data-pc-group-section","thumbnailnavigator",3,"pBind","class","click",4,"ngIf"],[3,"pBind","ngStyle"],["role","tablist",3,"transitionend","touchstart","touchmove","pBind"],[3,"pBind","class","keydown",4,"ngFor","ngForOf"],["type","button","pRipple","","data-pc-group-section","thumbnailnavigator",3,"click","pBind"],[4,"ngIf"],[4,"ngTemplateOutlet"],["data-p-icon","chevron-left",3,"pBind","class",4,"ngIf"],["data-p-icon","chevron-up",3,"pBind","class",4,"ngIf"],["data-p-icon","chevron-left",3,"pBind"],["data-p-icon","chevron-up",3,"pBind"],[3,"keydown","pBind"],[3,"click","touchend","keydown.enter","pBind"],["pGalleriaItemSlot","","type","thumbnail",3,"pBind","item","templates","unstyled"],["data-p-icon","chevron-right",3,"pBind","class",4,"ngIf"],["data-p-icon","chevron-down",3,"pBind","class",4,"ngIf"],["data-p-icon","chevron-right",3,"pBind"],["data-p-icon","chevron-down",3,"pBind"]],template:function(i,n){i&1&&(g(0,"div",1),m(1,zt,3,6,"button",2),g(2,"div",3)(3,"div",4,0),f("transitionend",function(){return n.onTransitionEnd()})("touchstart",function(s){return n.onTouchStart(s)})("touchmove",function(s){return n.onTouchMove(s)}),m(5,$t,3,19,"div",5),v()(),m(6,Wt,3,6,"button",2),v()),i&2&&(d(n.cx("thumbnailContent")),l("pBind",n.ptm("thumbnailContent")),c(),l("ngIf",n.showThumbnailNavigators),c(),d(n.cx("thumbnailsViewport")),l("pBind",n.ptm("thumbnailsViewport"))("ngStyle",ee(13,Pt,n.isVertical?n.contentHeight:"")),c(),d(n.cx("thumbnailItems")),l("pBind",n.ptm("thumbnailItems")),c(2),l("ngForOf",n.value),c(),l("ngIf",n.showThumbnailNavigators))},dependencies:()=>[ne,P,Q,ae,He,K,ce,se,q,x,pe],encapsulation:2,changeDetection:0})}return t})(),Ai=(()=>{class t{static \u0275fac=function(i){return new(i||t)};static \u0275mod=be({type:t});static \u0275inj=he({imports:[le,re,de,K,ce,se,q,Ge,Ee,le,re]})}return t})();export{U as a,Ai as b};
