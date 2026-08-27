/* VULCAN — shell.js · app shell, route map, toast, bottom sheet (P5) */
(function(){
  'use strict';
  var MOCK = window.OD_MOCK || {};
  var IC = window.VULCAN_ICONS.icon;

  var TABS = [
    { id:'today',     label:'Today',     icon:'flame' },
    { id:'nutrition', label:'Nutrition', icon:'apple' },
    { id:'train',     label:'Train',     icon:'spark',  center:true },
    { id:'progress',  label:'Progress',  icon:'chart' },
    { id:'profile',   label:'Profile',   icon:'person' }
  ];
  var ROUTES = {
    today:'s06-today.html',
    nutrition:'s16-nutrition-diary.html',
    train:'s07-train-home.html',
    progress:'s21-progress-home.html',
    profile:'s27-profile.html'
  };
  var LAUNCHER='../index.html'; /* fallback for phase-gated tabs */

  function routeHref(id){ return ROUTES[id] || LAUNCHER; }

  /* ---------- overlays ---------- */
  var toastTimer=null;
  function toast(title, sub, ember){
    var el=document.createElement('div');
    el.className='toast'+(ember?' is-ember':'');
    el.setAttribute('role','status');
    el.innerHTML='<span class="toast-icon">'+(ember?IC('spark',{filled:true}):IC('check'))+'</span>'+
      '<span class="toast-body"><span class="toast-title">'+title+'</span>'+(sub?'<span class="toast-sub">'+sub+'</span>':'')+'</span>';
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('is-open'); });
    clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){ el.classList.remove('is-open'); setTimeout(function(){el.remove();},260); }, 3200);
  }

  function sheet(title, bodyHTML){
    var back=document.createElement('div'); back.className='sheet-backdrop';
    var sh=document.createElement('div'); sh.className='sheet';
    sh.setAttribute('role','dialog'); sh.setAttribute('aria-modal','true');
    sh.innerHTML='<div class="sheet-handle"></div><div class="sheet-title">'+title+'</div>'+
      '<div class="sheet-body">'+bodyHTML+'</div>'+
      '<button class="btn btn-primary" data-full data-sheet-close>OK</button>';
    back.addEventListener('click',close); sh.querySelectorAll('[data-sheet-close]').forEach(function(b){b.addEventListener('click',close);});
    document.body.appendChild(back); document.body.appendChild(sh);
    requestAnimationFrame(function(){ back.classList.add('is-open'); sh.classList.add('is-open'); });
    function close(){ back.classList.remove('is-open'); sh.classList.remove('is-open');
      setTimeout(function(){ back.remove(); sh.remove(); },300); }
  }

  /* ---------- panels ---------- */
  function panelToday(m){
    var kcal=m.today.kcal, mac=m.today.macros, pct=Math.round(kcal.consumed/kcal.target*100);
    var rest=kcal.target-kcal.consumed;
    return ''
    +'<div class="app-topbar"><div><div class="app-title">Today</div><div class="app-sub">Tuesday 26 Aug</div></div>'
    +  '<span class="streak is-lit" data-od-id="streak-flame">'+IC('flame',{filled:true})+'<span class="streak-font tnum">'+m.user.streak+'</span></span></div>'
    +'<span class="placeholder-chip">'+IC('zap',{size:14})+' Placeholder · S6 ships in P7</span>'
    +'<div class="stack-sm">'
    +'<div class="card" data-od-id="hero-ring"><div class="spread" style="margin-bottom:12px">'
    +  '<span class="fs-label c-secondary">Calories</span><span class="pr-badge">'+IC('spark',{size:13,stroke:2})+rest+' left</span></div>'
    +'<div class="ring" data-ring="'+pct+'" style="--ring-size:172px;margin-inline:auto"><svg viewBox="0 0 120 120">'
    +  '<defs><linearGradient id="ringGradX" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB347"/><stop offset="1" stop-color="#C2410C"/></linearGradient></defs>'
    +  '<circle class="ring-track" cx="60" cy="60" r="48" pathLength="100"/><circle class="ring-fill" cx="60" cy="60" r="48" pathLength="100" stroke="url(#ringGradX)" stroke-dasharray="100" stroke-dashoffset="100"/></svg>'
    +'<div class="ring-center"><div><div class="ring-value tnum">'+rest+'</div><div class="ring-caption">kcal remaining</div></div></div></div>'
    +'<div class="macro-bar" style="margin-top:16px"><i style="width:81%;background:var(--macro-protein)"></i><i style="width:55%;background:var(--macro-carbs)"></i><i style="width:70%;background:var(--macro-fat)"></i></div>'
    +'<div class="macro-legend" style="margin-top:10px">'
    +  '<span class="ml"><span class="dot" data-macro="protein"></span>Protein <b class="tnum">'+mac.protein.eat+'/'+mac.protein.goal+'g</b></span>'
    +  '<span class="ml"><span class="dot" data-macro="carbs"></span>Carbs <b class="tnum">'+mac.carbs.eat+'/'+mac.carbs.goal+'g</b></span>'
    +  '<span class="ml"><span class="dot" data-macro="fat"></span>Fat <b class="tnum">'+mac.fat.eat+'/'+mac.fat.goal+'g</b></span></div>'
    +'</div></div>'
    +'<div class="grid2">'
    +'<div class="stat-tile" data-od-id="stat-steps"><span class="st-label">Steps</span><span class="st-value tnum">'+m.today.steps.count.toLocaleString()+'</span>'
    +  '<svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none"><g>'+
        m.weeklySteps.map(function(v,i){ return '<rect x="'+(i*13+2)+'" y="'+(30-v/11000*26)+'" width="8" height="'+(v/11000*26)+'" rx="2" fill="'+(i===6?'#3ECF8E':'rgba(62,207,142,.35)')+'"/>'; }).join('')+
      '</g></svg></div>'
    +'<div class="stat-tile" data-od-id="stat-weight"><span class="st-label">Weight</span><span class="st-value tnum">'+m.today.weight.v+'<span class="fs-caption c-muted"> kg</span></span>'
    +  '<span class="st-delta down"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2v8M2.5 6.5 6 10l3.5-3.5"/></svg>'+m.today.weight.delta+' kg · 7d</span></div>'
    +'</div>'
    +'<div class="card spread" data-od-id="workout-card"><div class="stack-sm"><span class="fs-label c-secondary">Today · Program</span>'
    +  '<span class="fs-h3">'+m.activeRoutine.name+'</span><span class="fs-caption c-muted">'+m.activeRoutine.week+' · '+m.activeRoutine.exercises.length+' exercises</span></div>'
    +  '<button class="btn btn-primary" data-od-id="cta-start">Start</button></div>'
    +'<div class="coach-note" data-od-id="coach-note"><span class="cn-meta">'+IC('spark',{size:13})+' VULCAN coach</span><span class="cn-body">'+m.today.coach+'</span><span class="cn-foot">AI guidance — review before logging</span></div>';
  }

  function panelNutrition(m){
    var kcal=m.today.kcal, pct=Math.round(kcal.consumed/kcal.target*100);
    return ''
    +'<div class="app-topbar"><div><div class="app-title">Nutrition</div><div class="app-sub">Diary · '+kcal.consumed.toLocaleString()+' kcal</div></div>'
    +'<button class="btn btn-primary btn-sm" data-od-id="fab-add">'+IC('plus',{size:16})+' Add</button></div>'
    +'<span class="placeholder-chip">'+IC('zap',{size:14})+' Placeholder · S16–S19 ship in P9</span>'
    +'<div class="row" style="flex-wrap:nowrap;overflow-x:auto"><div class="segmented">'
    +  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(function(d,i){ return '<button aria-pressed="'+(i===2)+'" data-od-id="day-chip-'+(i+1)+'">'+d+'</button>'; }).join('')
    +'</div></div>'
    +'<div class="card"><div class="ring" data-ring="'+pct+'" style="--ring-size:132px;margin-inline:auto"><svg viewBox="0 0 120 120">'
    +'<defs><linearGradient id="ringGradN" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB347"/><stop offset="1" stop-color="#C2410C"/></linearGradient></defs>'
    +'<circle class="ring-track" cx="60" cy="60" r="48" pathLength="100"/><circle class="ring-fill" cx="60" cy="60" r="48" pathLength="100" stroke="url(#ringGradN)" stroke-dasharray="100" stroke-dashoffset="100"/></svg>'
    +'<div class="ring-center"><div><div class="ring-value" style="font-size:var(--fs-title)">'+pct+'%</div><div class="ring-caption">of '+kcal.target.toLocaleString()+'</div></div></div></div>'
    +'</div>'
    +'<div class="text" style="margin-top:14px"><span class="fs-label c-secondary">Macros</span></div>'
    +'<div class="card"><div class="macro-bar"><i style="width:81%;background:var(--macro-protein)"></i><i style="width:55%;background:var(--macro-carbs)"></i><i style="width:70%;background:var(--macro-fat)"></i></div>'
    +'<div class="macro-legend" style="margin-top:10px"><span class="ml"><span class="dot" data-macro="protein"></span>P <b class="tnum">146g</b></span>'
    +'<span class="ml"><span class="dot" data-macro="carbs"></span>C <b class="tnum">142g</b></span>'
    +'<span class="ml"><span class="dot" data-macro="fat"></span>F <b class="tnum">48g</b></span></div></div>';
  }

  function panelTrain(m){
    var ex=m.activeRoutine.exercises;
    function setRow(s,i){
      return '<div class="set-row'+(s.done?' is-lit':'')+'" data-od-id="set-row-'+i+'">'
        +'<span class="set-num tnum">'+i+'</span>'
        +'<span class="set-prev">'+(s.prev||'\u00a0')+'</span>'
        +'<input class="set-field tnum" inputmode="numeric" placeholder="kg" value="'+(s.kg||'')+'">'
        +'<input class="set-field tnum" inputmode="numeric" placeholder="reps" value="'+(s.reps||'')+'">'
        +'<input class="set-field tnum" inputmode="numeric" placeholder="RPE" value="'+(s.rpe||'')+'">'
        +'<button class="set-check'+(s.done?' is-done':'')+'" data-toggle-set aria-label="Complete set '+i+'">'+IC('check',{stroke:2})+'</button>'
        +'</div>';
    }
    return ''
    +'<div class="app-topbar"><div><div class="app-title">Train</div><div class="app-sub">'+m.activeRoutine.name+' · '+m.activeRoutine.week+'</div></div>'
    +'<span class="pr-badge" data-od-id="pr-badge">'+IC('spark',{size:12})+' PR</span></div>'
    +'<span class="placeholder-chip">'+IC('zap',{size:14})+' Placeholder · S7/S10/S11 ship in P8</span>'
    +'<div class="exercise-card" data-od-id="exercise-card-bench" style="margin-top:12px">'
    +'<div class="exercise-head"><div class="stack-sm"><span class="exercise-kicker">1 · Chest</span><span class="exercise-name">Bench Press</span></div>'
    +'<div class="exercise-head-actions"><button class="btn-icon" aria-label="Note">'+IC('note')+'</button><button class="btn-icon" aria-label="More">'+IC('more')+'</button></div></div>'
    +'<div class="set-list">'+ex[0].sets.map(setRow).join('')+'</div>'
    +'<button class="add-set" data-od-id="add-set">'+IC('plus',{size:14})+' Add set</button></div>'
    +'<div class="exercise-card" data-superset style="--sup-color:#FFB347;margin-top:12px">'
    +'<div class="exercise-head"><div class="stack-sm"><span class="exercise-kicker">2 · Shoulders · superset</span><span class="exercise-name">Overhead Press</span></div>'
    +'<div class="exercise-head-actions"><button class="btn-icon" aria-label="Note">'+IC('note')+'</button><button class="btn-icon" aria-label="More">'+IC('more')+'</button></div></div>'
    +'<div class="set-list">'+ex[1].sets.map(setRow).join('')+'</div></div>'
    +'<div class="rest-timer" data-od-id="rest-timer" data-total="120" style="margin-top:16px">'
    +'<div class="rest-ring"><svg viewBox="0 0 56 56"><defs><linearGradient id="restGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB347"/><stop offset="1" stop-color="#C2410C"/></linearGradient></defs>'
    +'<circle class="rest-track" cx="28" cy="28" r="24" pathLength="100"/>'
    +'<circle class="rest-fill" cx="28" cy="28" r="24" pathLength="100" stroke="url(#restGrad)" stroke-dasharray="100" stroke-dashoffset="0"/></svg><span class="rest-sec tnum">2:00</span></div>'
    +'<div class="rest-labels"><span class="rest-state">'+IC('clock',{size:12})+' Rest · auto</span><span class="rest-total">Next set starts on its own</span></div>'
    +'<div class="rest-actions"><button class="btn-icon btn-secondary" data-od-id="rest-plus" aria-label="Add 30s">'+IC('plus')+'</button>'
    +'<button class="btn btn-secondary btn-sm" data-od-id="rest-skip">Skip</button></div></div>';
  }

  function panelProgress(m){
    var w=m.weightTrend;
    var pts=w.map(function(v,i){return (i/(w.length-1)*250)+','+(100-(v-w[0]+0.9)/1.5*80);}).join(' ');
    var area='M0,120 L'+pts.replace(/ /g,' L')+' L250,120 Z';
    return ''
    +'<div class="app-topbar"><div><div class="app-title">Progress</div><div class="app-sub">8-week window</div></div></div>'
    +'<span class="placeholder-chip">'+IC('zap',{size:14})+' Placeholder · S21–S24 ship in P10</span>'
    +'<div class="card" style="margin-top:12px"><div class="spread" style="margin-bottom:10px"><span class="fs-label c-secondary">Weight</span>'
    +'<div class="segmented" data-od-id="weight-window"><button aria-pressed="false">30</button><button aria-pressed="true">90</button><button aria-pressed="false">All</button></div></div>'
    +'<svg class="chart chart-area" viewBox="0 0 250 120" preserveAspectRatio="none"><defs>'
    +'<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,106,0,.35)"/><stop offset="1" stop-color="rgba(255,106,0,0)"/></linearGradient></defs>'
    +'<g class="chart-grid">'+[30,60,90,120].map(function(y){return '<line x1="0" y1="'+y+'" x2="250" y2="'+y+'"/>';}).join('')+'</g>'
    +'<path class="chart-area-fill" d="'+area+'"/><path class="chart-area-line" d="M'+pts+'"/></svg></div>'
    +'<div class="card"><span class="fs-label c-secondary" style="margin-bottom:10px">PR wall</span>'
    +'<div class="row">'
    +'<span class="pr-badge" data-od-id="pr-bench">'+IC('spark',{size:12})+' Bench · 102.5×5</span>'
    +'<span class="pr-badge" data-od-id="pr-deadlift">'+IC('spark',{size:12})+' Deadlift · 180×3</span>'
    +'<span class="pr-badge" data-od-id="pr-squat">'+IC('spark',{size:12})+' Squat · 140×5</span></div></div>';
  }

  function panelProfile(m){
    return ''
    +'<div class="app-topbar"><div class="row"><div style="width:56px;height:56px;border-radius:50%;background:var(--grad-flame);display:grid;place-items:center;font-family:var(--font-display);font-weight:700;color:var(--text-on-accent)">'+m.user.name.charAt(0)+'</div>'
    +'<div class="stack-sm"><span class="fs-h2">'+m.user.name+'</span><span class="fs-caption c-muted">'+m.user.goal+'</span></div></div></div>'
    +'<span class="placeholder-chip">'+IC('zap',{size:14})+' Placeholder · S27–S30 ship in P12</span>'
    +'<div class="card stack-sm" data-od-id="settings-list" style="margin-top:12px">'
    +[['Edit profile','pencil'],['Goals & targets','target'],['Units & equipment','plate'],['AI usage · 2 of 5 scans','sliders'],['Privacy & data','download']].map(function(r){
      return '<button class="spread" style="width:100%;min-height:48px;border-radius:var(--r-sm);color:var(--text-primary)"><span class="fs-body">'+r[0]+'</span><span class="row" style="gap:8px">'+IC(r[1],{size:18})+'<span class="c-muted">'+IC('chevron-right',{size:18})+'</span></span></button>';
    }).join('')
    +'<button class="btn btn-destructive btn-sm" data-od-id="sign-out" style="align-self:flex-start">Sign out</button></div>'
    +'<div class="card" style="margin-top:12px"><div class="spread" style="margin-bottom:8px"><span class="fs-label c-secondary">Scans left today</span><span class="tnum c-ember fs-label">2 of 5</span></div>'
    +'<div class="quota-track"><div class="quota-fill" style="width:40%"></div></div><p class="fs-caption c-muted" style="margin-top:6px">The forge cools at midnight.</p></div>';
  }

  var PANELS={ today:panelToday, nutrition:panelNutrition, train:panelTrain, progress:panelProgress, profile:panelProfile };

  /* ---------- mount ---------- */
  function mount(host){
    var m=MOCK;
    var bar='<nav class="tab-bar" aria-label="Primary navigation">'
      +TABS.map(function(t){
        if(t.center){
          return '<div class="train-slot"><button class="train-btn" data-tab="train" data-od-id="tab-train" aria-label="Train">'+IC('spark',{filled:true,size:28})+'</button></div>';
        }
        return '<button class="tab-btn" data-tab="'+t.id+'" data-od-id="tab-'+t.id+'" aria-pressed="false">'
          +'<span class="tab-icon">'+IC(t.icon)+'</span><span>'+t.label+'</span></button>';
      }).join('')
      +'</nav>'
      +'<main class="app-content">'+TABS.map(function(t){
        return '<section class="tabpanel" id="panel-'+t.id+'" data-od-id="panel-'+t.id+'" hidden></section>';
      }).join('')+'</main>';
    host.innerHTML=bar;
    host.setAttribute('data-od-id','app-shell');

    var active=null;
    function show(id){
      var tp=host.querySelector('#panel-'+id);
      if(!tp) return;
      tp.innerHTML='<div class="placeholder-panel">'+(PANELS[id]?PANELS[id](m):'')+'</div>';
      host.querySelectorAll('.tab-btn').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.tab===id)); b.classList.toggle('is-active', b.dataset.tab===id); });
      if(active) active.hidden=true;
      tp.hidden=false;
      active=tp;
      requestAnimationFrame(animateIn);
    }
    function animateIn(){
      host.querySelectorAll('[data-ring]').forEach(function(r){ setRing(r, +r.getAttribute('data-ring')); });
    }
    host.addEventListener('click', function(e){
      var t;
      if((t=e.target.closest('[data-tab]'))) show(t.dataset.tab);
      else if((t=e.target.closest('[data-toggle-set]'))){ t.classList.toggle('is-done'); t.closest('.set-row').classList.toggle('is-lit', t.classList.contains('is-done'));
        if(t.classList.contains('is-done')) window.OD.toast('Set complete','Reps and load logged','ember'); }
      else if((t=e.target.closest('.segmented button'))){ t.parentElement.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed','false');}); t.setAttribute('aria-pressed','true'); }
      else if((t=e.target.closest('[data-od-id="rest-plus"]'))){ var rt=host.querySelector('.rest-timer'); var v=+rt.getAttribute('data-remaining')||+rt.getAttribute('data-total'); v+=30; paintRest(rt,v); }
      else if((t=e.target.closest('[data-od-id="rest-skip"]'))){ var rt2=host.querySelector('.rest-timer'); paintRest(rt2,0); }
    });
    show('today');
  }

  function setRing(el,val){
    var fill=el.querySelector('.ring-fill'); if(!fill) return;
    requestAnimationFrame(function(){ fill.style.strokeDashoffset = String(100-Math.min(100,Math.max(0,val))); });
  }

  function paintRest(rt,secs){
    rt.setAttribute('data-remaining',secs);
    var mm=Math.floor(secs/60), ss=String(secs%60).padStart(2,'0');
    rt.querySelector('.rest-sec').textContent=mm+':'+ss;
    var fill=rt.querySelector('.rest-fill');
    if(fill) fill.style.strokeDashoffset=String((secs/(+rt.getAttribute('data-total')||120))*-0 + (100-(secs/(+rt.getAttribute('data-total')||120))*100));
    rt.classList.toggle('is-critical', secs>0 && secs<=10);
  }

  /* ---------- tab bar for real app screens ---------- */
  function tabbarHTML(active){
    return '<nav class="tab-bar" aria-label="Primary navigation">'
      +TABS.map(function(t){
        if(t.center){
          return '<div class="train-slot"><a class="train-btn" href="'+ROUTES.train+'" data-od-id="tab-train" aria-label="Train">'+IC('spark',{filled:true,size:28})+'</a></div>';
        }
        return '<a class="tab-btn'+(t.id===active?' is-active':'')+'" href="'+routeHref(t.id)+'" data-od-id="tab-'+t.id+'" aria-current="'+(t.id===active?'page':'false')+'">'
          +'<span class="tab-icon">'+IC(t.icon)+'</span><span>'+t.label+'</span></a>';
      }).join('')
      +'</nav>';
  }
  function mountBar(host, active){
    host.innerHTML = tabbarHTML(active);
  }

  window.OD={ toast:toast, sheet:sheet, mount:mount, mountBar:mountBar, tabbar:tabbarHTML, paintRest:paintRest, routeHref:routeHref };
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('[data-shell]').forEach(function(h){ mount(h); });
  });
})();