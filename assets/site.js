/* Shared on every page: theme toggle, toast, copy-email buttons. */
(function(){
  var root=document.documentElement;
  var tt,t=document.getElementById('toast');
  function toast(m){if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(function(){t.classList.remove('show');},1600);}
  window.siteToast=toast;
  var tb=document.getElementById('theme-toggle');
  function current(){var v=root.getAttribute('data-theme');if(v)return v;return matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}
  if(tb)tb.addEventListener('click',function(){var n=current()==='dark'?'light':'dark';root.setAttribute('data-theme',n);try{localStorage.setItem('theme',n);}catch(e){}toast(n==='dark'?'Dark theme':'Light theme');});
  document.querySelectorAll('[data-copy]').forEach(function(cb){
    var em=document.getElementById(cb.getAttribute('data-copy'));if(!em)return;
    cb.addEventListener('click',function(){var v=em.textContent.trim();
      function fallback(){var r=document.createRange();r.selectNodeContents(em);var s=getSelection();s.removeAllRanges();s.addRange(r);toast('Selected - press Ctrl+C to copy');}
      try{navigator.clipboard.writeText(v).then(function(){toast('Email copied');},fallback);}catch(e){fallback();}});
  });
})();
