
(() => {
  const params = new URLSearchParams(location.search);
  const clean = (value,fallback) => String(value || "").replace(/[<>"'`]/g,"").replace(/\s+/g," ").trim().slice(0,42) || fallback;
  const nombre = clean(params.get("nombre") || params.get("para") || params.get("n"),"alguien especial");
  const tono = clean(params.get("tono") || params.get("luz"),"esperanza").toLowerCase();
  const templates = {
    paz:{label:"paz",text:"Que el Señor ponga paz en tu corazón, serenidad en tus pensamientos y descanso en todo lo que hoy llevas por dentro.\n\nQue, en medio del ruido, puedas sentir una luz pequeña pero fiel acompañando tu camino."},
    fortaleza:{label:"fortaleza",text:"Que el Señor te sostenga en lo difícil, te regale paciencia para atravesar cada paso y te recuerde que ningún esfuerzo hecho con amor se pierde.\n\nQue Cristo camine contigo y fortalezca tu corazón."},
    esperanza:{label:"esperanza",text:"Que el Señor ilumine tu camino con esperanza. Que donde haya cansancio vuelva a nacer una pequeña alegría, y donde haya incertidumbre aparezca una señal de luz.\n\nNo caminas solo. Tu vida está en manos de Dios."},
    consuelo:{label:"consuelo",text:"Que el Señor te abrace con ternura en todo lo que hoy pesa. Que encuentres consuelo, compañía y una paz suave que no borra la historia, pero ayuda a respirar.\n\nQue la Virgen te cubra con su manto y te acompañe."},
    gratitud:{label:"gratitud",text:"Gracias, Señor, por su vida, por el bien que ha sembrado y por la luz que deja en quienes le quieren.\n\nBendice su camino, sus alegrías, sus luchas y todo lo que guarda en el corazón."}
  };
  const selected = templates[tono] || templates.esperanza;
  const fullPrayer = `${nombre},\n\nalguien ha querido regalarte una oración.\n\n${selected.text}\n\nAmén.`;
  document.title = `${nombre}, una oración para ti | Peregrino APP`;
  document.getElementById("headline").innerHTML = `${nombre}, hay una oración preparada <em>para ti.</em>`;
  document.getElementById("cardTitle").innerHTML = `${nombre}<span>una oración para ti</span>`;
  document.getElementById("subtitle").textContent = `Hoy alguien quiso regalarte esta oración con ${selected.label}.`;
  document.getElementById("prayerText").textContent = selected.text;
  const shareMessage = `Hoy pensé en ti y quise dejarte una pequeña luz. La preparé para ti aquí: ${location.href}`;
  document.getElementById("shareWhats").href = "https://wa.me/?text=" + encodeURIComponent(shareMessage);

  function showToast(message) {
    const toast = document.getElementById("toast"); toast.textContent=message || "Copiado"; toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"),1700);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => showToast("Oración copiada"));
    else {
      const area=document.createElement("textarea"); area.value=text; area.style.position="fixed"; area.style.left="-9999px";
      document.body.appendChild(area); area.focus(); area.select(); document.execCommand("copy"); area.remove(); showToast("Oración copiada");
    }
  }
  document.getElementById("copyPrayer").addEventListener("click",() => copy(fullPrayer));

  function wrap(ctx,text,x,y,maxWidth,lineHeight) {
    const words=text.split(" "); let line="",currentY=y;
    words.forEach((word) => {
      const test=line+word+" ";
      if (ctx.measureText(test).width>maxWidth && line) { ctx.fillText(line.trim(),x,currentY); line=word+" "; currentY+=lineHeight; }
      else line=test;
    });
    ctx.fillText(line.trim(),x,currentY); return currentY+lineHeight;
  }
  function buildCard() {
    const canvas=document.createElement("canvas"); canvas.width=1080; canvas.height=1350; const ctx=canvas.getContext("2d");
    const gradient=ctx.createLinearGradient(0,0,0,1350); gradient.addColorStop(0,"#fffaf0"); gradient.addColorStop(.55,"#f4ecd7"); gradient.addColorStop(1,"#fff");
    ctx.fillStyle=gradient; ctx.fillRect(0,0,1080,1350); ctx.strokeStyle="rgba(200,148,26,.45)"; ctx.lineWidth=3; ctx.strokeRect(46,46,988,1258);
    ctx.beginPath(); ctx.arc(540,210,62,0,Math.PI*2);
    const seal=ctx.createRadialGradient(515,188,8,540,210,62); seal.addColorStop(0,"#fff4bf"); seal.addColorStop(.6,"#d8ac34"); seal.addColorStop(1,"#a6720b");
    ctx.fillStyle=seal; ctx.fill(); ctx.fillStyle="#33210a"; ctx.font="64px Georgia, serif"; ctx.textAlign="center"; ctx.fillText("✝",540,234);
    ctx.fillStyle="#c8941a"; ctx.font="700 26px Arial, sans-serif"; ctx.fillText("U N A   O R A C I Ó N   P A R A",540,330);
    ctx.fillStyle="#102b55"; ctx.font="600 84px Georgia, serif"; ctx.fillText(nombre.length>16?nombre.slice(0,16)+"…":nombre,540,430);
    ctx.strokeStyle="rgba(200,148,26,.5)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(420,478);ctx.lineTo(660,478);ctx.stroke();
    ctx.fillStyle="#1f3327";ctx.font="italic 40px Georgia, serif";const endY=wrap(ctx,selected.text.replace(/\n+/g," "),540,560,820,58);
    ctx.fillStyle="#c8941a";ctx.font="italic 600 44px Georgia, serif";ctx.fillText("Amén.",540,Math.min(endY+30,1180));
    ctx.fillStyle="rgba(27,33,27,.55)";ctx.font="700 28px Arial, sans-serif";ctx.fillText("✦  Peregrino APP",540,1250);
    return canvas;
  }
  function shareImage() {
    buildCard().toBlob((blob) => {
      if (!blob) { showToast("No se pudo crear la imagen"); return; }
      const file=new File([blob],"oracion-peregrino.png",{type:"image/png"});
      const text="Hoy pensé en ti y quise dejarte una pequeña luz. "+location.href;
      if (navigator.canShare && navigator.canShare({files:[file]})) navigator.share({files:[file],text,title:"Una oración para ti"}).catch(()=>{});
      else {
        const anchor=document.createElement("a");anchor.href=URL.createObjectURL(blob);anchor.download="oracion-peregrino.png";anchor.click();
        setTimeout(() => { URL.revokeObjectURL(anchor.href); window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank","noopener"); },400);
        showToast("Imagen descargada · se abre WhatsApp");
      }
    },"image/png");
  }
  document.getElementById("shareImg").addEventListener("click",shareImage);
})();
