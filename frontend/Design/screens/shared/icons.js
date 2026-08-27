/* VULCAN — icons.js · lucide-style 24px, 1.5px stroke, custom ember/anvil/spark/plate (input-DESIGN.md §5) */
(function(){
  var ICONS = {
    flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    spark:'<path d="M12 2L13.75 10.25 22 12 13.75 13.75 12 22 10.25 13.75 2 12 10.25 10.25Z"/>',
    anvil:'<path d="M4 9h16l-2.5 7H6.5L4 9Z"/><path d="M4 9c-1.6 0-1.7-2.5-.3-2.5.9 0 1.4-2 1.9-3.5h2.6c-.2 1.8-1 3.4-1.4 6"/><path d="M6.5 16h11l-.6 2.5H7.1L6.5 16Z"/><path d="M9 21.5h6"/>',
    plate:'<path d="M3 9v6M6 8v8M6 12h12M18 8v8M21 9v6"/>',
    apple:'<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
    chart:'<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 14l3-3 3 3 5-6"/>',
    person:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    'chevron-left':'<path d="M15 18l-6-6 6-6"/>',
    'chevron-right':'<path d="M9 18l6-6-6-6"/>',
    search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    timer:'<circle cx="12" cy="13.5" r="8"/><path d="M12 13.5V9.5"/><path d="M10 2.5h4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
    more:'<path d="M12 12.5h.01M6 12.5h.01M18 12.5h.01"/>',
    note:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    camera:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    refresh:'<path d="M21 12a9 9 0 0 0-14.9-6.5L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 14.9 6.5L21 16"/><path d="M21 21v-5h-5"/>',
    trash:'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
    download:'<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    sliders:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
    target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="1.5"/>',
    zap:'<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>',
    scale:'<path d="m16 16 3-8 3 8c0 1.5-1.5 3-3 3s-3-1.5-3-3z"/><path d="m2 16 3-8 3 8c0 1.5-1.5 3-3 3s-3-1.5-3-3z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    pencil:'<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    'arrow-left':'<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
    'arrow-right':'<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
    move:'<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    'play-circle':'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8z"/>'
  };
  function icon(name,opt){
    opt=opt||{};
    var s=opt.size||24;
    var attrs='fill="none" stroke="currentColor" stroke-width="1.5"';
    if(opt.filled){attrs='fill="currentColor" stroke="none"';}
    else if(opt.stroke){attrs='fill="none" stroke="currentColor" stroke-width="'+opt.stroke+'"';}
    return '<svg xmlns="http://www.w3.org/2000/svg" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" '+attrs+
      ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(ICONS[name]||'')+'</svg>';
  }
  window.VULCAN_ICONS={ icon:icon, names:function(){return Object.keys(ICONS);} };
})();