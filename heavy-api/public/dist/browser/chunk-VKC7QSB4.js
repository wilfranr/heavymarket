import{$ as H,Z as V,aa as L,ba as f}from"./chunk-6GBDMTCE.js";import{J as $,K as T}from"./chunk-735KUJFF.js";import{k as A,l as Q,p as R,w as q}from"./chunk-LWZ5NFGU.js";import{$a as x,Aa as d,G as k,Ia as m,Ib as P,Kb as y,Sa as o,Ta as h,Ua as _,Va as b,Yb as j,Za as S,_a as z,d as M,e as I,g as E,ga as l,hb as s,i as g,kb as N,mb as v,nb as u,rb as D,ua as w,va as B,vb as c,ya as F,za as O}from"./chunk-5FPXF5CH.js";var G=`
    .p-timeline {
        display: flex;
        flex-grow: 1;
        flex-direction: column;
        direction: ltr;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .p-timeline-left .p-timeline-event-opposite {
        text-align: right;
    }

    .p-timeline-left .p-timeline-event-content {
        text-align: left;
    }

    .p-timeline-right .p-timeline-event {
        flex-direction: row-reverse;
    }

    .p-timeline-right .p-timeline-event-opposite {
        text-align: left;
    }

    .p-timeline-right .p-timeline-event-content {
        text-align: right;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(even) {
        flex-direction: row-reverse;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(odd) .p-timeline-event-opposite {
        text-align: right;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(odd) .p-timeline-event-content {
        text-align: left;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(even) .p-timeline-event-opposite {
        text-align: left;
    }

    .p-timeline-vertical.p-timeline-alternate .p-timeline-event:nth-child(even) .p-timeline-event-content {
        text-align: right;
    }

    .p-timeline-vertical .p-timeline-event-opposite,
    .p-timeline-vertical .p-timeline-event-content {
        padding: dt('timeline.vertical.event.content.padding');
    }

    .p-timeline-vertical .p-timeline-event-connector {
        width: dt('timeline.event.connector.size');
    }

    .p-timeline-event {
        display: flex;
        position: relative;
        min-height: dt('timeline.event.min.height');
    }

    .p-timeline-event:last-child {
        min-height: 0;
    }

    .p-timeline-event-opposite {
        flex: 1;
    }

    .p-timeline-event-content {
        flex: 1;
    }

    .p-timeline-event-separator {
        flex: 0;
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .p-timeline-event-marker {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        align-self: baseline;
        border-width: dt('timeline.event.marker.border.width');
        border-style: solid;
        border-color: dt('timeline.event.marker.border.color');
        border-radius: dt('timeline.event.marker.border.radius');
        width: dt('timeline.event.marker.size');
        height: dt('timeline.event.marker.size');
        background: dt('timeline.event.marker.background');
    }

    .p-timeline-event-marker::before {
        content: ' ';
        border-radius: dt('timeline.event.marker.content.border.radius');
        width: dt('timeline.event.marker.content.size');
        height: dt('timeline.event.marker.content.size');
        background: dt('timeline.event.marker.content.background');
    }

    .p-timeline-event-marker::after {
        content: ' ';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: dt('timeline.event.marker.border.radius');
        box-shadow: dt('timeline.event.marker.content.inset.shadow');
    }

    .p-timeline-event-connector {
        flex-grow: 1;
        background: dt('timeline.event.connector.color');
    }

    .p-timeline-horizontal {
        flex-direction: row;
    }

    .p-timeline-horizontal .p-timeline-event {
        flex-direction: column;
        flex: 1;
    }

    .p-timeline-horizontal .p-timeline-event:last-child {
        flex: 0;
    }

    .p-timeline-horizontal .p-timeline-event-separator {
        flex-direction: row;
    }

    .p-timeline-horizontal .p-timeline-event-connector {
        width: 100%;
        height: dt('timeline.event.connector.size');
    }

    .p-timeline-horizontal .p-timeline-event-opposite,
    .p-timeline-horizontal .p-timeline-event-content {
        padding: dt('timeline.horizontal.event.content.padding');
    }

    .p-timeline-horizontal.p-timeline-alternate .p-timeline-event:nth-child(even) {
        flex-direction: column-reverse;
    }

    .p-timeline-bottom .p-timeline-event {
        flex-direction: column-reverse;
    }
`;var U=["content"],W=["opposite"],X=["marker"],C=e=>({$implicit:e});function Y(e,a){e&1&&x(0)}function Z(e,a){e&1&&x(0)}function ee(e,a){if(e&1&&(S(0),d(1,Z,1,0,"ng-container",3),z()),e&2){let t=s().$implicit,r=s();l(),o("ngTemplateOutlet",r.markerTemplate||r._markerTemplate)("ngTemplateOutletContext",y(2,C,t))}}function te(e,a){if(e&1&&b(0,"div",2),e&2){let t=s(2);c(t.cx("eventMarker")),o("pBind",t.ptm("eventMarker")),m("data-p",t.dataP)}}function ne(e,a){if(e&1&&b(0,"div",2),e&2){let t=s(2);c(t.cx("eventConnector")),o("pBind",t.ptm("eventConnector")),m("data-p",t.dataP)}}function ie(e,a){e&1&&x(0)}function re(e,a){if(e&1&&(h(0,"div",2)(1,"div",2),d(2,Y,1,0,"ng-container",3),_(),h(3,"div",2),d(4,ee,2,4,"ng-container",4)(5,te,1,4,"ng-template",null,0,j)(7,ne,1,4,"div",5),_(),h(8,"div",2),d(9,ie,1,0,"ng-container",3),_()()),e&2){let t=a.$implicit,r=a.last,i=D(6),n=s();c(n.cx("event")),o("pBind",n.ptm("event")),m("data-p",n.dataP),l(),c(n.cx("eventOpposite")),o("pBind",n.ptm("eventOpposite")),m("data-p",n.dataP),l(),o("ngTemplateOutlet",n.oppositeTemplate||n._oppositeTemplate)("ngTemplateOutletContext",y(23,C,t)),l(),c(n.cx("eventSeparator")),o("pBind",n.ptm("eventSeparator")),m("data-p",n.dataP),l(),o("ngIf",n.markerTemplate||n._markerTemplate)("ngIfElse",i),l(3),o("ngIf",!r),l(),c(n.cx("eventContent")),o("pBind",n.ptm("eventContent")),m("data-p",n.dataP),l(),o("ngTemplateOutlet",n.contentTemplate||n._contentTemplate)("ngTemplateOutletContext",y(25,C,t))}}var oe={root:({instance:e})=>["p-timeline p-component","p-timeline-"+e.align,"p-timeline-"+e.layout],event:"p-timeline-event",eventOpposite:"p-timeline-event-opposite",eventSeparator:"p-timeline-event-separator",eventMarker:"p-timeline-event-marker",eventConnector:"p-timeline-event-connector",eventContent:"p-timeline-event-content"},J=(()=>{class e extends V{name="timeline";style=G;classes=oe;static \u0275fac=(()=>{let t;return function(i){return(t||(t=k(e)))(i||e)}})();static \u0275prov=M({token:e,factory:e.\u0275fac})}return e})();var K=new E("TIMELINE_INSTANCE"),le=(()=>{class e extends L{componentName="Timeline";bindDirectiveInstance=g(f,{self:!0});$pcTimeline=g(K,{optional:!0,skipSelf:!0})??void 0;onAfterViewChecked(){this.bindDirectiveInstance.setAttrs(this.ptms(["host","root"]))}value;styleClass;align="left";layout="vertical";contentTemplate;oppositeTemplate;markerTemplate;templates;_contentTemplate;_oppositeTemplate;_markerTemplate;_componentStyle=g(J);getBlockableElement(){return this.el.nativeElement.children[0]}onAfterContentInit(){this.templates.forEach(t=>{switch(t.getType()){case"content":this._contentTemplate=t.template;break;case"opposite":this._oppositeTemplate=t.template;break;case"marker":this._markerTemplate=t.template;break}})}get dataP(){return this.cn({[this.layout]:this.layout,[this.align]:this.align})}static \u0275fac=(()=>{let t;return function(i){return(t||(t=k(e)))(i||e)}})();static \u0275cmp=w({type:e,selectors:[["p-timeline"]],contentQueries:function(r,i,n){if(r&1&&N(n,U,4)(n,W,4)(n,X,4)(n,$,4),r&2){let p;v(p=u())&&(i.contentTemplate=p.first),v(p=u())&&(i.oppositeTemplate=p.first),v(p=u())&&(i.markerTemplate=p.first),v(p=u())&&(i.templates=p)}},hostVars:3,hostBindings:function(r,i){r&2&&(m("data-p",i.dataP),c(i.cn(i.cx("root"),i.styleClass)))},inputs:{value:"value",styleClass:"styleClass",align:"align",layout:"layout"},features:[P([J,{provide:K,useExisting:e},{provide:H,useExisting:e}]),F([f]),O],decls:1,vars:1,consts:[["marker",""],[3,"pBind","class",4,"ngFor","ngForOf"],[3,"pBind"],[4,"ngTemplateOutlet","ngTemplateOutletContext"],[4,"ngIf","ngIfElse"],[3,"pBind","class",4,"ngIf"]],template:function(r,i){r&1&&d(0,re,10,27,"div",1),r&2&&o("ngForOf",i.value)},dependencies:[q,A,Q,R,T,f],encapsulation:2,changeDetection:0})}return e})(),Ie=(()=>{class e{static \u0275fac=function(r){return new(r||e)};static \u0275mod=B({type:e});static \u0275inj=I({imports:[le,T,T]})}return e})();export{le as a,Ie as b};
