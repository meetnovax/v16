/* Mobile header: replaces the text links with the circle avatar (same as Base and Results). */
(function(){
  var n='B';
  try{var s=JSON.parse(localStorage.getItem('novax_builder_v4')||'{}');if(s&&s.name){n=String(s.name).trim().charAt(0).toUpperCase()||'B';}}catch(e){}
  var st=document.createElement('style');
  st.textContent='.nx-av{display:none;text-decoration:none}'+
  '@media(max-width:700px){.nx-av{display:grid;place-items:center;flex:0 0 auto;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#2d7df4,#8c51f6);color:#fff;font:800 11px Inter,ui-sans-serif,system-ui,sans-serif}'+
  '.about-links,.faq-links{display:none!important}'+
  '.header{position:relative}.header .nx-av{position:absolute;right:0;top:44px}}';
  document.head.appendChild(st);
  var a=document.createElement('a');a.className='nx-av';a.href='base.html';a.setAttribute('aria-label','Your Base');a.textContent=n;
  var host=document.querySelector('.about-nav,.faq-nav,header.header');
  if(host)host.appendChild(a);
})();
